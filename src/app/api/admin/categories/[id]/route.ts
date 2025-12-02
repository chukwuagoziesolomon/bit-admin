import { NextRequest, NextResponse } from 'next/server';
import { categories } from '../route';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';

// GET /api/admin/categories/[id] - Get single category
export async function GET(
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

    const category = categories.find(cat => cat.id === categoryId);
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

    const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
    if (categoryIndex === -1) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const category = categories[categoryIndex];
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
      const existingCategory = categories.find(
        cat => cat.name.toLowerCase() === name.toLowerCase() && 
        cat.id !== categoryId && 
        !cat.is_deleted
      );
      
      if (existingCategory) {
        return NextResponse.json({ 
          error: 'Category with this name already exists' 
        }, { status: 409 });
      }
    }

    // Update category fields
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