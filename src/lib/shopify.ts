import * as dotenvx from "@dotenvx/dotenvx";
import type { ShopifyProduct } from "@/types/shopify";

const SHOPIFY_API_URL = dotenvx.get("SHOPIFY_API_URL");
const SHOPIFY_ADMIN_API_KEY = dotenvx.get("SHOPIFY_ADMIN_API_KEY");

async function makeGraphQLRequest(
    query: string,
    variables: Record<string, any> = {}
) {
    const response = await fetch(SHOPIFY_API_URL!, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_KEY!,
        },
        body: JSON.stringify({
            query,
            variables,
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

export async function getProducts(
    first: number = 50
): Promise<ShopifyProduct[]> {
    const query = `
    query getProducts($first: Int!) {
      products(first: $first, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            title
            handle
            status
            createdAt
            updatedAt
            description
            descriptionHtml
            featuredImage {
              url
              altText
            }
            images(first: 5) {
              edges {
                node {
                  id
                  url
                  altText
                }
              }
            }
            metafields(first: 10) {
              edges {
                node {
                  namespace
                  key
                  value
                  type
                }
              }
            }
          }
        }
      }
    }
  `;

    try {
        const result = await makeGraphQLRequest(query, { first });
        return result.data.products.edges.map((edge: any) => edge.node);
    } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
    }
}

export async function updateProduct(
    productId: string,
    title?: string,
    description?: string
) {
    const mutation = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          title
          description
          updatedAt
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

    const input: any = {
        id: productId,
    };

    if (title) {
        input.title = title;
    }

    if (description) {
        input.descriptionHtml = description;
    }

    const variables = {
        input,
    };

    try {
        const result = await makeGraphQLRequest(mutation, variables);
        if (result.data.productUpdate.userErrors.length > 0) {
            throw new Error(result.data.productUpdate.userErrors[0].message);
        }
        return result.data.productUpdate.product;
    } catch (error) {
        console.error("Error updating product:", error);
        throw error;
    }
}

export async function updateProductMetafield(
    productId: string,
    namespace: string,
    key: string,
    value: string,
    type: string = "single_line_text_field"
) {
    const mutation = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          metafields(first: 10) {
            edges {
              node {
                namespace
                key
                value
                type
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

    const variables = {
        input: {
            id: productId,
            metafields: [
                {
                    namespace,
                    key,
                    value,
                    type,
                },
            ],
        },
    };

    try {
        const result = await makeGraphQLRequest(mutation, variables);
        if (result.data.productUpdate.userErrors.length > 0) {
            throw new Error(result.data.productUpdate.userErrors[0].message);
        }
        return result.data.productUpdate.product;
    } catch (error) {
        console.error("Error updating metafield:", error);
        throw error;
    }
}
