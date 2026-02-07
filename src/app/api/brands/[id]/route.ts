import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

// DELETE /api/brands/[id] - Delete a brand (Admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Mock admin authentication check (in a real app, verify JWT token)
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const brandId = parseInt(id);

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }

  // In a real app, you might want to check if the brand has associated products before deleting
  if (brand._count.products > 0) {
    return NextResponse.json({ 
      error: `Cannot delete brand with ${brand._count.products} associated products` 
    }, { status: 400 });
  }

  await prisma.brand.delete({
    where: { id: brandId }
  });

  return NextResponse.json({ message: 'Brand deleted successfully' });
}