<?php

namespace Database\Seeders;

use App\Models\CustomOrder;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AdminReportDemoSeeder extends Seeder
{
    public function run(): void
    {
        $c1 = Customer::create([
            'name' => 'Ahmed Al-Rashid',
            'email' => 'ahmed@example.com',
            'phone' => '+968 9000 1111',
        ]);
        $c2 = Customer::create([
            'name' => 'Sara Al-Balushi',
            'email' => 'sara@example.com',
            'phone' => '+968 9000 2222',
        ]);
        $c3 = Customer::create([
            'name' => 'Doorly Demo Co.',
            'email' => 'orders@doorly.om',
            'phone' => '+968 7000 0000',
        ]);

        $day = Carbon::now()->subDays(5);

        Order::create([
            'customer_id' => $c1->id,
            'product' => 'Interior door — oak',
            'quantity' => 2,
            'total_price' => 450.00,
            'status' => 'completed',
            'order_date' => $day->copy()->addDay(),
        ]);
        Order::create([
            'customer_id' => $c2->id,
            'product' => 'Steel security door',
            'quantity' => 1,
            'total_price' => 890.50,
            'status' => 'pending',
            'order_date' => $day->copy()->addDays(2),
        ]);
        Order::create([
            'customer_id' => $c3->id,
            'product' => 'Custom frame kit',
            'quantity' => 4,
            'total_price' => 320.00,
            'status' => 'processing',
            'order_date' => $day->copy()->addDays(3),
        ]);

        CustomOrder::create([
            'customer_id' => $c1->id,
            'service_type' => 'On-site measurement',
            'price' => 75.00,
            'status' => 'completed',
        ]);
        CustomOrder::create([
            'customer_id' => $c2->id,
            'service_type' => 'Installation',
            'price' => 200.00,
            'status' => 'scheduled',
        ]);

        Payment::create([
            'customer_id' => $c1->id,
            'amount' => 450.00,
            'payment_method' => 'Card',
            'status' => 'completed',
            'payment_date' => $day->copy()->addDay(),
        ]);
        Payment::create([
            'customer_id' => $c2->id,
            'amount' => 200.00,
            'payment_method' => 'Bank transfer',
            'status' => 'pending',
            'payment_date' => $day->copy()->addDays(2),
        ]);
    }
}
