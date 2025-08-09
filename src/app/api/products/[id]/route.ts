import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { updateProduct, updateProductMetafield } from "@/lib/shopify";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { title, description, productId } = await request.json();
        const resolvedParams = await params;

        // Use the full GID from request body, or construct it from the numeric ID in the URL
        const fullProductId =
            productId || `gid://shopify/Product/${resolvedParams.id}`;

        if (!title && !description) {
            return NextResponse.json(
                { error: "At least title or description is required" },
                { status: 400 }
            );
        }

        // Update the product in Shopify
        const updatedProduct = await updateProduct(
            fullProductId,
            title || undefined,
            description || undefined
        );

        // Update the optimization metafield to mark when this product was optimized
        await updateProductMetafield(
            fullProductId,
            "custom",
            "date_optimized",
            new Date().toISOString()
        );

        return NextResponse.json({
            success: true,
            product: updatedProduct,
        });
    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json(
            { error: "Failed to update product" },
            { status: 500 }
        );
    }
}
