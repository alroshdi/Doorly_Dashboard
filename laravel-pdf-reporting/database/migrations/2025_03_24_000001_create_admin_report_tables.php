<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('product');
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('total_price', 12, 2);
            $table->string('status')->default('pending');
            $table->timestamp('order_date')->useCurrent();
            $table->timestamps();
        });

        Schema::create('custom_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('service_type');
            $table->decimal('price', 12, 2);
            $table->string('status')->default('pending');
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('payment_method');
            $table->string('status')->default('completed');
            $table->timestamp('payment_date')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('custom_orders');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('customers');
    }
};
