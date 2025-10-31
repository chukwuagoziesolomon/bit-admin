import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for brands (in a real app, this would be a database)
const brands: any[] = [];

// GET /api/brands/ - List all active brands
export async function GET() {
  const activeBrands = brands.filter(brand => brand.is_active);
  return NextResponse.json({
    count: activeBrands.length,
    next: null,
    previous: null,
    results: activeBrands,
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

    const newBrand = {
      id: brands.length + 1,
      name,
      display_name,
      description,
      logo,
      website,
      is_active: true,
      product_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    brands.push(newBrand);

    return NextResponse.json(newBrand, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }
}