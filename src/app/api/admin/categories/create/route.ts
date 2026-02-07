import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';
import { prisma } from '@/server/db';
import fs from 'fs';
import path from 'path';

// POST /api/admin/categories/create - Create new category
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdminAuth(request.headers, request.cookies);
    if (!authResult.ok) return unauthorizedResponse();

    let name: string;
    let display_name: string;
    let description: string;
    let image: string | undefined;
    let is_active: boolean;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle multipart form data
      const formData = await request.formData();
      name = formData.get('name') as string;
      display_name = formData.get('display_name') as string;
      description = formData.get('description') as string || '';
      image = formData.get('image') as string;
      is_active = formData.get('is_active') === 'true';

      // Handle base64 image or URL
      if (image && image.startsWith('data:')) {
        // Save base64 as file
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'categories');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const matches = image.match(/^data:(.+);base64,(.*)$/);
        if (matches) {
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = matches[1].split('/')[1] || 'png';
          const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
          const filePath = path.join(uploadsDir, uniqueName);

          fs.writeFileSync(filePath, buffer);
          image = `/uploads/categories/${uniqueName}`;
        }
      }
    } else {
      // Handle JSON
      const body = await request.json();
      name = body.name;
      display_name = body.display_name;
      description = body.description || '';
      image = body.image;
      is_active = body.is_active !== false; // Default to true if not specified

      // Handle base64 image
      if (image && image.startsWith('data:')) {
        // Save base64 as file
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'categories');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const matches = image.match(/^data:(.+);base64,(.*)$/);
        if (matches) {
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = matches[1].split('/')[1] || 'png';
          const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
          const filePath = path.join(uploadsDir, uniqueName);

          fs.writeFileSync(filePath, buffer);
          image = `/uploads/categories/${uniqueName}`;
        }
      }
    }

    // Validation
    if (!name || !display_name) {
      return NextResponse.json({ 
        error: 'Missing required fields: name and display_name are required' 
      }, { status: 400 });
    }

    // Check if category name already exists (case insensitive)
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        },
        is_deleted: false
      }
    });
    
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

    const newCategory = await prisma.category.create({
      data: {
        name: name.toLowerCase().trim(),
        display_name: display_name.trim(),
        description: description.trim(),
        image: image && image.trim() ? image.trim() : undefined,
        is_active: is_active,
        is_deleted: false,
      }
    });

    return NextResponse.json({ 
      success: true, 
      category: newCategory 
    }, { status: 201 });

  } catch (err) {
    console.error('Error creating category:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}