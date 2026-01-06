import { KPIMetrics } from "./analytics";
import { getLanguage, getTranslations } from "./i18n";

export interface ExportOptions {
  title?: string;
  filename?: string;
  metrics?: KPIMetrics;
  isRTL?: boolean;
}

export async function exportDashboardToPDF(
  options: ExportOptions = {}
): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("PDF export can only be used in browser environment");
  }

  const {
    title,
    filename = `doorly-report-${new Date().toISOString().split("T")[0]}.pdf`,
    metrics,
    isRTL = false,
  } = options;

  // Get language settings
  const lang = getLanguage();
  const t = getTranslations(lang);
  const reportIsRTL = lang === "ar";

  // Show loading indicator
  const loadingToast = document.createElement("div");
  loadingToast.style.cssText = `
    position: fixed;
    top: 20px;
    ${reportIsRTL ? "left" : "right"}: 20px;
    background: #3B82F6;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: system-ui, -apple-system, sans-serif;
  `;
  loadingToast.textContent = reportIsRTL ? "جاري إنشاء التقرير..." : "Generating PDF...";
  document.body.appendChild(loadingToast);

  try {
    const { jsPDF } = await import("jspdf");
    
    const reportTitle = title || (reportIsRTL ? "تقرير دورلي" : "Doorly Dashboard Report");
    const dateStr = new Date().toLocaleDateString(reportIsRTL ? "ar-DZ" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pdfWidth - (margin * 2);
    let yPosition = margin;

    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pdfHeight - margin - 15) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Header
    pdf.setFillColor(59, 130, 246);
    pdf.rect(0, 0, pdfWidth, 30, "F");
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text(reportTitle, pdfWidth / 2, 18, { align: "center" });
    
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const dateText = reportIsRTL ? `تاريخ: ${dateStr}` : `Date: ${dateStr}`;
    pdf.text(dateText, pdfWidth / 2, 26, { align: "center" });
    
    pdf.setTextColor(0, 0, 0);
    yPosition = 40;

    // Metrics data
    const metricsData: KPIMetrics = metrics || {
      totalRequests: 0,
      newToday: 0,
      thisWeek: 0,
      verified: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      paymentPending: 0,
      paymentPendingVerify: 0,
      totalOffers: 0,
      hasOffersColumn: false,
      totalViewsCount: 0,
      avgViews: 0,
      minPrice: 0,
      maxPrice: 0,
      avgPrice: 0,
      minPriceFrom: 0,
      maxPriceFrom: 0,
      avgPriceFrom: 0,
      minPriceTo: 0,
      maxPriceTo: 0,
      avgPriceTo: 0,
      avgPriceRange: 0,
      minArea: 0,
      maxArea: 0,
      avgArea: 0,
      totalArea: 0,
      hasAreaColumn: false,
    };

    // Calculate percentages
    const total = metricsData.totalRequests || 1;
    const activeRate = total > 0 ? ((metricsData.active / total) * 100).toFixed(1) : "0";
    const completedRate = total > 0 ? ((metricsData.completed / total) * 100).toFixed(1) : "0";
    const cancelledRate = total > 0 ? ((metricsData.cancelled / total) * 100).toFixed(1) : "0";
    const verifiedRate = total > 0 ? ((metricsData.verified / total) * 100).toFixed(1) : "0";

    // Section: Key Metrics
    checkPageBreak(50);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(59, 130, 246);
    const metricsTitle = reportIsRTL ? "المؤشرات الرئيسية" : "Key Metrics";
    pdf.text(metricsTitle, margin, yPosition);
    yPosition += 10;

    // Key metrics grid (2 columns)
    const keyMetrics = [
      { label: t.kpi.totalRequests, value: metricsData.totalRequests, color: [59, 130, 246] },
      { label: t.kpi.newToday, value: metricsData.newToday, color: [20, 184, 166] },
      { label: t.kpi.active, value: metricsData.active, color: [34, 197, 94] },
      { label: t.kpi.completed, value: metricsData.completed, color: [245, 158, 11] },
      { label: t.kpi.cancelled, value: metricsData.cancelled, color: [239, 68, 68] },
      { label: t.kpi.verified, value: metricsData.verified, color: [139, 92, 246] },
    ];

    const boxWidth = (contentWidth - 10) / 2;
    const boxHeight = 15;
    let col = 0;

    keyMetrics.forEach((metric, index) => {
      if (col === 2) {
        col = 0;
        yPosition += boxHeight + 5;
        checkPageBreak(boxHeight + 5);
      }

      const xPos = margin + (col * (boxWidth + 10));
      
      // Box background
      const r = Math.round(metric.color[0] * 0.15 + 255 * 0.85);
      const g = Math.round(metric.color[1] * 0.15 + 255 * 0.85);
      const b = Math.round(metric.color[2] * 0.15 + 255 * 0.85);
      pdf.setFillColor(r, g, b);
      pdf.rect(xPos, yPosition, boxWidth, boxHeight, "F");

      // Border
      pdf.setDrawColor(metric.color[0], metric.color[1], metric.color[2]);
      pdf.setLineWidth(0.5);
      pdf.rect(xPos, yPosition, boxWidth, boxHeight, "D");

      // Label
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);
      const labelText = String(metric.label || "").substring(0, 30);
      pdf.text(labelText, xPos + 3, yPosition + 6);

      // Value
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
      const valueStr = metric.value.toLocaleString("en-US");
      pdf.text(valueStr, xPos + 3, yPosition + 12);

      col++;
    });

    yPosition += boxHeight + 15;
    checkPageBreak(30);

    // Section: Statistics
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(59, 130, 246);
    const statsTitle = reportIsRTL ? "الإحصائيات" : "Statistics";
    pdf.text(statsTitle, margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);

    const stats = [
      { label: reportIsRTL ? "معدل الطلبات النشطة" : "Active Rate", value: `${activeRate}%` },
      { label: reportIsRTL ? "معدل الصفقات المكتملة" : "Completed Rate", value: `${completedRate}%` },
      { label: reportIsRTL ? "معدل الإلغاء" : "Cancellation Rate", value: `${cancelledRate}%` },
      { label: reportIsRTL ? "معدل التحقق" : "Verification Rate", value: `${verifiedRate}%` },
    ];

    stats.forEach((stat) => {
      checkPageBreak(8);
      pdf.text(`${stat.label}:`, margin, yPosition);
      pdf.setFont("helvetica", "bold");
      pdf.text(stat.value, pdfWidth - margin - 20, yPosition, { align: "right" });
      pdf.setFont("helvetica", "normal");
      yPosition += 8;
    });

    yPosition += 5;
    checkPageBreak(40);

    // Section: Detailed Data Table
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(59, 130, 246);
    const tableTitle = reportIsRTL ? "البيانات التفصيلية" : "Detailed Data";
    pdf.text(tableTitle, margin, yPosition);
    yPosition += 10;

    const tableData = [
      { label: t.kpi.totalRequests, value: metricsData.totalRequests },
      { label: t.kpi.newToday, value: metricsData.newToday },
      { label: t.kpi.verified, value: metricsData.verified },
      { label: t.kpi.active, value: metricsData.active },
      { label: t.kpi.completed, value: metricsData.completed },
      { label: t.kpi.cancelled, value: metricsData.cancelled },
      { label: t.kpi.paymentPendingVerify, value: metricsData.paymentPendingVerify },
      { label: t.kpi.totalOffers, value: metricsData.totalOffers },
      { label: t.kpi.totalViewsCount, value: metricsData.totalViewsCount },
      { label: t.kpi.avgViews, value: Math.round(metricsData.avgViews) },
    ];

    const rowHeight = 7;
    const headerHeight = 8;
    const col1Width = contentWidth * 0.65;
    const col2Width = contentWidth * 0.35;

    // Table header
    pdf.setFillColor(59, 130, 246);
    pdf.rect(margin, yPosition, contentWidth, headerHeight, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    const headerLabel = reportIsRTL ? "المؤشر" : "Metric";
    const headerValue = reportIsRTL ? "القيمة" : "Value";
    
    if (reportIsRTL) {
      pdf.text(headerValue, margin + col2Width / 2, yPosition + 6, { align: "center" });
      pdf.text(headerLabel, margin + col2Width + col1Width / 2, yPosition + 6, { align: "center" });
    } else {
      pdf.text(headerLabel, margin + col1Width / 2, yPosition + 6, { align: "center" });
      pdf.text(headerValue, margin + col1Width + col2Width / 2, yPosition + 6, { align: "center" });
    }

    yPosition += headerHeight;

    // Table rows
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);

    tableData.forEach((row, index) => {
      checkPageBreak(rowHeight + 2);
      
      if (index % 2 === 0) {
        pdf.setFillColor(248, 248, 248);
        pdf.rect(margin, yPosition, contentWidth, rowHeight, "F");
      }

      pdf.setDrawColor(230, 230, 230);
      pdf.setLineWidth(0.2);
      pdf.rect(margin, yPosition, contentWidth, rowHeight, "D");

      pdf.setTextColor(50, 50, 50);
      const labelText = String(row.label || "").substring(0, 50);
      if (reportIsRTL) {
        pdf.text(labelText, margin + col2Width + col1Width - 3, yPosition + 5, { align: "right" });
      } else {
        pdf.text(labelText, margin + 3, yPosition + 5, { align: "left" });
      }

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      const valueStr = row.value.toLocaleString("en-US");
      if (reportIsRTL) {
        pdf.text(valueStr, margin + col2Width / 2, yPosition + 5, { align: "center" });
      } else {
        pdf.text(valueStr, margin + col1Width + col2Width / 2, yPosition + 5, { align: "center" });
      }

      pdf.setFont("helvetica", "normal");
      yPosition += rowHeight;
    });

    // Footer
    const addFooter = () => {
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(150, 150, 150);
      const footerText = reportIsRTL ? "تقرير دورلي - سرية" : "Doorly Dashboard - Confidential";
      pdf.text(footerText, pdfWidth / 2, pdfHeight - 8, { align: "center" });
    };

    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addFooter();
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`${i} / ${totalPages}`, pdfWidth - margin, pdfHeight - 8, { align: "right" });
    }

    // Save PDF
    pdf.save(filename);

    loadingToast.textContent = reportIsRTL ? "تم إنشاء التقرير بنجاح!" : "PDF exported successfully!";
    loadingToast.style.background = "#10B981";
    
    setTimeout(() => {
      if (document.body.contains(loadingToast)) {
        document.body.removeChild(loadingToast);
      }
    }, 2000);
  } catch (error: any) {
    if (document.body.contains(loadingToast)) {
      document.body.removeChild(loadingToast);
    }

    console.error("PDF Export Error:", error);
    
    const errorMsg = document.createElement("div");
    errorMsg.style.cssText = `
      position: fixed;
      top: 20px;
      ${reportIsRTL ? "left" : "right"}: 20px;
      background: #EF4444;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 400px;
    `;
    
    errorMsg.textContent = reportIsRTL 
      ? "فشل تصدير التقرير. يرجى المحاولة مرة أخرى." 
      : "Failed to export PDF. Please try again.";
    
    document.body.appendChild(errorMsg);
    
    setTimeout(() => {
      if (document.body.contains(errorMsg)) {
        document.body.removeChild(errorMsg);
      }
    }, 5000);
  }
}
