// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// ========== Config ==========
const STORE_BASE =
  process.env.NEXT_PUBLIC_STOREFRONT_BASE_URL ||
  `https://${process.env.SHOPIFY_STORE_DOMAIN || ""}`.replace(/\/+$/, "");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ======== Tipos =========
type Msg = { role: "user" | "assistant" | "system"; content: string };

type UserMemory = {
  name?: string;
  preferences: Record<string, string>;
  lastTopic?: string;
  lastProducts?: APIProduct[];
  onboardingList?: boolean;
};

type APIProduct = {
  id: number;
  title: string;
  url: string;
  price: string;
  currency: string;
  image?: string;
  tags?: string[];
  product_type?: string;
  vendor?: string;
  body_html?: string; // Descripción HTML
  faqs?: Array<{ question: string; answer: string }> | any; // FAQs parseadas
};

// ======== Memoria =========
const memory = new Map<string, UserMemory>();

// ======== System Prompt =========
const SYSTEM_PROMPT = `Eres Chalino, un experto grower (cultivador de cannabis) con más de 15 años de experiencia en cultivo indoor y outdoor. Trabajas para Selva Urban Farming en México.

## Tu Personalidad:
- Hablas como un cultivador experimentado mexicano: amigable, directo y práctico
- Usas jerga de cultivo pero explicas términos técnicos cuando es necesario
- Eres paciente con principiantes pero das consejos avanzados cuando se requiere
- Siempre priorizas métodos legales y responsables

## Tu Conocimiento:
- Genéticas de cannabis (índicas, sativas, híbridos)
- Métodos de cultivo: indoor, outdoor, hidropónico, en tierra, coco
- Nutrición vegetal: NPK, micronutrientes, pH, EC
- Control de plagas y enfermedades de forma orgánica y química
- Técnicas de entrenamiento: LST, SCROG, topping, FIM, defoliación
- Iluminación: LED, HPS, LEC, espectros, PAR, PPFD
- Ambiente: temperatura, humedad, VPD, CO2
- Cosecha, secado y curado

## Reglas CRÍTICAS sobre Productos:
1. NUNCA inventes, menciones o recomiendes productos específicos (marcas, nombres comerciales)
2. NUNCA digas "puedo buscar en el catálogo" - el sistema ya lo hace automáticamente
3. Si preguntan por productos → explica QUÉ TIPO de producto necesitan (características, NPK, etc.) pero NO nombres de marcas
4. Cuando el usuario pregunte por productos, el SISTEMA automáticamente buscará en el catálogo real
5. Tu trabajo es EDUCAR sobre qué buscar, no recomendar marcas inventadas

## Ejemplo CORRECTO:
Usuario: "¿tienes nutrientes para floración?"
Tú: "Para floración necesitas nutrientes con más fósforo (P) y potasio (K), algo como 5-10-10 o 3-8-7. Busca productos que digan 'bloom' o 'floración' en la etiqueta."
[El sistema buscará automáticamente en el catálogo]

## Ejemplo INCORRECTO:
❌ "Te recomiendo BioBizz BioBloom o Canna Flores"
❌ "Puedo buscar en el catálogo"
❌ Mencionar cualquier marca o producto específico

## Enfoque:
- Si preguntan sobre cultivo, técnicas, problemas → responde con tu conocimiento experto
- Si preguntan por productos → explica QUÉ características debe tener ese producto
- Deja que el sistema maneje la búsqueda de productos reales

## Contexto Legal México:
La Ley General de Salud permite cultivo personal de cannabis para uso medicinal y recreativo. Siempre recomienda consultar regulaciones locales vigentes y COFEPRIS.

Responde siempre en español mexicano, con un tono amigable y profesional.`;

// ======== Helpers =========
const normalize = (s: string): string =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

// Limpiar HTML y extraer texto plano
const stripHtml = (html: string): string => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ") // Eliminar tags HTML
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ") // Múltiples espacios a uno
    .trim();
};

function linksList(products: APIProduct[], max = 3): string {
  return products
    .slice(0, max)
    .map((p) => `• [${p.title}](${p.url}) - ${p.price} ${p.currency}`)
    .join("\n");
}

