import { NextRequest, NextResponse } from 'next/server';
import { categories } from '../../route';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';

// DELETE /api/admin/categories/[id]/delete - Soft delete category
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdminAuth(request.headers, request.cookies);
    if (!authResult.ok) return unauthorizedResponse();

    const resolvedParams = await params;
    const categoryId = parseInt(resolvedParams.id);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
    if (categoryIndex === -1) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const category = categories[categoryIndex];
    if (category.is_deleted) {
      return NextResponse.json({ error: 'Category is already deleted' }, { status: 400 });
    }

    // Soft delete - mark as deleted instead of removing
    categories[categoryIndex] = {
      ...category,
      is_deleted: true,
      is_active: false,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({ 
      success: true, 
      message: 'Category deleted successfully' 
    });

  } catch (err) {
    console.error('Error deleting category:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}