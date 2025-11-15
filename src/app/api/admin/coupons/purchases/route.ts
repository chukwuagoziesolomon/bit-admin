import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/lib/db'; // Import your database connection

// GET /api/admin/coupons/purchases/ - Get all coupon purchases with filtering, pagination, and statistics
export async function GET(request: NextRequest) {
  try {
    // Admin authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Token ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const product_id = searchParams.get('product_id');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '20');

    // Database query for coupon purchases with filters
    // const whereClause: any = {};
    // if (status) whereClause.status = status;
    // if (product_id) whereClause.product_id = parseInt(product_id);
    // if (search) {
    //   whereClause.OR = [
    //     { email: { contains: search, mode: 'insensitive' } },
    //     { first_name: { contains: search, mode: 'insensitive' } },
    //     { last_name: { contains: search, mode: 'insensitive' } },
    //     { coupon_code: { code: { contains: search, mode: 'insensitive' } } }
    //   ];
    // }

    // const total_purchases = await db.couponPurchase.count({ where: whereClause });
    // const purchases = await db.couponPurchase.findMany({
    //   where: whereClause,
    //   include: { product: true, coupon_code: true },
    //   skip: (page - 1) * per_page,
    //   take: per_page,
    //   orderBy: { created_at: 'desc' }
    // });

    // Mock data for now - replace with actual database queries
    const mockPurchases = [
      {
        id: 1,
        first_name: "John",
        last_name: "Doe",
        full_name: "John Doe",
        email: "john@example.com",
        phone_number: "+2348012345678",
        payment_method: "paystack",
        payment_method_display: "Paystack (Naira)",
        amount_paid: 500.00,
        status: "paid",
        status_display: "Paid",
        terms_agreed: true,
        payment_reference: "COUPON-1",
        payment_data: {},
        product: 123,
        product_name: "BitGadgetz ₦500 Coupon",
        product_coupon_value: 500.00,
        coupon_code: 1,
        coupon_code_code: "BGZ-500-001",
        created_at: "2025-11-14T10:00:00Z",
        updated_at: "2025-11-14T10:30:00Z"
      }
    ];

    const total_purchases = mockPurchases.length;
    const total_pages = Math.ceil(total_purchases / per_page);
    const purchases = mockPurchases.slice((page - 1) * per_page, page * per_page);

    // Statistics from database
    // const pending = await db.couponPurchase.count({ where: { status: 'pending' } });
    // const paid = await db.couponPurchase.count({ where: { status: 'paid' } });
    // const cancelled = await db.couponPurchase.count({ where: { status: 'cancelled' } });
    // const total_revenue = await db.couponPurchase.aggregate({
    //   _sum: { amount_paid: true },
    //   where: { status: 'paid' }
    // });

    const pending = 0;
    const paid = 1;
    const cancelled = 0;
    const total_revenue = 500.00;

    const response = {
      purchases,
      pagination: {
        current_page: page,
        per_page,
        total_purchases,
        total_pages,
        has_next: page < total_pages,
        has_previous: page > 1
      },
      statistics: {
        total_purchases,
        pending,
        paid,
        cancelled,
        total_revenue
      },
      filters_applied: {
        status: status || null,
        product_id: product_id ? parseInt(product_id) : null,
        search: search || null
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching coupon purchases:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}