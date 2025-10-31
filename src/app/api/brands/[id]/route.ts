import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for brands (in a real app, this would be a database)
let brands: any[] = [];

// DELETE /api/brands/[id] - Delete a brand (Admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // Mock admin authentication check (in a real app, verify JWT token)
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const brandId = parseInt(params.id);
  const brandIndex = brands.findIndex(brand => brand.id === brandId);

  if (brandIndex === -1) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }

  // In a real app, you might want to check if the brand has associated products before deleting
  brands.splice(brandIndex, 1);

  return NextResponse.json({ message: 'Brand deleted successfully' });
}