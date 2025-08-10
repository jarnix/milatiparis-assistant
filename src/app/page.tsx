"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ShopifyProduct } from "@/types/shopify";
import ProductCard from "@/components/ProductCard";
import { UserCircleIcon } from "@heroicons/react/24/outline";

const ProductEditModal = dynamic(() => import("@/components/ProductEditModal"), {
    ssr: false,
});

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [products, setProducts] = useState<ShopifyProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] =
        useState<ShopifyProduct | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        }
    }, [status, router]);

    useEffect(() => {
        if (session) {
            fetchProducts();
        }
    }, [session]);

    const fetchProducts = async () => {
        try {
            const response = await fetch("/api/products");
            if (response.ok) {
                const data = await response.json();
                setProducts(data.products);
            } else {
                console.error("Failed to fetch products");
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleProductClick = (product: ShopifyProduct) => {
        setSelectedProduct(product);
        setModalOpen(true);
    };

    const handleSaveProduct = async (
        productId: string,
        newTitle: string,
        newDescription: string
    ) => {
        try {
            // Extract numeric ID from Shopify GID format
            // productId format: "gid://shopify/Product/10045716005211"
            const numericId = productId.split("/").pop();

            const response = await fetch(`/api/products/${numericId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    title: newTitle || undefined,
                    description: newDescription || undefined,
                    productId: productId, // Send the full GID to the API
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update product");
            }

            const result = await response.json();
            console.log("Product updated successfully:", result);

            // Refresh the products list to show updated data
            await fetchProducts();
        } catch (error) {
            console.error("Error saving product:", error);
            throw error; // Re-throw so the modal can handle the error
        }
    };

    const isOptimized = (product: ShopifyProduct) => {
        return (
            product.metafields?.edges?.some(
                (edge) =>
                    edge.node.namespace === "custom" &&
                    edge.node.key === "date_optimized"
            ) || false
        );
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    const optimizedCount = products.filter(isOptimized).length;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Milati Paris
                            </h1>
                            <p className="text-sm text-gray-500">
                                Product Optimizer Dashboard
                            </p>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex gap-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary">
                                        {products.length}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Total Products
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {optimizedCount}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Optimized
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                                    <span className="text-sm text-gray-700">
                                        {session.user?.email}
                                    </span>
                                </div>
                                <button
                                    onClick={() => signOut()}
                                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {products.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No products found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                isOptimized={isOptimized(product)}
                                onClick={() => handleProductClick(product)}
                            />
                        ))}
                    </div>
                )}
            </main>

            <ProductEditModal
                product={selectedProduct}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSaveProduct}
            />
        </div>
    );
}