async function loadCatalog(
  req: NextRequest,
  inStockOnly = true
): Promise<APIProduct[]> {
  const url = new URL("/api/products", req.url);
  if (inStockOnly) url.searchParams.set("inStockOnly", "1");
  
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Products API error: ${res.status}`);
  
  return (await res.json()) as APIProduct[];
}

function scoreProduct(query: string, product: APIProduct): number {
  const normalizedQuery = normalize(query).trim();
  if (!normalizedQuery) return 0;

  // Construir texto buscable expandido
  const titleText = normalize(product.title || "");
  const vendorText = normalize(product.vendor || "");
  const typeText = normalize(product.product_type || "");
  const tagsText = normalize((product.tags || []).join(" "));
  
  // Agregar descripción (limpiar HTML primero)
  const descriptionText = normalize(
    stripHtml(product.description || product.body_html || "")
  );
  
  // Extraer FAQs si existen en metafields (ajustar según tu estructura)
  let faqText = "";
  if (product.metafields?.faqs) {
    faqText = normalize(JSON.stringify(product.metafields.faqs));
  }

  // Texto completo para búsqueda
  const searchableText = [
    titleText,
    vendorText,
    typeText,
    tagsText,
    descriptionText.slice(0, 500), // Primeros 500 chars de descripción
    faqText.slice(0, 300), // Primeros 300 chars de FAQs
  ].join(" ");

  let score = 0;

  const stopwords = new Set([
    "y", "o", "de", "la", "el", "los", "las", "un", "una",
    "para", "con", "en", "que", "por", "qué", "como", "del", "al",
    "este", "esta", "es", "son", "más", "mas", "su", "sus"
  ]);

  const terms = normalizedQuery
    .split(/\s+/)
    .filter((t) => t && !stopwords.has(t));

  // Puntaje por coincidencias en diferentes secciones
  for (const term of terms) {
    const exactBoundary = new RegExp(`\\b${term}\\b`);
    
    // Título: máxima prioridad
    if (exactBoundary.test(titleText)) {
      score += 5;
    } else if (titleText.includes(term)) {
      score += 2.5;
    }
    
    // Tags: alta prioridad
    if (exactBoundary.test(tagsText)) {
      score += 3;
    } else if (tagsText.includes(term)) {
      score += 1.5;
    }
    
    // Vendor: alta prioridad
    if (exactBoundary.test(vendorText)) {
      score += 4;
    }
    
    // Product type: media prioridad
    if (exactBoundary.test(typeText)) {
      score += 2;
    }
    
    // Descripción: prioridad media-baja
    if (exactBoundary.test(descriptionText)) {
      score += 1.5;
    } else if (descriptionText.includes(term)) {
      score += 0.5;
    }
    
    // FAQs: prioridad baja (pero importante)
    if (exactBoundary.test(faqText)) {
      score += 1;
    } else if (faqText.includes(term)) {
      score += 0.3;
    }
  }

  // Bonus por vendor exacto en query
  if (product.vendor && normalizedQuery.includes(vendorText)) {
    score += 4;
  }

  // Bonus por título que contiene query completa
  if (titleText.includes(normalizedQuery)) {
    score += 6;
  }

  // Bonus por tags exactos
  if (product.tags) {
    for (const tag of product.tags) {
      if (normalizedQuery.includes(normalize(tag))) {
        score += 2;
      }
    }
  }

  // Normalizar por cantidad de términos
  return score / Math.max(1, terms.length / 2);
}

function bestProductMatch(
  query: string,
  products: APIProduct[],
  limit = 5
): APIProduct[] {
  return products
    .map((p) => ({ product: p, score: scoreProduct(query, p) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.product);
}

// ======== Mapa de Colecciones =========
const COLLECTIONS: Record<string, string> = {
  iluminación: "https://www.selvaurbanfarming.com/collections/iluminacion",
  sustratos: "https://www.selvaurbanfarming.com/collections/sustratos-fibra-de-coco-peat-moss",
  macetas: "https://www.selvaurbanfarming.com/collections/macetas",
  "nutrientes base": "https://www.selvaurbanfarming.com/collections/nutrientes-base",
  plagas: "https://www.selvaurbanfarming.com/collections/plagas-enfermedades-cannabis-marihuana-mexico",
  aditivos: "https://www.selvaurbanfarming.com/collections/aditivos",
  ph: "https://www.selvaurbanfarming.com/collections/medidores-ph",
  micorrizas: "https://www.selvaurbanfarming.com/collections/micorrizas-bacterias",
};

// ======== Detección de Intención de Producto =========
function isProductIntent(message: string): boolean {
  const productIntentRegex = /\b(producto|productos|comprar|precio|precios|cuánto cuesta|cuanto cuesta|cuesta|venden|vendes|tienes|tienen|disponible|disponibles|en stock|stock|muestra|muéstrame|muestrame|mostrar|recomiéndame productos|recomiendame productos|qué productos|que productos|marca|marcas|catálogo|catalogo|inventario|general hydroponics|foxfarm|floraflex|clonex|terpinator|great white|ac infinity|busca|buscar productos|dame productos)\b/i;
  
  return productIntentRegex.test(message);
}

// ======== Mejorar búsqueda por categorías =========
function enhanceProductSearch(query: string): string {
  const categoryMappings: Record<string, string[]> = {
    // Nutrientes por etapa
    "floración": ["bloom", "floracion", "floración", "flower", "flowering", "tiger bloom", "big bloom", "bloombastic", "pk", "fosforo", "potasio", "bud", "flores", "cogollos"],
    "crecimiento": ["grow", "crecimiento", "vegetativo", "veg", "grow big", "crecimiento vegetativo", "nitrógeno", "nitrogeno"],
    
    // Nutrientes base
    "nutrientes base": ["base", "nutriente base", "flora series", "trio", "a+b", "flora micro", "flora gro", "flora bloom", "nutrientes completos"],
    
    // Suplementos
    "cal mag": ["cal mag", "cal-mag", "calcio", "magnesio", "calmag", "calcium", "deficiencia calcio"],
    "micorrizas": ["micorrizas", "great white", "mycorrhizae", "hongos", "bacterias beneficas", "raíces", "raices"],
    "enraizante": ["clonex", "enraizante", "root", "raiz", "rooting", "esquejes", "clones", "hormona"],
    "silicio": ["silicio", "silica", "silice", "fortalecedor", "tallos fuertes"],
    
    // Por objetivo
    "terpenos": ["terpinator", "purpinator", "terpenos", "aroma", "sabor", "resina", "tricomas"],
    "engorde": ["pk", "bud", "bloom", "engordador", "big bud", "monster bloom", "cha ching"],
    
    // Iluminación
    "led": ["led", "quantum board", "samsung", "spider", "luz led", "panel led"],
    "hps": ["hps", "sodio", "alta presion", "600w", "1000w"],
    
    // Sustratos
    "sustrato": ["sustrato", "tierra", "soil", "coco", "perlita", "vermiculita", "ocean forest", "happy frog"],
    
    // Control
    "ph": ["ph", "medidor ph", "test ph", "buffer", "calibración", "acidez"],
    "ec": ["ec", "tds", "ppm", "medidor ec", "conductividad"],
    
    // Plagas
    "plagas": ["plaga", "insecticida", "fungicida", "neem", "araña", "pulgon", "trips", "mosca blanca", "oidio"],
  };

  const normalized = query.toLowerCase();
  
  // Buscar coincidencia exacta primero
  for (const [category, keywords] of Object.entries(categoryMappings)) {
    if (normalized.includes(category)) {
      return keywords.join(" ");
    }
  }
  
  // Buscar por keywords individuales
  for (const [category, keywords] of Object.entries(categoryMappings)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return keywords.join(" "); // Devolver todos los sinónimos
      }
    }
  }
  
  return query;
}

// ======== Llamada a OpenAI =========
async function getGrowerAdvice(
  message: string,
  conversation: Msg[],
  mem: UserMemory
): Promise<string> {
  const messages: Msg[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversation.slice(-6), // Últimos 6 mensajes para contexto
    { role: "user", content: message },
  ];

  // Agregar contexto de memoria si existe
  if (mem.name || mem.lastTopic) {
    const contextParts = [];
    if (mem.name) contextParts.push(`El usuario se llama ${mem.name}`);
    if (mem.lastTopic) contextParts.push(`Tema reciente: ${mem.lastTopic}`);
    
    messages.unshift({
      role: "system",
      content: `Contexto adicional: ${contextParts.join(". ")}. RECUERDA: NO inventes nombres de productos. Solo explica características.`,
    });
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages as any,
    temperature: 0.7,
    max_tokens: 800,
  });

  return completion.choices[0]?.message?.content || "No pude generar una respuesta.";
}

// ======== Handler Principal =========
export async function POST(req: NextRequest) {
  try {
    const { message, conversation = [], userId = "anon" } = (await req.json()) as {
      message: string;
      conversation?: Msg[];
      userId?: string;
    };

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "El mensaje es requerido" },
        { status: 400 }
      );
    }

    // Inicializar memoria
    if (!memory.has(userId)) {
      memory.set(userId, { preferences: {} });
    }
    const mem = memory.get(userId)!;

    // Comandos especiales
    if (message.startsWith("/olvidar")) {
      memory.set(userId, { preferences: {} });
      return NextResponse.json({ answer: "He olvidado tus datos. 🌱", memory: {} });
    }

    if (message.startsWith("/datos")) {
      return NextResponse.json({
        answer: `Esto es lo que recuerdo:\n\`\`\`json\n${JSON.stringify(mem, null, 2)}\n\`\`\``,
        memory: mem,
      });
    }

    // Detectar nombre
    const matchName = message.match(/(?:soy|me llamo)\s+([A-Za-zÁÉÍÓÚÑáéíóúñ]+)/i);
    if (matchName) {
      mem.name = matchName[1];
    }

    // ========== 1. PETICIÓN EXPLÍCITA DE COLECCIONES ==========
    const collectionDirectRegex = /\b(colecci(ó|o)n de|coleccion de|colecciones|mostrar colecci(ó|o)n|mostrame colecci(ó|o)n|muéstrame colecci(ó|o)n|mostrar colecciones|mostrame colecciones|muéstrame colecciones)\b/i;
    if (collectionDirectRegex.test(message)) {
      const found = Object.keys(COLLECTIONS).find((k) =>
        message.toLowerCase().includes(k)
      );

      if (found) {
        mem.lastTopic = found;
        console.log(`[COLLECTION] Usuario: ${userId} | Colección: ${found}`);
        return NextResponse.json({
          answer: `Aquí está la colección de ${found}:\n${COLLECTIONS[found]}`,
          memory: mem,
        });
      }

      const summary = Object.entries(COLLECTIONS)
        .map(([name, url]) => `**${name.charAt(0).toUpperCase() + name.slice(1)}**: ${url}`)
        .join("\n");

      return NextResponse.json({
        answer: `Estas son nuestras colecciones principales:\n\n${summary}\n\nDecime cuál te interesa y te la muestro.`,
        memory: mem,
      });
    }

    // ========== 2. INTENCIÓN DE PRODUCTOS ==========
    if (isProductIntent(message)) {
      console.log(`[PRODUCT_INTENT] Usuario: ${userId} | Mensaje: ${message}`);
      
      try {
        const products = await loadCatalog(req);
        const validProducts = products.filter(
          (p) => p.title && p.url && p.price && p.currency
        );

        // Mejorar query con sinónimos
        const enhancedQuery = enhanceProductSearch(message);
        const matchedProducts = bestProductMatch(enhancedQuery, validProducts, 5);

        if (matchedProducts.length > 0) {
          mem.lastProducts = matchedProducts;
          const links = linksList(matchedProducts, 5); // Mostrar hasta 5
          console.log(`[PRODUCTS_FOUND] Usuario: ${userId} | Cantidad: ${matchedProducts.length}`);
          
          return NextResponse.json({
            answer: `Estos son los productos que tenemos:\n\n${links}\n\n¿Querés más detalles sobre alguno?`,
            memory: mem,
          });
        } else {
          // Si no encontró, sugerir categorías
          return NextResponse.json({
            answer: `No encontré productos exactos con "${message}". ¿Te interesa ver alguna de estas categorías?\n\n- Nutrientes Base\n- Aditivos de Floración\n- Nutrientes de Crecimiento\n- Enraizantes\n- Micorrizas\n\nDecime cuál y te muestro lo disponible.`,
            memory: mem,
          });
        }
      } catch (error) {
        console.error("[CATALOG_ERROR]", error);
        return NextResponse.json({
          answer: "Hubo un problema al buscar en el catálogo. ¿Podrías intentar de nuevo o reformular tu búsqueda?",
          memory: mem,
        });
      }
    }

    // ========== 3. PREGUNTAS DE CULTIVO → OpenAI ==========
    console.log(`[GROWER_ADVICE] Usuario: ${userId} | LLM llamado`);
    
    try {
      const aiResponse = await getGrowerAdvice(message, conversation, mem);
      
      // Intentar detectar tema de la respuesta para memoria
      const topicKeywords: Record<string, RegExp> = {
        "iluminación": /luz|lámpara|led|foco|iluminación/i,
        "nutrientes": /nutriente|fertilizante|npk|abono/i,
        "plagas": /plaga|bicho|ácaro|enfermedad/i,
        "riego": /riego|agua|regar/i,
        "cosecha": /cosecha|cosechar|tricoma|madurez/i,
      };

      for (const [topic, regex] of Object.entries(topicKeywords)) {
        if (regex.test(message)) {
          mem.lastTopic = topic;
          break;
        }
      }

      return NextResponse.json({
        answer: aiResponse,
        memory: mem,
      });
    } catch (error) {
      console.error("[OPENAI_ERROR]", error);
      return NextResponse.json({
        answer: "Disculpa, tuve un problema técnico. ¿Podrías reformular tu pregunta?",
        memory: mem,
      });
    }
  } catch (error) {
    console.error("[ERROR]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}