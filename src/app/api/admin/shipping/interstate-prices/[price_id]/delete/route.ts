import { NextRequest, NextResponse } from 'next/server';
import { interstatePrices } from '../data';

// DELETE /api/admin/shipping/interstate-prices/{price_id}/delete/ - Delete an interstate shipping price
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ price_id: string }> }) {
  // Mock admin authentication check
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Token ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolved = await params;
  const price_id = parseInt(resolved.price_id);
  if (isNaN(price_id)) {
    return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
  }

  const idx = interstatePrices.findIndex((p) => p.id === price_id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Interstate shipping price not found' }, { status: 404 });
  }

  const removed = interstatePrices.splice(idx, 1)[0];
  return NextResponse.json({ message: `Interstate shipping price for ${removed.state_name} deleted successfully` });
}
