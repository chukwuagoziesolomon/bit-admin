import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';
import { prisma } from '@/server/db';

// PATCH /api/admin/products/[id]/update - Partial update
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return updateProduct(request, await params, false);
}

// PUT /api/admin/products/[id]/update - Full update
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return updateProduct(request, await params, true);
}

async function updateProduct(
  request: NextRequest,
  params: { id: string },
  isFullUpdate: boolean
) {
  try {
    const authResult = requireAdminAuth(request.headers, request.cookies);
    if (!authResult.ok) return unauthorizedResponse();

    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        brand: true
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const body = await request.json();

    // For full update, validate all required fields
    if (isFullUpdate) {
      const { name, category_id, brand_id, description, short_description, price, sku, stock_quantity, product_condition, is_active = true, is_featured = false, is_coupon = false, coupon_value } = body;

      const errors: { [key: string]: string[] } = {};

      if (!name) errors.name = ['This field is required.'];
      if (!category_id) errors.category_id = ['This field is required.'];
      if (!brand_id) errors.brand_id = ['This field is required.'];
      if (!description) errors.description = ['This field is required.'];
      if (!short_description) errors.short_description = ['This field is required.'];
      if (!price) errors.price = ['This field is required.'];
      if (!sku) errors.sku = ['This field is required.'];
      if (!stock_quantity && stock_quantity !== 0) errors.stock_quantity = ['This field is required.'];
      if (!is_coupon && !product_condition) errors.product_condition = ['This field is required.'];
      if (is_coupon && !coupon_value) errors.coupon_value = ['This field is required for coupon products.'];

      if (Object.keys(errors).length > 0) {
        return NextResponse.json(errors, { status: 400 });
      }

      // Full update - replace all fields
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          name,
          sku,
          price: price.toString(),
          coupon_value: is_coupon ? coupon_value : null,
          is_coupon,
          category_id,
          brand_id,
          description,
          short_description,
          stock_quantity,
          product_condition,
          is_active,
          is_featured,
          updated_at: new Date(),
        },
        include: {
          category: true,
          brand: true
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Product updated successfully',
        product: updatedProduct
      });
    } else {
      // Partial update - only update provided fields
      const updateData: any = {};
      
      if (body.name !== undefined) updateData.name = body.name;
      if (body.sku !== undefined) updateData.sku = body.sku;
      if (body.price !== undefined) updateData.price = body.price.toString();
      if (body.coupon_value !== undefined) updateData.coupon_value = body.coupon_value;
      if (body.is_coupon !== undefined) updateData.is_coupon = body.is_coupon;
      if (body.category_id !== undefined) updateData.category_id = body.category_id;
      if (body.brand_id !== undefined) updateData.brand_id = body.brand_id;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.short_description !== undefined) updateData.short_description = body.short_description;
      if (body.stock_quantity !== undefined) updateData.stock_quantity = body.stock_quantity;
      if (body.product_condition !== undefined) updateData.product_condition = body.product_condition;
      if (body.is_active !== undefined) updateData.is_active = body.is_active;
      if (body.is_featured !== undefined) updateData.is_featured = body.is_featured;

      updateData.updated_at = new Date();

      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: updateData,
        include: {
          category: true,
          brand: true
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Product updated successfully',
        product: updatedProduct
      });
    }

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}