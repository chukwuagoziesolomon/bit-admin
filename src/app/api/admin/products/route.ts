import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/lib/db'; // Import your database connection

// POST /api/admin/products/ - Create a new product
export async function POST(request: NextRequest) {
  try {
    // Admin authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Token ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, category, brand, description, short_description, price, sku, stock_quantity, product_condition, is_active = true, is_featured = false, is_coupon = false, coupon_value } = body;

    // Validate required fields
    const errors: { [key: string]: string[] } = {};

    if (!name) errors.name = ['This field is required.'];
    if (!category) errors.category = ['This field is required.'];
    if (!brand) errors.brand = ['This field is required.'];
    if (!description) errors.description = ['This field is required.'];
    if (!short_description) errors.short_description = ['This field is required.'];
    if (!price) errors.price = ['This field is required.'];
    if (!sku) errors.sku = ['This field is required.'];
    if (!stock_quantity && stock_quantity !== 0) errors.stock_quantity = ['This field is required.'];
    if (!is_coupon && !product_condition) errors.product_condition = ['This field is required.'];
    if (is_coupon && !coupon_value) errors.coupon_value = ['This field is required for coupon products.'];

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(errors, { status: 400 });
    }

    // Mock product creation - replace with actual database insert
    const newProduct = {
      id: Date.now(), // Mock ID
      name,
      sku,
      price: price.toString(),
      coupon_value: is_coupon ? coupon_value : null,
      is_coupon,
      category: typeof category === 'object' ? category : { id: category, name: category, display_name: category },
      brand: typeof brand === 'object' ? brand : { id: brand, name: brand, display_name: brand },
      description,
      short_description,
      stock_quantity,
      product_condition,
      is_active,
      is_featured,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // In a real app, save to database here

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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