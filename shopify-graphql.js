import * as dotenvx from "@dotenvx/dotenvx";

const SHOPIFY_SHOP_DOMAIN = dotenvx.get("SHOPIFY_SHOP_DOMAIN");
const SHOPIFY_ADMIN_API_KEY = dotenvx.get("SHOPIFY_ADMIN_API_KEY");
const SHOPIFY_API_URL = dotenvx.get("SHOPIFY_API_URL");

async function makeGraphQLRequest(query, variables = {}) {
    const response = await fetch(SHOPIFY_API_URL, {w
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_KEY,
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

// Test query to get shop information
async function getShopInfo() {
    const query = `
    query {
      shop {
        name
        email
        primaryDomain {
          host
        }
        currencyCode
        plan {
          displayName
        }
      }
    }
  `;

    try {
        const result = await makeGraphQLRequest(query);
        console.log("Shop Info:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
    }
}

// Test query to get products
async function getProducts(first = 5) {
    const query = `
    query getProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            status
            createdAt
            updatedAt
          }
        }
      }
    }
  `;

    try {
        const result = await makeGraphQLRequest(query, { first });
        console.log("Products:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
    }
}

// Add metafield to a product
async function addProductMetafield(
    productId,
    namespace,
    key,
    value,
    type = "single_line_text_field"
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
                    namespace: namespace,
                    key: key,
                    value: value,
                    type: type,
                },
            ],
        },
    };

    try {
        const result = await makeGraphQLRequest(mutation, variables);
        console.log("Metafield added:", JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error("Error adding metafield:", error.message);
    }
}

// Get products with metafields
async function getProductsWithMetafields(first = 5) {
    const query = `
    query getProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            status
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
        console.log(
            "Products with metafields:",
            JSON.stringify(result, null, 2)
        );
        return result;
    } catch (error) {
        console.error("Error:", error.message);
    }
}

// Run tests
async function main() {
    console.log("Testing Shopify GraphQL API connection...\n");

    await getShopInfo();
    console.log("\n---\n");

    // Get products with metafields
    const products = await getProductsWithMetafields();

    // Example: Add custom fields to the first product
    if (products?.data?.products?.edges?.length > 0) {
        const productId = products.data.products.edges[0].node.id;
        console.log("\n--- Adding date_optimized field to product ---\n");

        await addProductMetafield(
            productId,
            "custom",
            "date_optimized",
            "2025-08-08",
            "date"
        );
    }
}

main();
