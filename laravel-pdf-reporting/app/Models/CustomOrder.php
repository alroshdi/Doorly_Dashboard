<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomOrder extends Model
{
    protected $fillable = [
        'customer_id',
        'service_type',
        'price',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
