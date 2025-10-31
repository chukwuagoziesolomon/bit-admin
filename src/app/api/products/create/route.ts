import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for brands and products (in a real app, this would be a database)
let brands: any[] = [];
let products: any[] = [];

// POST /api/products/create/ - Create product with brand selection (Admin only)
export async function POST(request: NextRequest) {
  // Mock admin authentication check (in a real app, verify JWT token)
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const brandId = parseInt(formData.get('brand') as string);
    const description = formData.get('description') as string;
    const short_description = formData.get('short_description') as string;
    const price = parseFloat(formData.get('price') as string);
    const price_usdt = formData.get('price_usdt') as string;
    const discount_percentage = parseInt(formData.get('discount_percentage') as string);
    const stock_quantity = parseInt(formData.get('stock_quantity') as string);
    const product_condition = formData.get('product_condition') as string;
    const sku = formData.get('sku') as string;
    const model = formData.get('model') as string;
    const colors = JSON.parse(formData.get('colors') as string);
    const storage_options = JSON.parse(formData.get('storage_options') as string);
    const display_specs = formData.get('display_specs') as string;
    const chip_specs = formData.get('chip_specs') as string;
    const camera_specs = formData.get('camera_specs') as string;
    const storage_specs = formData.get('storage_specs') as string;
    const battery_specs = formData.get('battery_specs') as string;
    const operating_system = formData.get('operating_system') as string;
    const weight = formData.get('weight') as string;
    const main_image = formData.get('main_image') as File;
    const additional_images = formData.getAll('additional_images') as File[];

    if (!name || !category || !brandId || !description || !short_description || !price || !stock_quantity || !product_condition || !sku || !model || !main_image) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the brand
    const brand = brands.find(b => b.id === brandId);
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Mock image uploads (in a real app, upload to Cloudinary and get URLs)
    const mainImageUrl = `https://cloudinary.com/.../product_images/${name.replace(/\s+/g, '_').toLowerCase()}_main.jpg`;
    const additionalImageUrls = additional_images.map((_, index) => ({
      id: products.length * 10 + index + 1,
      image: `https://cloudinary.com/.../product_images/${name.replace(/\s+/g, '_').toLowerCase()}_${index + 1}.jpg`,
      alt_text: `${name} - Image ${index + 1}`,
      is_primary: false,
      order: index + 1,
    }));

    const newProduct = {
      id: products.length + 1,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      category: {
        id: 1, // Mock category ID
        name: category,
        display_name: category.charAt(0).toUpperCase() + category.slice(1),
        description: `Latest ${category} and mobile devices`,
        image: `https://cloudinary.com/.../category_images/${category}.jpg`,
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
      main_image: mainImageUrl,
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