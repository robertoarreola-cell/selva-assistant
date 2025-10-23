import { NextResponse } from "next/server";

export async function GET() {
  // Respuesta fija de prueba
  const products = [
    {
      id: "test-123",
      title: "Producto de Prueba",
      image: "https://via.placeholder.com/300x300.png?text=Prueba",
      price: "100.0",
      currency: "MXN",
      url: "https://selvaurbanfarming.com/products/test-123",
    },
  ];

  return NextResponse.json(products);
}

