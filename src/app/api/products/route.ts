import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for products (in a real app, this would be a database)
let products: any[] = [];

// GET /api/products/ - List all products
export async function GET() {
  return NextResponse.json({
    count: products.length,
    next: null,
    previous: null,
    results: products,
  });
}