// In-memory mock data and helpers for interstate shipping prices
export type InterstatePrice = {
  id: number;
  state_name: string;
  shipping_price: string; // stored as string for consistent JSON formatting
  shipping_price_usdt?: string | null; // optional
  is_active: boolean;
  is_free_shipping: boolean;
  created_at: string;
  updated_at: string;
};

export const interstatePrices: InterstatePrice[] = [
  {
    id: 1,
    state_name: 'Enugu',
    shipping_price: '1200.00',
    shipping_price_usdt: '0.816000',
    is_active: true,
    is_free_shipping: false,
    created_at: '2025-01-10T12:00:00Z',
    updated_at: '2025-07-01T08:00:00Z',
  },
];

let nextId = interstatePrices.length + 1;

export function getNextInterstatePriceId() {
  return nextId++;
}

export function formatShippingPrice(amount: number) {
  return amount.toFixed(2);
}

export function formatShippingPriceUsdt(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return null;
  return amount.toFixed(6);
}
