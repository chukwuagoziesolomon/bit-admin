import { NextRequest, NextResponse } from 'next/server';
import { categories, getNextCategoryId, CategoryItem } from '../route';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';

// POST /api/admin/categories/create - Create new category
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdminAuth(request.headers, request.cookies);
    if (!authResult.ok) return unauthorizedResponse();

    const body = await request.json();
    const { name, display_name, description, image } = body;

    // Validation
    if (!name || !display_name) {
      return NextResponse.json({ 
        error: 'Missing required fields: name and display_name are required' 
      }, { status: 400 });
    }

    // Check if category name already exists (case insensitive)
    const existingCategory = categories.find(
      cat => cat.name.toLowerCase() === name.toLowerCase() && !cat.is_deleted
    );
    
    if (existingCategory) {
      return NextResponse.json({ 
        error: 'Category with this name already exists' 
      }, { status: 409 });
    }

    // Validate name format (lowercase, no spaces, alphanumeric + hyphens/underscores)
    const nameRegex = /^[a-z0-9_-]+$/;
    if (!nameRegex.test(name)) {
      return NextResponse.json({ 
        error: 'Category name must be lowercase with no spaces (use hyphens or underscores)' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newCategory: CategoryItem = {
      id: getNextCategoryId(),
      name: name.toLowerCase().trim(),
      display_name: display_name.trim(),
      description: description?.trim() || '',
      image: image?.trim() || undefined,
      is_active: true,
      is_deleted: false,
      created_at: now,
      updated_at: now,
    };

    categories.push(newCategory);

    return NextResponse.json({ 
      success: true, 
      category: newCategory 
    }, { status: 201 });

  } catch (err) {
    console.error('Error creating category:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}