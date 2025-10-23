// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";

const ADMIN_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
if (!ADMIN_DOMAIN) throw new Error("Missing env SHOPIFY_STORE_DOMAIN");
if (!ADMIN_TOKEN) throw new Error("Missing env SHOPIFY_ADMIN_API_ACCESS_TOKEN");

const STOREFRONT_BASE =
  process.env.NEXT_PUBLIC_STOREFRONT_BASE_URL || `https://${ADMIN_DOMAIN}`;
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "MXN";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inStockOnly = searchParams.get("inStockOnly") === "1";

    // GraphQL query para obtener productos con metafields
    const graphqlQuery = `
      query getProducts($first: Int!) {
       products(first: $first, query: "status:active") {
          edges {
            node {
              id
              title
              handle
              descriptionHtml
              status
              tags
              productType
              vendor
              images(first: 1) {
                edges {
                  node {
                    url
                  }
                }
              }
              variants(first: 50) {
                edges {
                  node {
                    id
                    price
                    inventoryQuantity
                    availableForSale
                  }
                }
              }
              metafields(first: 20) {
                edges {
                  node {
                    namespace
                    key
                    value
                    type
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(
      `https://${ADMIN_DOMAIN}/admin/api/2023-10/graphql.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": ADMIN_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: { first: 250 }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Shopify GraphQL API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      throw new Error("GraphQL query failed");
    }

    // Procesar la respuesta GraphQL
    const products = data.data.products.edges.flatMap((productEdge: any) => {
      const product = productEdge.node;
      
      // Solo procesar productos activos (doble verificación)
      if (product.status !== "ACTIVE") {
        return [];
      }

      // Extraer metafields
      const metafields = product.metafields.edges.map((metafieldEdge: any) => ({
        namespace: metafieldEdge.node.namespace,
        key: metafieldEdge.node.key,
        value: metafieldEdge.node.value,
        type: metafieldEdge.node.type,
      }));

      // Buscar FAQs en metafields - formato: custom.faq_question_1 + custom.faq_answer_1, etc.
      let faqs = null;
      const faqMetafields = metafields.filter(
        (m) => m.namespace === "custom" && (m.key.startsWith("faq_question_") || m.key.startsWith("faq_answer_"))
      );
      
      if (faqMetafields.length > 0) {
        const faqsArray = [];
        
        // Procesar FAQs del 1 al 6
        for (let i = 1; i <= 6; i++) {
          const question = faqMetafields.find(m => m.key === `faq_question_${i}`)?.value;
          const answer = faqMetafields.find(m => m.key === `faq_answer_${i}`)?.value;
          
          // Solo agregar si tanto pregunta como respuesta existen y no están vacías
          if (question && answer && question.trim() && answer.trim()) {
            faqsArray.push({
              question: question.trim(),
              answer: answer.trim()
            });
          }
        }
        
        // Solo asignar si hay al menos una FAQ completa
        if (faqsArray.length > 0) {
          faqs = faqsArray;
        }
      }

      // Si no hay variantes, crear entrada base
      if (!product.variants.edges || product.variants.edges.length === 0) {
        return [{
          id: product.id,
          title: product.title,
          url: `${STOREFRONT_BASE}/products/${product.handle}`,
          price: "0.00",
          currency: CURRENCY,
          image: product.images.edges[0]?.node.url || null,
          tags: product.tags || [],
          product_type: product.productType || "",
          vendor: product.vendor || "",
          body_html: product.descriptionHtml || "",
          inventory_quantity: 0,
          available: false,
          faqs: faqs,
          metafields: metafields,
        }];
      }

      // Crear una entrada por cada variante
      return product.variants.edges.map((variantEdge: any) => {
        const variant = variantEdge.node;
        return {
          id: parseInt(variant.id.replace("gid://shopify/ProductVariant/", "")) || 0,
          title: product.title,
          url: `${STOREFRONT_BASE}/products/${product.handle}`,
          price: parseFloat(variant.price || "0").toFixed(2),
          currency: CURRENCY,
          image: product.images.edges[0]?.node.url || null,
          tags: product.tags || [],
          product_type: product.productType || "",
          vendor: product.vendor || "",
          body_html: product.descriptionHtml || "",
          inventory_quantity: variant.inventoryQuantity || 0,
          available: variant.availableForSale && (variant.inventoryQuantity || 0) > 0,
          faqs: faqs,
          metafields: metafields,
        };
      });
    });

    // Filtrar por stock si se solicita
    const filteredProducts = inStockOnly
      ? products.filter((p: any) => p.available && p.inventory_quantity > 0)
      : products;

    return NextResponse.json(filteredProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}