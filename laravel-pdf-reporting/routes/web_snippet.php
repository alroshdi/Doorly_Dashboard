<?php

/**
 * Merge into routes/web.php (adjust middleware as needed).
 */

use App\Http\Controllers\AdminDashboardReportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('/admin/reports/dashboard-pdf', [AdminDashboardReportController::class, 'download'])
        ->name('admin.reports.dashboard-pdf');
});

// Quick test without auth:
// Route::get('/admin/reports/dashboard-pdf', [AdminDashboardReportController::class, 'download']);
