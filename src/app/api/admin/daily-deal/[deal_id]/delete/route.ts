import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';
import { prisma } from '@/server/db';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ deal_id: string }> }) {
  try {
    const authResult = requireAdminAuth(request.headers, request.cookies);
    if (!authResult.ok) return unauthorizedResponse();

    const resolved = await params;
    const id = Number(resolved.deal_id);
    
    const deal = await prisma.dailyDeal.findUnique({
      where: { id }
    });

    if (!deal) return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });

    await prisma.dailyDeal.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting deal:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
