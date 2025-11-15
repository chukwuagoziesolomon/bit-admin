import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/lib/db'; // Import your database connection

// GET /api/admin/products/ - Get all products
export async function GET(request: NextRequest) {
  try {
    // Admin authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Token ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Database query for products
    // const products = await db.product.findMany({
    //   orderBy: { created_at: 'desc' }
    // });

    // Mock data for now - replace with actual database queries
    const products = [
      {
        id: 123,
        name: "BitGadgetz ₦500 Coupon",
        sku: "BGZ-500",
        price: "500.00",
        coupon_value: "500.00",
        is_coupon: true,
        category: { id: 10, name: "coupons", display_name: "Coupons" },
        brand: { id: 5, name: "bitgadgetz", display_name: "BitGadgetz" },
      },
      {
        id: 124,
        name: "BitGadgetz ₦1000 Coupon",
        sku: "BGZ-1000",
        price: "1000.00",
        coupon_value: "1000.00",
        is_coupon: true,
        category: { id: 10, name: "coupons", display_name: "Coupons" },
        brand: { id: 5, name: "bitgadgetz", display_name: "BitGadgetz" },
      },
      {
        id: 125,
        name: "BitGadgetz ₦2000 Coupon",
        sku: "BGZ-2000",
        price: "2000.00",
        coupon_value: "2000.00",
        is_coupon: true,
        category: { id: 10, name: "coupons", display_name: "Coupons" },
        brand: { id: 5, name: "bitgadgetz", display_name: "BitGadgetz" },
      },
      {
        id: 126,
        name: "iPhone 15 Pro",
        sku: "IPH-15P",
        price: "1500000.00",
        coupon_value: null,
        is_coupon: false,
        category: { id: 1, name: "phones", display_name: "Phones" },
        brand: { id: 1, name: "apple", display_name: "Apple" },
      }
    ];

    const result = {
      results: products,
      count: products.length,
      next: null,
      previous: null
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}