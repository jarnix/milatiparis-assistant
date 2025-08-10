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
                - Professional and brand-appropriate (the brand is called "MilatiParis")
                - In French only
                
                IMPORTANT: You must respond with valid JSON only. No additional text, explanations, or markdown formatting.
                Format: {"title": "your title here", "description": "your description here"}
                Keep titles under 60 characters for SEO.
                For the title, don't use capitalized words like in English, format the title properly in French.
                IMPORTANT: For the description, reformat properly the dimensions in a html table if the description contains sizes.
                For the description, use the image url to generate a description of the product, be creative and use the image to generate a description of the product.
                For the description, indicate that the product is handmade/realized/made (not only designed) in Paris, France.

                CRITICAL: The description must be in HTML format (not markdown):
                - Use <p> tags for paragraphs
                - Use <br> tags for line breaks within paragraphs
                - Use <strong> or <b> for bold text
                - Use <em> or <i> for italic text
                - Use <ul> and <li> for bullet lists
                - When using a bullet list, don't use a <p> inside the <li>
                - Use <table>, <th>, <tr>, <td> for tabular information (sizes, dimensions)
                - Use emojis to make the description more engaging
                - Put the headers in bold, put only one header per paragraph
                
                Example format: {"title": "Titre Optimisé", "description": "<p>🐕 Description avec <strong>texte important</strong> et <br>retour à la ligne.</p><p>Deuxième paragraphe avec émojis.</p>"}`,
            },
            {
                role: "user" as const,
                content: [
                    {
                        type: "text" as const,
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
            max_tokens: 1500,
            temperature: 0.7,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No content generated");
        }

        // Calculate cost based on gpt-4o-mini pricing (as of 2024)
        // Input: $0.15 per 1M tokens, Output: $0.60 per 1M tokens
        const inputTokens = completion.usage?.prompt_tokens || 0;
        const outputTokens = completion.usage?.completion_tokens || 0;

        const inputCostPerToken = 0.15 / 1000000; // $0.15 per 1M tokens
        const outputCostPerToken = 0.6 / 1000000; // $0.60 per 1M tokens

        const inputCostUSD = inputTokens * inputCostPerToken;
        const outputCostUSD = outputTokens * outputCostPerToken;
        const totalCostUSD = inputCostUSD + outputCostUSD;

        // Convert to EUR (approximate rate: 1 USD = 0.92 EUR)
        const totalCostEUR = totalCostUSD * 0.92;

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
            result.title = result.title.substring(0, 60);
        }

        console.log("Parsed result:", result);

        // Add cost information to the response
        const responseWithCost = {
            ...result,
            cost: {
                inputTokens,
                outputTokens,
                totalTokens: inputTokens + outputTokens,
                costEUR: Number(totalCostEUR.toFixed(6)),
                costUSD: Number(totalCostUSD.toFixed(6)),
            },
        };

        return NextResponse.json(responseWithCost);
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
