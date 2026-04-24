import { NextRequest, NextResponse } from 'next/server';
import { interstatePrices } from '../../data';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ price_id: string }> }) {
  return handleUpdate(request, await params);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ price_id: string }> }) {
  return handleUpdate(request, await params);
}

async function handleUpdate(request: NextRequest, params: { price_id: string }) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const price_id = parseInt(params.price_id);
  if (isNaN(price_id)) {
    return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
  }

  const priceIndex = interstatePrices.findIndex((p) => p.id === price_id);
  if (priceIndex === -1) {
    return NextResponse.json({ error: 'Interstate shipping price not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { state_name, shipping_price, shipping_price_usdt, is_active, is_free_shipping } = body;

    if (state_name !== undefined) {
      const existing = interstatePrices.find((p) => p.id !== price_id && p.state_name.toLowerCase() === String(state_name).toLowerCase());
      if (existing) {
        return NextResponse.json({ error: 'Validation failed', errors: { state_name: ['A shipping price for this state already exists'] } }, { status: 400 });
      }
      interstatePrices[priceIndex].state_name = String(state_name);
    }

    if (shipping_price !== undefined) {
      const sp = Number(shipping_price);
      if (isNaN(sp) || sp < 0) {
        return NextResponse.json({ error: 'Validation failed', errors: { shipping_price: ['Shipping price cannot be negative'] } }, { status: 400 });
      }
      interstatePrices[priceIndex].shipping_price = sp.toFixed(2);
      interstatePrices[priceIndex].is_free_shipping = sp === 0;
    }

    if (shipping_price_usdt !== undefined) {
      const spu = shipping_price_usdt === null ? null : Number(shipping_price_usdt);
      if (spu !== null && (isNaN(spu) || spu < 0)) {
        return NextResponse.json({ error: 'Validation failed', errors: { shipping_price_usdt: ['Shipping price (USDT) must be >= 0'] } }, { status: 400 });
      }
      interstatePrices[priceIndex].shipping_price_usdt = spu === null ? null : spu.toFixed(6);
    }

    if (is_active !== undefined) {
      interstatePrices[priceIndex].is_active = Boolean(is_active);
    }
    if (is_free_shipping !== undefined) {
      interstatePrices[priceIndex].is_free_shipping = Boolean(is_free_shipping);
    }

    interstatePrices[priceIndex].updated_at = new Date().toISOString();

    return NextResponse.json({ message: 'Interstate shipping price updated successfully', price: interstatePrices[priceIndex] });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON data' }, { status: 400 });
  }
}
