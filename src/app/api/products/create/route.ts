import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for brands and products (in a real app, this would be a database)
const brands: any[] = [];
const products: any[] = [];

// POST /api/products/create/ - Create product with brand selection (Admin only)
export async function POST(request: NextRequest) {
  // Mock admin authentication check (in a real app, verify JWT token)
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = body.name as string;
    const category_input = body.category_input as string;
    const brand_input = body.brand_input as string;
    const description = body.description as string;
    const short_description = body.short_description as string;
    const price = parseFloat(body.price as string);
    const price_usdt = body.price_usdt as string;
    const discount_percentage = parseInt(body.discount_percentage as string);
    const stock_quantity = parseInt(body.stock_quantity as string);
    const product_condition = body.product_condition as string;
    const sku = body.sku as string;
    const model = body.model as string;
    const colors = body.colors;
    const storage_options = body.storage_options;
    const display_specs = body.display_specs as string;
    const chip_specs = body.chip_specs as string;
    const camera_specs = body.camera_specs as string;
    const storage_specs = body.storage_specs as string;
    const battery_specs = body.battery_specs as string;
    const operating_system = body.operating_system as string;
    const weight = body.weight as string;
    const main_image = body.main_image as File;
    const additional_images = body.additional_images as File[];

    if (!name || !category_input || !brand_input || !description || !short_description || !price || !stock_quantity || !product_condition || !sku || !model) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the brand by name or create a new one if it doesn't exist
    let brand = brands.find(b => b.name.toLowerCase() === brand_input.toLowerCase());
    if (!brand) {
      brand = {
        id: brands.length + 1,
        name: brand_input,
        display_name: brand_input.charAt(0).toUpperCase() + brand_input.slice(1),
        description: `Brand for ${brand_input}`,
        logo: `https://cloudinary.com/.../brand_logos/${brand_input}_logo.jpg`,
        website: '',
        is_active: true,
        product_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      brands.push(brand);
    }

    // Mock image uploads (in a real app, upload to Cloudinary and get URLs)
    const mainImageUrl = main_image ? `https://cloudinary.com/.../product_images/${name.replace(/\s+/g, '_').toLowerCase()}_main.jpg` : null;
    const additionalImageUrls = additional_images ? additional_images.map((_, index) => ({
      id: products.length * 10 + index + 1,
      image: `https://cloudinary.com/.../product_images/${name.replace(/\s+/g, '_').toLowerCase()}_${index + 1}.jpg`,
      alt_text: `${name} - Image ${index + 1}`,
      is_primary: false,
      order: index + 1,
    })) : [];

    const newProduct = {
      id: products.length + 1,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      category: {
        id: 1, // Mock category ID
        name: category_input,
        display_name: category_input.charAt(0).toUpperCase() + category_input.slice(1),
        description: `Latest ${category_input} and mobile devices`,
        image: `https://cloudinary.com/.../category_images/${category_input}.jpg`,
        is_active: true,
        product_count: 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      description,
      short_description,
      price: price.toString(),
      price_usdt: price_usdt || null,
      discount_percentage,
      stock_quantity,
      sku,
      brand,
      model,
      colors,
      storage_options,
      display_specs,
      chip_specs,
      camera_specs,
      storage_specs,
      battery_specs,
      operating_system,
      weight,
      main_image: mainImageUrl || null,
      images: additionalImageUrls,
      is_active: true,
      is_featured: false,
      is_on_sale: false,
      is_in_stock: stock_quantity > 0,
      is_out_of_stock: stock_quantity === 0,
      stock_status: stock_quantity > 0 ? 'In Stock' : 'Out of Stock',
      is_new_arrival: true,
      is_best_seller: false,
      product_condition,
      condition_display: product_condition === 'new' ? 'Brand New' : 'Used',
      average_rating: 0.0,
      review_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_available: true,
      is_new: true,
      is_bestseller: false,
    };

    products.push(newProduct);

    // Update brand product count
    brand.product_count += 1;

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }
}