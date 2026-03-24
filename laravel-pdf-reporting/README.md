# Admin Dashboard PDF Reporting (Laravel + DomPDF)

Professional A4 PDF reports using [barryvdh/laravel-dompdf](https://github.com/barryvdh/laravel-dompdf).

## Prerequisites

- PHP 8.2+
- Composer
- MySQL / PostgreSQL / SQLite

## 1. Create a Laravel project (or use an existing one)

```bash
composer create-project laravel/laravel admin-dashboard-api
cd admin-dashboard-api
```

## 2. Install DomPDF

```bash
composer require barryvdh/laravel-dompdf
php artisan vendor:publish --provider="Barryvdh\DomPDF\ServiceProvider"
```

## 3. Enable PHP in views (optional — for page numbers)

Edit `config/dompdf.php`:

```php
'enable_php' => true,
```

## 4. Copy files into your Laravel app

Copy the contents of this folder’s `app`, `database`, `resources`, and `routes` directories into your Laravel project root (merge `routes/web.php` with the snippet below).

| Source | Laravel path |
|--------|----------------|
| `app/Http/Controllers/AdminDashboardReportController.php` | `app/Http/Controllers/` |
| `app/Models/*.php` | `app/Models/` |
| `database/migrations/*` | `database/migrations/` |
| `resources/views/pdf/admin-dashboard-report.blade.php` | `resources/views/pdf/` |
| `public/images/.gitkeep` | place logo at `public/images/company-logo.png` |

## 5. Run migrations & seed (demo data)

```bash
php artisan migrate
php artisan db:seed --class=Database\\Seeders\\AdminReportDemoSeeder
```

Or register the seeder in `database/seeders/DatabaseSeeder.php`:

```php
$this->call(AdminReportDemoSeeder::class);
```

## 5b. Map to your real schema

If you already have `orders`, `customers`, etc., **skip the bundled migration** and point the models at your table/column names (`$table`, `$fillable`, relationships). Adjust the Blade columns to match your fields.

## 6. Routes

Add to `routes/web.php`:

```php
use App\Http\Controllers\AdminDashboardReportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('/admin/reports/dashboard-pdf', [AdminDashboardReportController::class, 'download'])
        ->name('admin.reports.dashboard-pdf');
});
```

For a quick test without auth:

```php
Route::get('/admin/reports/dashboard-pdf', [AdminDashboardReportController::class, 'download']);
```

## 7. Logo

Place your logo at:

`public/images/company-logo.png`

If missing, the template hides the image.

## Page numbers

Footer page numbers use an inline `<script type="text/php">` block. You **must** set in `config/dompdf.php`:

```php
'enable_php' => true,
```

If numbers still do not render, your DomPDF build may restrict inline PHP; use the [canvas `page_text` approach](https://github.com/barryvdh/laravel-dompdf) in a service provider or after `$pdf->output()` (see DomPDF docs).

## Arabic / RTL PDFs

DomPDF renders UTF-8 with **DejaVu Sans** (bundled). Complex Arabic shaping may need a custom TTF and `font_dir` in `config/dompdf.php`. For best Arabic output, consider [snappy/wkhtmltopdf](https://github.com/barryvdh/laravel-snappy) or browser print-to-PDF.

## Query parameters

- `from` — report period start (`Y-m-d`)
- `to` — report period end (`Y-m-d`)

Example: `/admin/reports/dashboard-pdf?from=2025-01-01&to=2025-12-31`
