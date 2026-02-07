import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';
import { prisma } from '@/server/db';

// GET /api/admin/categories/[id] - Get single category
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdminAuth(request.headers, request.cookies);
    if (!authResult.ok) return unauthorizedResponse();

    if (!prisma) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

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

    return NextResponse.json({ category });

  } catch (err) {
    console.error('Error fetching category:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/categories/[id] - Update category
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

    const body = await request.json();
    const { name, display_name, description, image, is_active } = body;

    // Validate name if provided
    if (name) {
      const nameRegex = /^[a-z0-9_-]+$/;
      if (!nameRegex.test(name)) {
        return NextResponse.json({ 
          error: 'Category name must be lowercase with no spaces (use hyphens or underscores)' 
        }, { status: 400 });
      }

      // Check if name already exists (excluding current category)
      const existingCategory = await prisma.category.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive'
          },
          id: {
            not: categoryId
          },
          is_deleted: false
        }
      });
      
      if (existingCategory) {
        return NextResponse.json({ 
          error: 'Category with this name already exists' 
        }, { status: 409 });
      }
    }

    // Update category fields
    const updateData: any = { updated_at: new Date() };
    if (name !== undefined) updateData.name = name;
    if (display_name !== undefined) updateData.display_name = display_name;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: updateData
    });

    return NextResponse.json({ 
      success: true,
      message: 'Category updated successfully',
      category: updatedCategory
    });
    const updatedCategory = {
      ...category,
      ...(name && { name: name.toLowerCase().trim() }),
      ...(display_name && { display_name: display_name.trim() }),
      ...(description !== undefined && { description: description?.trim() || '' }),
      ...(image !== undefined && { image: image?.trim() || undefined }),
      ...(is_active !== undefined && { is_active: Boolean(is_active) }),
      updated_at: new Date().toISOString(),
    };

    categories[categoryIndex] = updatedCategory;

    return NextResponse.json({ 
      success: true, 
      category: updatedCategory 
    });

  } catch (err) {
    console.error('Error updating category:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}