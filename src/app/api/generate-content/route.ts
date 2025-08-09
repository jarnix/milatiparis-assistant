import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import * as dotenvx from "@dotenvx/dotenvx";

const openai = new OpenAI({
    apiKey: dotenvx.get("OPENAI_API_KEY"),
});

export async function POST(request: NextRequest) {
    try {
        const { title, description, imageUrl } = await request.json();

        if (!title && !description) {
            return NextResponse.json(
                { error: "Title or description is required" },
                { status: 400 }
            );
        }

        const messages = [
            {
                role: "system" as const,
                content: `You are an expert e-commerce copywriter specializing in SEO-optimized product titles and descriptions. 
                Your task is to improve product titles and descriptions to be:
                - SEO-friendly with relevant keywords
                - Marketing-oriented to increase conversions
                - Clear and compelling for customers
                - Professional and brand-appropriate
                
                IMPORTANT: You must respond with valid JSON only. No additional text, explanations, or markdown formatting.
                Format: {"title": "your title here", "description": "your description here"}
                Keep titles under 60 characters and descriptions under 160 characters for SEO.`,
            },
            {
                role: "user" as const,
                content: [
                    {
                        type: "text",
                        text: `Please improve this product:
                        Current Title: ${title || "No title provided"}
                        Current Description: ${
                            description || "No description provided"
                        }
                        
                        Analyze the product image and create an improved, SEO-optimized title and description.`,
                    },
                    ...(imageUrl
                        ? [
                              {
                                  type: "image_url" as const,
                                  image_url: {
                                      url: imageUrl,
                                      detail: "low" as const,
                                  },
                              },
                          ]
                        : []),
                ],
            },
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            max_tokens: 500,
            temperature: 0.7,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No content generated");
        }

        console.log("Raw OpenAI response:", content);

        // Try to extract JSON from the response
        let result;
        try {
            // First try direct parsing
            result = JSON.parse(content);
        } catch {
            // If that fails, try to extract JSON from markdown code blocks
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                try {
                    result = JSON.parse(jsonMatch[1]);
                } catch {
                    // Still failed, try without markdown
                    const cleanContent = content
                        .replace(/```json|```/g, "")
                        .trim();
                    try {
                        result = JSON.parse(cleanContent);
                    } catch {
                        // Last resort: extract title and description manually
                        result = extractContentManually(
                            content,
                            title,
                            description
                        );
                    }
                }
            } else {
                // No JSON blocks found, extract manually
                result = extractContentManually(content, title, description);
            }
        }

        // Ensure we have valid title and description
        if (!result.title) result.title = title;
        if (!result.description) result.description = description;

        // Trim to SEO limits
        if (result.title && result.title.length > 60) {
            result.title = result.title.substring(0, 57) + "...";
        }
        if (result.description && result.description.length > 160) {
            result.description = result.description.substring(0, 157) + "...";
        }

        console.log("Parsed result:", result);
        return NextResponse.json(result);
    } catch (error) {
        console.error("OpenAI API error:", error);
        return NextResponse.json(
            { error: "Failed to generate content" },
            { status: 500 }
        );
    }
}

function extractContentManually(
    content: string,
    originalTitle: string,
    originalDescription: string
) {
    // Try to extract title and description using regex patterns
    const titleMatch = content.match(
        /(?:title|titre)["']?\s*:\s*["']([^"'\n]+)["']?/i
    );
    const descMatch = content.match(
        /(?:description)["']?\s*:\s*["']([^"'\n]+)["']?/i
    );

    // Alternative patterns
    const altTitleMatch = content.match(/^([^\n:]+)(?:\s*-|\s*:|\n)/);

    return {
        title:
            titleMatch?.[1]?.trim() ||
            altTitleMatch?.[1]?.trim() ||
            originalTitle,
        description:
            descMatch?.[1]?.trim() ||
            content.split("\n")[0]?.trim() ||
            originalDescription,
    };
}
