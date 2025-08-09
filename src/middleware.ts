import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
    // Only protect API routes that are NOT auth routes
    const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
    const isAuthRoute = request.nextUrl.pathname.startsWith("/api/auth");

    if (!isApiRoute || isAuthRoute) {
        return NextResponse.next();
    }

    try {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        return NextResponse.next();
    } catch (error) {
        console.error("Authentication error:", error);
        return NextResponse.json(
            { error: "Authentication failed" },
            { status: 500 }
        );
    }
}

export const config = {
    matcher: ["/api/:path*"],
};
