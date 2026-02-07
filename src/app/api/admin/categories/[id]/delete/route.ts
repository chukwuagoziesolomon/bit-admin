import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';
import { prisma } from '@/server/db';

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

    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (category.is_deleted) {
      return NextResponse.json({ error: 'Category is already deleted' }, { status: 400 });
    }

    // Soft delete - mark as deleted instead of removing
    await prisma.category.update({
      where: { id: categoryId },
      data: {
        is_deleted: true,
        is_active: false,
        updated_at: new Date(),
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Category deleted successfully' 
    });

  } catch (err) {
    console.error('Error deleting category:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}