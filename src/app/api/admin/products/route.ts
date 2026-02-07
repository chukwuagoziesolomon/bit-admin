import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

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

    // Create product in database
    const newProduct = await prisma.product.create({
      data: {
        name,
        sku,
        price: price.toString(),
        coupon_value: is_coupon ? coupon_value : null,
        is_coupon,
        category_id: typeof category === 'object' ? category.id : category,
        brand_id: typeof brand === 'object' ? brand.id : brand,
        description,
        short_description,
        stock_quantity,
        product_condition,
        is_active,
        is_featured,
      },
      include: {
        category: true,
        brand: true
      }
    });

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

    // Support query params for search and pagination to power dropdowns/autocomplete
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || url.searchParams.get('q') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;
    const per_page = parseInt(url.searchParams.get('per_page') || url.searchParams.get('perPage') || '20', 10) || 20;

    // Build where clause for search
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { sku: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    // Get total count
    const totalCount = await prisma.product.count({ where });

    // Get products with pagination
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        brand: true
      },
      skip: (page - 1) * per_page,
      take: per_page,
      orderBy: { created_at: 'desc' }
    });

    // Return simplified payload suitable for dropdowns
    interface SimplifiedProduct {
      id: number;
      name: string;
      sku: string;
      price: string;
      is_coupon: boolean;
    }

    interface Product {
      id: number;
      name: string;
      sku: string;
      price: string;
      is_coupon: boolean;
      category: {
      id: number;
      name: string;
      };
      brand: {
      id: number;
      name: string;
      };
      // Add other fields as needed
    }

    const simplified: SimplifiedProduct[] = products.map((p: Product): SimplifiedProduct => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price,
      is_coupon: p.is_coupon,
    }));

    const result = {
      results: simplified,
      count: totalCount,
      next: (page * per_page) < totalCount ? page + 1 : null,
      previous: page > 1 ? page - 1 : null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}