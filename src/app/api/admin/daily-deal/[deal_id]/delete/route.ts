import { NextRequest, NextResponse } from 'next/server';
import { deals } from '../../data';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';

export async function DELETE(request: NextRequest, { params }: { params: { deal_id: string } }) {
  try {
    const authResult = requireAdminAuth(request.headers, request.cookies);
    if (!authResult.ok) return unauthorizedResponse();

    const id = Number(params.deal_id);
    const idx = deals.findIndex((d) => d.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });

    deals.splice(idx, 1);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting deal:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
