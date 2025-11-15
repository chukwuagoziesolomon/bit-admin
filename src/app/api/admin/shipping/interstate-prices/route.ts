import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for interstate shipping prices
const interstatePrices: any[] = [
  {
    id: 1,
    state_name: "Lagos",
    shipping_price: "2500.00",
    is_active: true,
    is_free_shipping: false,
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-15T10:30:00Z"
  }
];

// GET /api/admin/shipping/interstate-prices/ - Get all interstate shipping prices with filters and pagination
export async function GET(request: NextRequest) {
  // Mock admin authentication check
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Token ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const is_active = searchParams.get('is_active');
  const page = parseInt(searchParams.get('page') || '1');
  const per_page = parseInt(searchParams.get('per_page') || '20');

  let filteredPrices = interstatePrices;

  // Filter by search
  if (search) {
    filteredPrices = filteredPrices.filter(price =>
      price.state_name.toLowerCase().includes(search.toLowerCase()) ||
      price.shipping_price.includes(search)
    );
  }

  // Filter by is_active
  if (is_active !== null) {
    const active = is_active === 'true';
    filteredPrices = filteredPrices.filter(price => price.is_active === active);
  }

  // Pagination
  const total_prices = filteredPrices.length;
  const total_pages = Math.ceil(total_prices / per_page);
  const startIndex = (page - 1) * per_page;
  const endIndex = startIndex + per_page;
  const paginatedPrices = filteredPrices.slice(startIndex, endIndex);

  // Statistics
  const active_prices = interstatePrices.filter(p => p.is_active).length;
  const inactive_prices = interstatePrices.filter(p => !p.is_active).length;
  const free_shipping_states = interstatePrices.filter(p => p.is_free_shipping).length;

  const response = {
    prices: paginatedPrices,
    pagination: {
      current_page: page,
      per_page,
      total_prices,
      total_pages,
      has_next: page < total_pages,
      has_previous: page > 1
    },
    statistics: {
      total_prices: interstatePrices.length,
      active_prices,
      inactive_prices,
      free_shipping_states
    }
  };

  return NextResponse.json(response);
}