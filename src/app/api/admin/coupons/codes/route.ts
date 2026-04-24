import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/lib/db'; // Import your database connection

// GET /api/admin/coupons/codes/ - Get all coupon codes with filtering, pagination, and statistics
export async function GET(request: NextRequest) {
  try {
    // Admin authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const product_id = searchParams.get('product_id');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '50');

    // Database query for coupon codes with filters
    // const whereClause: any = {};
    // if (product_id) whereClause.product_id = parseInt(product_id);
    // if (status !== 'all') {
    //   switch (status) {
    //     case 'used':
    //       whereClause.is_used = true;
    //       break;
    //     case 'unused':
    //       whereClause.is_used = false;
    //       break;
    //     case 'assigned':
    //       whereClause.is_assigned = true;
    //       break;
    //   }
    // }
    // if (search) {
    //   whereClause.OR = [
    //     { code: { contains: search, mode: 'insensitive' } },
    //     { assigned_to_email: { contains: search, mode: 'insensitive' } },
    //     { product: { name: { contains: search, mode: 'insensitive' } } }
    //   ];
    // }

    // const total_codes = await db.couponCode.count({ where: whereClause });
    // const codes = await db.couponCode.findMany({
    //   where: whereClause,
    //   include: { product: true },
    //   skip: (page - 1) * per_page,
    //   take: per_page,
    //   orderBy: { created_at: 'desc' }
    // });

    // Mock data for now - replace with actual database queries
    const mockCodes = [
      {
        id: 1,
        code: "BGZ-500-001",
        product: 123,
        product_name: "BitGadgetz ₦500 Coupon",
        product_coupon_value: 500.00,
        is_used: true,
        assigned_to_email: "customer@example.com",
        assigned_at: "2025-11-14T10:30:00Z",
        is_assigned: true,
        created_at: "2025-11-14T09:00:00Z"
      }
    ];

    const total_codes = mockCodes.length;
    const total_pages = Math.ceil(total_codes / per_page);
    const codes = mockCodes.slice((page - 1) * per_page, page * per_page);

    // Statistics from database
    // const used_codes = await db.couponCode.count({ where: { is_used: true } });
    // const unused_codes = await db.couponCode.count({ where: { is_used: false } });
    // const assigned_codes = await db.couponCode.count({ where: { is_assigned: true } });

    const used_codes = 1;
    const unused_codes = 0;
    const assigned_codes = 1;
    const usage_rate = total_codes > 0 ? (used_codes / total_codes) * 100 : 0;

    // Get coupon products
    // const coupon_products = await db.product.findMany({
    //   where: { is_coupon: true },
    //   select: { id: true, name: true, coupon_value: true }
    // });

    const coupon_products = [
      { id: 123, name: "BitGadgetz ₦500 Coupon", coupon_value: 500.00 }
    ];

    const response = {
      codes,
      pagination: {
        current_page: page,
        per_page,
        total_codes,
        total_pages,
        has_next: page < total_pages,
        has_previous: page > 1
      },
      statistics: {
        total_codes,
        used_codes,
        unused_codes,
        assigned_codes,
        usage_rate: Math.round(usage_rate * 10) / 10
      },
      coupon_products,
      filters_applied: {
        product_id: product_id ? parseInt(product_id) : null,
        status,
        search: search || null
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching coupon codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}