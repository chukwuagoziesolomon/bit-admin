import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';
import { prisma } from '@/server/db';

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

    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (!category.is_deleted) {
      return NextResponse.json({ error: 'Category is not deleted' }, { status: 400 });
    }

    // Restore category
    const restoredCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        is_deleted: false,
        is_active: true,
        updated_at: new Date(),
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Category restored successfully',
      category: restoredCategory
    });

  } catch (err) {
    console.error('Error restoring category:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}