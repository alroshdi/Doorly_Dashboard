import { parseISO, isValid, startOfDay, endOfDay } from "date-fns";
import { detectColumn, parseDate, type RequestData } from "@/lib/analytics";

export interface AdminReportSummary {
  totalOrders: number;
  totalCustomOrders: number;
  totalCustomers: number;
  totalRevenue: number;
}

export interface AdminOrderRow {
  orderId: string;
  customer: string;
  total: number;
  status: string;
  date: string;
}

export interface AdminCustomOrderRow {
  orderId: string;
  customer: string;
  service: string;
  price: number;
  status: string;
  date: string;
}

export interface AdminCustomerRow {
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
}

export interface AdminPaymentRow {
  paymentId: string;
  customer: string;
  amount: number;
  method: string;
  status: string;
  date: string;
}

export interface AdminReportPayload {
  generatedAt: string;
  periodLabel: string;
  summary: AdminReportSummary;
  orders: AdminOrderRow[];
  customOrders: AdminCustomOrderRow[];
  customers: AdminCustomerRow[];
  payments: AdminPaymentRow[];
}

function findColumnKey(row: RequestData, possible: string[]): string | null {
  const keys = Object.keys(row);
  for (const p of possible) {
    const pl = p.toLowerCase();
    const hit = keys.find((k) => k.toLowerCase() === pl || k.toLowerCase().includes(pl));
    if (hit) return hit;
  }
  return null;
}

function str(row: RequestData, ...keys: string[]): string {
  const k = findColumnKey(row, keys);
  if (!k) return "";
  return String(row[k] ?? "").trim();
}

