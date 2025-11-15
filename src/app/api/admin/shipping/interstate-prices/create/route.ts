import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for interstate shipping prices (shared across routes in mock)
const interstatePrices: any[] = [
  {
    id: 1,
    state_name: "Lagos",
    shipping_price: "2500.00",
    is_active: true,
    is_free_shipping: false,
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-15T10:30:00Z"
  }
];

// POST /api/admin/shipping/interstate-prices/create/ - Create new interstate shipping price
export async function POST(request: NextRequest) {
  // Mock admin authentication check
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Token ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { state_name, shipping_price, is_active, is_free_shipping } = body;

    // Validate required fields
    if (!state_name || shipping_price === undefined || is_active === undefined || is_free_shipping === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if state already exists
    const existing = interstatePrices.find(p => p.state_name.toLowerCase() === state_name.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: 'Shipping price for this state already exists' }, { status: 400 });
    }

    const newPrice = {
      id: interstatePrices.length + 1,
      state_name,
      shipping_price: shipping_price.toString(),
      is_active,
      is_free_shipping,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    interstatePrices.push(newPrice);

    return NextResponse.json({
      message: "Interstate shipping price created successfully",
      price: newPrice
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON data' }, { status: 400 });
  }
}