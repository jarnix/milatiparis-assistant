"use client";

import Image from "next/image";
import { ShopifyProduct } from "@/types/shopify";
import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/outline";

interface ProductCardProps {
    product: ShopifyProduct;
    isOptimized: boolean;
    onClick: () => void;
}

export default function ProductCard({
    product,
    isOptimized,
    onClick,
}: ProductCardProps) {
    const imageUrl =
        product.featuredImage?.url ||
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+";

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
        >
            <div className="relative aspect-square">
                <Image
                    src={imageUrl}
                    alt={product.featuredImage?.altText || product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                />
                <div className="absolute top-4 right-4">
                    {isOptimized ? (
                        <CheckCircleIcon className="h-8 w-8 text-green-500 bg-white rounded-full p-1" />
                    ) : (
                        <ClockIcon className="h-8 w-8 text-yellow-500 bg-white rounded-full p-1" />
                    )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="p-6">
                <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                    {product.title}
                </h3>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : product.status === "DRAFT"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                    >
                        {product.status.toLowerCase()}
                    </span>
                    <span>
                        {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                            {isOptimized ? "Optimized" : "Needs optimization"}
                        </span>
                        <button className="text-primary hover:text-primary/80 font-medium text-sm">
                            Edit →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
