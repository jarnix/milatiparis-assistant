"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ShopifyProduct } from "@/types/shopify";
import { XMarkIcon, SparklesIcon } from "@heroicons/react/24/outline";

// Import TipTapEditor component with dynamic import for SSR safety
const TipTapEditor = dynamic(() => import("./TipTapEditor"), {
    ssr: false,
    loading: () => (
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Loading editor...</span>
        </div>
    )
});
import HtmlViewer from "./HtmlViewer";

interface ProductEditModalProps {
    product: ShopifyProduct | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (
        productId: string,
        newTitle: string,
        newDescription: string
    ) => Promise<void>;
}

export default function ProductEditModal({
    product,
    isOpen,
    onClose,
    onSave,
}: ProductEditModalProps) {
    const [fullProduct, setFullProduct] = useState<ShopifyProduct | null>(null);
    const [isLoadingProduct, setIsLoadingProduct] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastGenerationCost, setLastGenerationCost] = useState<{
        costEUR: number;
        costUSD: number;
        totalTokens: number;
    } | null>(null);


    // Fetch full product data when modal opens
    useEffect(() => {
        if (isOpen && product) {
            const fetchFullProduct = async () => {
                setIsLoadingProduct(true);
                try {
                    const productId = product.id.split("/").pop(); // Extract numeric ID from GID
                    const response = await fetch(`/api/products/${productId}`, {
                        credentials: "include",
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setFullProduct(data.product);
                        // Don't populate the new fields - let user enter new content
                        setNewTitle("");
                        setNewDescription("");
                    } else {
                        console.error("Failed to fetch product details");
                        // Fallback to basic product data
                        setFullProduct(product);
                        setNewTitle("");
                        setNewDescription("");
                    }
                } catch (error) {
                    console.error("Error fetching product details:", error);
                    // Fallback to basic product data
                    setFullProduct(product);
                    setNewTitle("");
                    setNewDescription("");
                } finally {
                    setIsLoadingProduct(false);
                }
            };

            fetchFullProduct();
        }
    }, [isOpen, product]);

    if (!isOpen || !product) return null;

    const displayProduct = fullProduct || product;

    const handleSave = async () => {
        if (!newTitle.trim() && !newDescription.trim()) {
            alert("Please enter at least a title or description");
            return;
        }

        setIsSaving(true);
        try {
            await onSave(
                displayProduct.id,
                newTitle.trim(),
                newDescription.trim()
            );
            onClose();
            setNewTitle("");
            setNewDescription("");
        } catch (error) {
            console.error("Error saving changes:", error);
            alert("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setNewTitle("");
        setNewDescription("");
        onClose();
    };

    const handleGenerateContent = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch("/api/generate-content", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    title: displayProduct.title,
                    description: displayProduct.description,
                    imageUrl: imageUrl,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate content");
            }

            const data = await response.json();

            if (data.title) {
                setNewTitle(data.title);
            }
            if (data.description) {
                setNewDescription(data.description);
            }

            // Store cost information
            if (data.cost) {
                setLastGenerationCost({
                    costEUR: data.cost.costEUR,
                    costUSD: data.cost.costUSD,
                    totalTokens: data.cost.totalTokens,
                });
            }
        } catch (error) {
            console.error("Error generating content:", error);
            alert("Failed to generate content. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const imageUrl =
        displayProduct.featuredImage?.url ||
        displayProduct.images?.edges?.[0]?.node.url ||
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header with product info and generate button */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                                <Image
                                    src={imageUrl}
                                    alt={displayProduct.title}
                                    width={60}
                                    height={60}
                                    className="rounded-lg object-cover"
                                />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 truncate max-w-md">
                                    {displayProduct.title}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Status:{" "}
                                    <span className="capitalize">
                                        {displayProduct.status?.toLowerCase()}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <button
                                    onClick={handleGenerateContent}
                                    disabled={isGenerating}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGenerating ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <SparklesIcon className="h-5 w-5" />
                                    )}
                                    {isGenerating
                                        ? "Generating..."
                                        : "Generate"}
                                </button>
                                {lastGenerationCost && (
                                    <div className="text-xs text-gray-600 mt-1">
                                        <span className="text-green-600 font-mono">
                                            $
                                            {lastGenerationCost.costUSD.toFixed(
                                                4
                                            )}
                                        </span>
                                        <span className="text-gray-400 ml-1">
                                            ({lastGenerationCost.totalTokens}{" "}
                                            tokens)
                                        </span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Title Card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Product Title
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Title
                                </label>
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    <p className="text-gray-900">
                                        {displayProduct.title}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New Title
                                    {newTitle && (
                                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                                            <SparklesIcon className="h-3 w-3" />
                                            AI Enhanced
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) =>
                                        setNewTitle(e.target.value)
                                    }
                                    placeholder="Enter optimized title or use AI generation..."
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description Card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Product Description
                        </h3>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Description
                                </label>
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg h-64 overflow-y-auto">
                                    {isLoadingProduct ? (
                                        <p className="text-gray-500">
                                            Loading...
                                        </p>
                                    ) : (
                                        <HtmlViewer
                                            content={
                                                displayProduct.descriptionHtml ||
                                                ""
                                            }
                                            className="h-full"
                                        />
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New Description
                                    {newDescription && (
                                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                                            <SparklesIcon className="h-3 w-3" />
                                            AI Enhanced
                                        </span>
                                    )}
                                </label>
                                <TipTapEditor
                                    value={newDescription}
                                    onChange={setNewDescription}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                        <button
                            onClick={handleCancel}
                            className="px-8 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
