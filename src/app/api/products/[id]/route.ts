import { NextRequest, NextResponse } from "next/server";
import {
    getProduct,
    updateProduct,
    updateProductMetafield,
} from "@/lib/shopify";

// Function to clean HTML structure for Shopify compatibility
function cleanHtmlForShopify(html: string): string {
    if (!html) return html;
    
    // Remove <p> tags inside <li> elements
    // This regex finds <li>...<p>content</p>...</li> and replaces with <li>...content...</li>
    return html
        .replace(/<li([^>]*)>\s*<p([^>]*)>(.*?)<\/p>\s*<\/li>/g, '<li$1>$3</li>')
        // Also handle multiple paragraphs in list items by joining them with <br>
        .replace(/<li([^>]*)>\s*<p([^>]*)>(.*?)<\/p>(\s*<p[^>]*>.*?<\/p>\s*)*\s*<\/li>/g, (match, liAttrs, firstPAttrs, firstContent) => {
            // Extract all paragraph contents and join with <br>
            const paragraphs = match.match(/<p[^>]*>(.*?)<\/p>/g);
            if (paragraphs) {
                const contents = paragraphs.map(p => p.replace(/<\/?p[^>]*>/g, ''));
                return `<li${liAttrs}>${contents.join('<br>')}</li>`;
            }
            return match;
        })
        // Clean up any remaining nested <p> in <li> that might have been missed
        .replace(/<li([^>]*)>([^<]*)<p([^>]*)>/g, '<li$1>$2')
        .replace(/<\/p>([^<]*)<\/li>/g, '$1</li>');
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Construct the full GID from the numeric ID
        const fullProductId = `gid://shopify/Product/${id}`;

        const product = await getProduct(fullProductId);

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ product });
    } catch (error) {
        console.error("Error fetching product:", error);
        return NextResponse.json(
            { error: "Failed to fetch product" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
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

        // Clean the description HTML for Shopify compatibility
        const cleanedDescription = description ? cleanHtmlForShopify(description) : undefined;

        // Update the product in Shopify
        const updatedProduct = await updateProduct(
            fullProductId,
            title || undefined,
            cleanedDescription
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
