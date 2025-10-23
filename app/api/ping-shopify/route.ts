// /app/api/ping-shopify/route.ts
import { NextResponse } from 'next/server';
import { shopifyFetch } from '@/lib/shopify';

export async function GET() {
  const data = await shopifyFetch(`
    query {
      shop { name }
      products(first: 1) {
        edges { node { id title } }
      }
    }
  `);

  return NextResponse.json({
    ok: true,
    shop: data.shop,
    sample: data.products?.edges?.[0]?.node ?? null,
  });
}

