import { NextRequest, NextResponse } from 'next/server';
import { categories } from '../../route';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';

// PATCH /api/admin/categories/[id]/restore - Restore deleted category
export async function PATCH(
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
    if (!category.is_deleted) {
      return NextResponse.json({ error: 'Category is not deleted' }, { status: 400 });
    }

    // Restore category
    categories[categoryIndex] = {
      ...category,
      is_deleted: false,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({ 
      success: true, 
      message: 'Category restored successfully',
      category: categories[categoryIndex]
    });

  } catch (err) {
    console.error('Error restoring category:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}