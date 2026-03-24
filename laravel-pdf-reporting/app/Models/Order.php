<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    protected $fillable = [
        'customer_id',
        'product',
        'quantity',
        'total_price',
        'status',
        'order_date',
    ];

    protected $casts = [
        'order_date' => 'datetime',
        'quantity' => 'integer',
        'total_price' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
