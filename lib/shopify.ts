// /lib/shopify.ts
export async function shopifyFetch<T>(query: string, variables: Record<string, any> = {}) {
  const url = `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/${process.env.SHOPIFY_STOREFRONT_API_VERSION}/graphql.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data as T;
}

