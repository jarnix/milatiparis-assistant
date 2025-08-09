import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/shopify";

export async function GET(request: NextRequest) {
    try {
        // Auth is handled by middleware
        const products = await getProducts();
        return NextResponse.json({ products });
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}
