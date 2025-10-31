import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for products (in a real app, this would be a database)
const products: any[] = [];

// DELETE /api/products/[id] - Delete a product (Admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // Mock admin authentication check (in a real app, verify JWT token)
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const productId = parseInt(params.id);
  const productIndex = products.findIndex(product => product.id === productId);

  if (productIndex === -1) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // Get the product before deleting to update brand count
  const product = products[productIndex];

  // Remove the product
  products.splice(productIndex, 1);

  // Note: In a real app, you would also update the brand's product_count
  // But since we don't have shared state across files, this is a limitation of in-memory storage

  return NextResponse.json({ message: 'Product deleted successfully' });
}