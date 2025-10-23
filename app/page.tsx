"use client";
import { useEffect, useState } from "react";

type Product = {
  id: string;
  title: string;
  image?: string | null;
  price: string;
  currency: string;
  url: string;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener productos");
        return res.json();
      })
      .then((data) => {
        setProducts(data as Product[]);
      })
      .catch((err) => {
        console.error("Error al traer productos:", err);
        setError("No se pudieron cargar los productos.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-8">Productos</h1>

      {loading && <p className="text-gray-500">Cargando productos...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <p className="text-gray-600">No hay productos disponibles.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="border rounded-lg shadow hover:shadow-lg transition p-4 bg-white block"
          >
            {p.image ? (
              <img
                src={p.image}
                alt={p.title}
                className="w-full h-48 object-cover mb-3 rounded"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 mb-3 rounded grid place-items-center text-gray-500">
                Sin imagen
              </div>
            )}
            <h2 className="font-semibold text-lg line-clamp-2">{p.title}</h2>
            <p className="mt-2 text-gray-700">
              {p.price} {p.currency}
            </p>
          </a>
        ))}
      </div>
    </main>
  );
}

