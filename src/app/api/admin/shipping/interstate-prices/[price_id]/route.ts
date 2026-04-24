import { NextRequest, NextResponse } from 'next/server';
import { interstatePrices } from '../data';

// GET /api/admin/shipping/interstate-prices/{price_id}/ - Get specific interstate shipping price
export async function GET(request: NextRequest, { params }: { params: Promise<{ price_id: string }> }) {
  // Mock admin authentication check
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await params;
  const price_id = parseInt(resolvedParams.price_id);
  if (isNaN(price_id)) {
    return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
  }

  const price = interstatePrices.find((p) => p.id === price_id);
  if (!price) {
    return NextResponse.json({ error: 'Interstate shipping price not found' }, { status: 404 });
  }

  return NextResponse.json({ price });
}
