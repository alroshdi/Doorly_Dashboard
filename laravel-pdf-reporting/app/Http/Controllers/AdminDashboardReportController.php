<?php

namespace App\Http\Controllers;

use App\Models\CustomOrder;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Payment;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class AdminDashboardReportController extends Controller
{
    public function download(Request $request)
    {
        $from = $request->query('from');
        $to = $request->query('to');

        $periodStart = $from ? Carbon::parse($from)->startOfDay() : null;
        $periodEnd = $to ? Carbon::parse($to)->endOfDay() : null;
        $hasPeriod = $periodStart && $periodEnd;

        $orderScope = function ($q) use ($hasPeriod, $periodStart, $periodEnd) {
            if ($hasPeriod) {
                $q->whereBetween('order_date', [$periodStart, $periodEnd]);
            }
        };

        $customOrderScope = function ($q) use ($hasPeriod, $periodStart, $periodEnd) {
            if ($hasPeriod) {
                $q->whereBetween('created_at', [$periodStart, $periodEnd]);
            }
        };

        $paymentScope = function ($q) use ($hasPeriod, $periodStart, $periodEnd) {
            if ($hasPeriod) {
                $q->whereBetween('payment_date', [$periodStart, $periodEnd]);
            }
        };

        $orders = Order::query()
            ->with('customer')
            ->when($hasPeriod, fn ($q) => $q->whereBetween('order_date', [$periodStart, $periodEnd]))
            ->orderByDesc('order_date')
            ->get();

        $customOrders = CustomOrder::query()
            ->with('customer')
            ->when($hasPeriod, fn ($q) => $q->whereBetween('created_at', [$periodStart, $periodEnd]))
            ->orderByDesc('created_at')
            ->get();

        $payments = Payment::query()
            ->with('customer')
            ->when($hasPeriod, fn ($q) => $q->whereBetween('payment_date', [$periodStart, $periodEnd]))
            ->orderByDesc('payment_date')
            ->get();

        $customers = Customer::query()
            ->when($hasPeriod, function ($q) use ($periodStart, $periodEnd) {
                $q->where(function ($q2) use ($periodStart, $periodEnd) {
                    $q2->whereHas('orders', fn ($oq) => $oq->whereBetween('order_date', [$periodStart, $periodEnd]))
                        ->orWhereHas('customOrders', fn ($cq) => $cq->whereBetween('created_at', [$periodStart, $periodEnd]))
                        ->orWhereHas('payments', fn ($pq) => $pq->whereBetween('payment_date', [$periodStart, $periodEnd]));
                });
            })
            ->withCount(['orders' => $orderScope])
            ->withSum(['orders' => $orderScope], 'total_price')
            ->withSum(['customOrders' => $customOrderScope], 'price')
            ->orderBy('name')
            ->get();

        $orderBase = Order::query()->when($hasPeriod, fn ($q) => $q->whereBetween('order_date', [$periodStart, $periodEnd]));
        $customBase = CustomOrder::query()->when($hasPeriod, fn ($q) => $q->whereBetween('created_at', [$periodStart, $periodEnd]));

        $totalOrders = (clone $orderBase)->count();
        $totalCustomOrders = (clone $customBase)->count();
        $totalRevenue = (float) (clone $orderBase)->sum('total_price') + (float) (clone $customBase)->sum('price');
        $pendingOrders = (clone $orderBase)->where('status', 'pending')->count();

        $totalCustomers = $hasPeriod
            ? Customer::query()->where(function ($q2) use ($periodStart, $periodEnd) {
                $q2->whereHas('orders', fn ($oq) => $oq->whereBetween('order_date', [$periodStart, $periodEnd]))
                    ->orWhereHas('customOrders', fn ($cq) => $cq->whereBetween('created_at', [$periodStart, $periodEnd]))
                    ->orWhereHas('payments', fn ($pq) => $pq->whereBetween('payment_date', [$periodStart, $periodEnd]));
            })->count()
            : Customer::query()->count();

        $ordersRevenueSum = (float) (clone $orderBase)->sum('total_price');
        $customOrdersRevenueSum = (float) (clone $customBase)->sum('price');

        $logoPath = public_path('images/company-logo.png');
        $logoBase64 = null;
        if (File::exists($logoPath)) {
            $logoBase64 = base64_encode(File::get($logoPath));
        }

        $data = [
            'generatedAt' => Carbon::now(),
            'generatedBy' => 'Admin',
            'periodStart' => $periodStart,
            'periodEnd' => $periodEnd,
            'hasPeriod' => $hasPeriod,
            'summary' => [
                'total_orders' => $totalOrders,
                'total_custom_orders' => $totalCustomOrders,
                'total_customers' => $totalCustomers,
                'total_revenue' => $totalRevenue,
                'pending_orders' => $pendingOrders,
            ],
            'totals' => [
                'orders_revenue' => $ordersRevenueSum,
                'custom_orders_revenue' => $customOrdersRevenueSum,
                'combined_revenue' => $ordersRevenueSum + $customOrdersRevenueSum,
                'order_count' => $totalOrders,
                'custom_order_count' => $totalCustomOrders,
            ],
            'orders' => $orders,
            'customOrders' => $customOrders,
            'customers' => $customers,
            'payments' => $payments,
            'logoBase64' => $logoBase64,
        ];

        $pdf = Pdf::loadView('pdf.admin-dashboard-report', $data);
        $pdf->setPaper('a4', 'portrait');
        $pdf->setOption('isRemoteEnabled', true);

        $filename = 'admin-dashboard-report-' . Carbon::now()->format('Y-m-d-His') . '.pdf';

        return $pdf->download($filename);
    }
}
