import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for brands, categories, and products (in a real app, this would be a database)
const brands: any[] = [];
const categories: any[] = [];
const products: any[] = [];

// POST /api/products/create/ - Create product with brand selection (Admin only)
export async function POST(request: NextRequest) {
  // Mock admin authentication check (in a real app, verify JWT token)
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Token ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const category_input = formData.get('category_input') as string;
    const brand_input = formData.get('brand_input') as string;
    const description = formData.get('description') as string;
    const short_description = formData.get('short_description') as string;
    const price = parseFloat(formData.get('price') as string);
    const price_usdt = formData.get('price_usdt') as string;
    const discount_percentage = parseInt(formData.get('discount_percentage') as string || '0');
    const stock_quantity = parseInt(formData.get('stock_quantity') as string);
    const product_condition = formData.get('product_condition') as string;
    const sku = formData.get('sku') as string;
    const model = formData.get('model') as string;
    const colors = JSON.parse(formData.get('colors') as string || '[]');
    const storage_options = JSON.parse(formData.get('storage_options') as string || '[]');
    const ram_options = JSON.parse(formData.get('ram_options') as string || '[]');
    const specifications = formData.get('specifications') as string;
    const features = JSON.parse(formData.get('features') as string || '[]');
    const is_active = formData.get('is_active') === 'true';
    const is_featured = formData.get('is_featured') === 'true';
    const is_coupon = formData.get('is_coupon') === 'true';
    const coupon_value = formData.get('coupon_value') as string;
    const main_image = formData.get('main_image') as File;
    const main_image_url = formData.get('main_image_url') as string; // Optional URL field
    const additional_images = formData.getAll('additional_images') as File[];

    // Optional fields for detailed specs
    const display_specs = formData.get('display_specs') as string;
    const chip_specs = formData.get('chip_specs') as string;
    const camera_specs = formData.get('camera_specs') as string;
    const storage_specs = formData.get('storage_specs') as string;
    const battery_specs = formData.get('battery_specs') as string;
    const operating_system = formData.get('operating_system') as string;
    const weight = formData.get('weight') as string;

    // Determine if this is a coupon (explicitly set or based on stock_quantity being 999999)
    const isCoupon = is_coupon || stock_quantity === 999999;

    // Validate required fields
    if (!name || (!isCoupon && !category_input) || !brand_input || !description || !short_description || !price || !stock_quantity || (!isCoupon && !product_condition)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // For coupons, coupon_value is required
    if (isCoupon && !coupon_value) {
      return NextResponse.json({ error: 'coupon_value is required for coupon products' }, { status: 400 });
    }

    // SKU is required for all products
    if (!sku) {
      return NextResponse.json({ sku: ['This field may not be blank.'] }, { status: 400 });
    }

    // For coupons, auto-use "coupons" category and "BitGadgetz" brand
    let category;
    let brand;

    if (isCoupon) {
      // Auto-create/use "coupons" category
      category = categories.find(c => c.name.toLowerCase() === 'coupons');
      if (!category) {
        category = {
          id: categories.length + 1,
          name: 'coupons',
          display_name: 'Coupons',
          description: 'Digital coupon products for BitGadgetz platform',
          image: 'https://cloudinary.com/.../category_images/coupons.jpg',
          is_active: true,
          product_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        categories.push(category);
      }

      // Auto-create/use "BitGadgetz" brand
      brand = brands.find(b => b.name.toLowerCase() === 'bitgadgetz');
      if (!brand) {
        brand = {
          id: brands.length + 1,
          name: 'bitgadgetz',
          display_name: 'BitGadgetz',
          description: 'BitGadgetz digital marketplace',
          logo: 'https://cloudinary.com/.../brand_logos/bitgadgetz_logo.jpg',
          website: 'https://bitgadgetz.com',
          is_active: true,
          product_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        brands.push(brand);
      }
    } else {
      // For regular products, use provided category and brand
      category = categories.find(c => c.name.toLowerCase() === category_input.toLowerCase());
      if (!category) {
        category = {
          id: categories.length + 1,
          name: category_input,
          display_name: category_input.charAt(0).toUpperCase() + category_input.slice(1),
          description: `Category for ${category_input}`,
          image: `https://cloudinary.com/.../category_images/${category_input}.jpg`,
          is_active: true,
          product_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        categories.push(category);
      }

      brand = brands.find(b => b.name.toLowerCase() === brand_input.toLowerCase());
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
    }

    // Handle image URLs - use provided URL, uploaded file, or default for coupons
    let mainImageUrl = null;

    if (main_image_url) {
      // Use provided URL
      mainImageUrl = main_image_url;
    } else if (main_image) {
      // Mock uploaded file URL
      mainImageUrl = `https://cloudinary.com/.../product_images/${name.replace(/\s+/g, '_').toLowerCase()}_main.jpg`;
    } else if (isCoupon) {
      // Default digital coupon image
      mainImageUrl = 'https://cloudinary.com/.../product_images/digital_coupon_default.jpg';
    }
    const additionalImageUrls = additional_images ? additional_images.map((_, index) => ({
      id: products.length * 10 + index + 1,
      image: `https://cloudinary.com/.../product_images/${name.replace(/\s+/g, '_').toLowerCase()}_${index + 1}.jpg`,
      alt_text: `${name} - Image ${index + 1}`,
      is_primary: false,
      order: index + 1,
    })) : [];

    // For coupons, set stock_quantity to unlimited (999999)
    const finalStockQuantity = isCoupon ? 999999 : stock_quantity;

    const newProduct = {
      id: products.length + 1,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      category,
      brand,
      description,
      short_description,
      price: price.toString(),
      price_usdt: price_usdt || null,
      discount_percentage,
      stock_quantity: finalStockQuantity,
      sku,
      model,
      colors,
      storage_options,
      ram_options,
      specifications,
      features,
      display_specs,
      chip_specs,
      camera_specs,
      storage_specs,
      battery_specs,
      operating_system,
      weight,
      main_image: mainImageUrl || null,
      images: additionalImageUrls,
      is_active,
      is_featured,
      is_coupon: isCoupon,
      coupon_value: isCoupon ? coupon_value : null,
      is_on_sale: false,
      is_in_stock: finalStockQuantity > 0,
      is_out_of_stock: finalStockQuantity === 0,
      stock_status: finalStockQuantity > 0 ? 'In Stock' : 'Out of Stock',
      is_new_arrival: true,
      is_best_seller: false,
      product_condition: isCoupon ? 'new' : product_condition,
      condition_display: isCoupon ? 'Brand New' : (product_condition === 'new' ? 'Brand New' : 'Used'),
      average_rating: 0.0,
      review_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_available: true,
      is_new: true,
      is_bestseller: false,
      has_colors: colors.length > 0,
      has_storage_options: storage_options.length > 0,
      has_ram_options: ram_options.length > 0,
    };

    products.push(newProduct);

    // Update brand and category product counts
    brand.product_count += 1;
    category.product_count += 1;

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }
}