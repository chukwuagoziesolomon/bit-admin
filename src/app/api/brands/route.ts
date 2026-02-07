import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

// GET /api/brands/ - List all active brands
export async function GET() {
  const brands = await prisma.brand.findMany({
    where: { is_active: true },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  const results = brands.map(brand => ({
    ...brand,
    product_count: brand._count.products
  }));

  return NextResponse.json({
    count: results.length,
    next: null,
    previous: null,
    results,
  });
}

// POST /api/brands/ - Create a new brand (Admin only)
export async function POST(request: NextRequest) {
  // Mock admin authentication check (in a real app, verify JWT token)
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const display_name = formData.get('display_name') as string;
    const description = formData.get('description') as string;
    const website = formData.get('website') as string;
    const logoFile = formData.get('logo') as File;

    if (!name || !display_name || !description || !website || !logoFile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Mock logo upload (in a real app, upload to Cloudinary and get URL)
    const logo = `https://cloudinary.com/.../brand_logos/${name}_logo.jpg`;

    const newBrand = await prisma.brand.create({
      data: {
        name,
        display_name,
        description,
        logo,
        website,
        is_active: true,
      },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    return NextResponse.json({
      ...newBrand,
      product_count: newBrand._count.products
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }
}