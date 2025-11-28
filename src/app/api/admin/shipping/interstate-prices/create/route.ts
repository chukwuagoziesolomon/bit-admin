import { NextRequest, NextResponse } from 'next/server';
import { interstatePrices, getNextInterstatePriceId, formatShippingPrice, formatShippingPriceUsdt } from '../data';

// POST /api/admin/shipping/interstate-prices/create/ - Create new interstate shipping price
export async function POST(request: NextRequest) {
  // Mock admin authentication check
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Token ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { state_name, shipping_price, shipping_price_usdt, is_active } = body;

    // Validate required fields
    if (!state_name || shipping_price === undefined || shipping_price === null) {
      return NextResponse.json({ error: 'Validation failed', errors: { state_name: ['state_name and shipping_price are required'] } }, { status: 400 });
    }

    // Validate numbers
    const sp = Number(shipping_price);
    if (isNaN(sp) || sp < 0) {
      return NextResponse.json({ error: 'Validation failed', errors: { shipping_price: ['Shipping price must be a number >= 0'] } }, { status: 400 });
    }
    let spUsdt: number | null = null;
    if (shipping_price_usdt !== undefined && shipping_price_usdt !== null) {
      spUsdt = Number(shipping_price_usdt);
      if (isNaN(spUsdt) || spUsdt < 0) {
        return NextResponse.json({ error: 'Validation failed', errors: { shipping_price_usdt: ['Shipping price (USDT) must be >= 0'] } }, { status: 400 });
      }
    }

    // Check unique state_name (case-insensitive)
    const existing = interstatePrices.find((p) => p.state_name.toLowerCase() === String(state_name).toLowerCase());
    if (existing) {
      return NextResponse.json({ error: 'Validation failed', errors: { state_name: ['A shipping price for this state already exists'] } }, { status: 400 });
    }

    const id = getNextInterstatePriceId();
    const now = new Date().toISOString();
    const newPrice = {
      id,
      state_name: String(state_name),
      shipping_price: formatShippingPrice(sp),
      shipping_price_usdt: formatShippingPriceUsdt(spUsdt),
      is_active: is_active === undefined ? true : Boolean(is_active),
      is_free_shipping: sp === 0,
      created_at: now,
      updated_at: now,
    };

    interstatePrices.push(newPrice);

    return NextResponse.json({ message: 'Interstate shipping price created successfully', price: newPrice }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON data' }, { status: 400 });
  }
}