function parseMoney(raw: string): number {
  if (!raw) return 0;
  const n = parseFloat(String(raw).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Best-effort row monetary total (Doorly sheets: price_from / price_to / amount). */
export function rowMonetaryTotal(row: RequestData): number {
  const to = parseMoney(str(row, "price_to", "السعر_إلى", "max_price"));
  const from = parseMoney(str(row, "price_from", "السعر_من", "min_price"));
  const amt = parseMoney(str(row, "amount", "total", "total_price", "payment_amount", "المبلغ"));
  if (amt > 0) return amt;
  if (to > 0 && from > 0) return (to + from) / 2;
  if (to > 0) return to;
  if (from > 0) return from;
  return 0;
}

function rowDate(row: RequestData, sample: RequestData[]): Date | null {
  const col =
    detectColumn(sample.length ? sample : [row], [
      "created_at",
      "created_at_date",
      "date",
      "timestamp",
    ]) || findColumnKey(row, ["created_at", "created_at_date", "date", "timestamp"]);
  if (!col) return null;
  const d = parseDate(String(row[col] ?? ""));
  return d;
}

function customerDisplay(row: RequestData): string {
  return (
    str(row, "name_ar", "name_en", "customer_name", "full_name", "name", "الاسم") ||
    str(row, "phone", "mobile", "phone_number", "الهاتف") ||
    str(row, "email", "email_address") ||
    "—"
  );
}

function isCustomOrderRow(row: RequestData, typeCol: string | null): boolean {
  if (!typeCol) return false;
  const v = String(row[typeCol] ?? "").toLowerCase();
  return (
    /مخصص|خدمة|custom|tailor|special|bespoke|service/i.test(v) ||
    v.includes("custom")
  );
}

function isPaymentLikeRow(row: RequestData, paymentHintCol: string | null): boolean {
  if (paymentHintCol && String(row[paymentHintCol] ?? "").trim()) return true;
  const st = str(row, "status_ar", "status", "payment_status");
  return /قيد الدفع|مدفوع|paid|payment|مكتمل الدفع|تم الدفع/i.test(st);
}

function filterByDateRange(rows: RequestData[], from?: string, to?: string): RequestData[] {
  if (!from && !to) return rows;
  const start = from ? startOfDay(parseISO(from)) : null;
  const end = to ? endOfDay(parseISO(to)) : null;
  if (start && !isValid(start)) return rows;
  if (end && !isValid(end)) return rows;

  return rows.filter((row) => {
    const d = rowDate(row, rows);
    if (!d) return true;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });
}

export function buildAdminReport(
  rows: RequestData[],
  options?: { from?: string | null; to?: string | null }
): AdminReportPayload {
  const filtered = filterByDateRange(rows, options?.from ?? undefined, options?.to ?? undefined);
  const sample = filtered.length ? filtered : rows;

  const idCol =
    detectColumn(sample, ["request_id", "ref_id", "id", "order_id"]) ||
    (sample[0] ? findColumnKey(sample[0], ["request_id", "ref_id", "id"]) : null);

  const typeCol =
    detectColumn(sample, ["req_type_ar", "request_type", "req_type", "نوع_الطلب"]) ||
    (sample[0] ? findColumnKey(sample[0], ["req_type_ar", "request_type"]) : null);

  const payMethodCol =
    detectColumn(sample, ["payment_method", "pay_method", "طريقة_الدفع"]) ||
    (sample[0] ? findColumnKey(sample[0], ["payment_method"]) : null);

  const orders: AdminOrderRow[] = [];
  const customOrders: AdminCustomOrderRow[] = [];

  let autoId = 0;
  for (const row of filtered) {
    autoId += 1;
    let id: string;
    if (idCol) {
      const raw = String(row[idCol] ?? "").trim();
      if (!raw) continue;
      id = raw;
    } else {
      id = String(autoId);
    }
    const cust = customerDisplay(row);
    const total = rowMonetaryTotal(row);
    const status = str(row, "status_ar", "status", "الحالة") || "—";
    const d = rowDate(row, filtered);
    const dateStr = d ? d.toISOString().slice(0, 10) : "—";

    if (isCustomOrderRow(row, typeCol)) {
      customOrders.push({
        orderId: id,
        customer: cust,
        service: typeCol ? String(row[typeCol] ?? "").trim() || "—" : "—",
        price: total,
        status,
        date: dateStr,
      });
    } else {
      orders.push({
        orderId: id,
        customer: cust,
        total,
        status,
        date: dateStr,
      });
    }
  }

  const customerMap = new Map<
    string,
    { name: string; email: string; phone: string; count: number }
  >();

  const phoneKey = (row: RequestData) =>
    str(row, "phone", "mobile", "phone_number", "الهاتف", "جوال");
  const emailKey = (row: RequestData) => str(row, "email", "email_address", "البريد");

  for (const row of filtered) {
    const phone = phoneKey(row);
    const email = emailKey(row);
    const name = customerDisplay(row);
    const key = phone || email || name || JSON.stringify(row);
    const prev = customerMap.get(key);
    if (prev) {
      prev.count += 1;
      if (!prev.email && email) prev.email = email;
      if (!prev.phone && phone) prev.phone = phone;
      if (prev.name === "—" && name) prev.name = name;
    } else {
      customerMap.set(key, {
        name: name || "—",
        email: email || "—",
        phone: phone || "—",
        count: 1,
      });
    }
  }

  const customers: AdminCustomerRow[] = Array.from(customerMap.values())
    .map((c) => ({
      name: c.name,
      email: c.email,
      phone: c.phone,
      totalOrders: c.count,
    }))
    .sort((a, b) => b.totalOrders - a.totalOrders);

  const payments: AdminPaymentRow[] = [];
  let paySeq = 0;
  for (const row of filtered) {
    if (!isPaymentLikeRow(row, payMethodCol)) continue;
    paySeq += 1;
    const id = idCol ? String(row[idCol] ?? "").trim() : "";
    payments.push({
      paymentId: id ? `P-${id}` : `P-${paySeq}`,
      customer: customerDisplay(row),
      amount: rowMonetaryTotal(row),
      method: payMethodCol ? String(row[payMethodCol] ?? "").trim() || "—" : "—",
      status: str(row, "status_ar", "status") || "—",
      date: (() => {
        const d = rowDate(row, filtered);
        return d ? d.toISOString().slice(0, 10) : "—";
      })(),
    });
  }

  const ordersRevenue = orders.reduce((s, o) => s + o.total, 0);
  const customRevenue = customOrders.reduce((s, o) => s + o.price, 0);

  const periodLabel =
    options?.from && options?.to
      ? `${options.from} → ${options.to}`
      : options?.from
        ? `From ${options.from}`
        : options?.to
          ? `Until ${options.to}`
          : "All data (current sheet export)";

  return {
    generatedAt: new Date().toISOString(),
    periodLabel,
    summary: {
      totalOrders: orders.length,
      totalCustomOrders: customOrders.length,
      totalCustomers: customers.length,
      totalRevenue: ordersRevenue + customRevenue,
    },
    orders,
    customOrders,
    customers,
    payments,
  };
}
