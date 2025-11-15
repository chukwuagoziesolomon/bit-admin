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

// GET /api/admin/shipping/interstate-prices/{price_id}/ - Get specific interstate shipping price
export async function GET(request: NextRequest, { params }: { params: { price_id: string } }) {
  // Mock admin authentication check
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Token ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const price_id = parseInt(params.price_id);
  if (isNaN(price_id)) {
    return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
  }

  const price = interstatePrices.find(p => p.id === price_id);
  if (!price) {
    return NextResponse.json({ error: 'Shipping price not found' }, { status: 404 });
  }

  return NextResponse.json({ price });
}