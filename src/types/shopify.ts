export interface ShopifyProduct {
  id: string
  title: string
  handle: string
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT'
  createdAt: string
  updatedAt: string
  description: string
  descriptionHtml: string
  featuredImage?: {
    url: string
    altText?: string
  }
  images: {
    edges: Array<{
      node: {
        id: string
        url: string
        altText?: string
      }
    }>
  }
  metafields: {
    edges: Array<{
      node: {
        namespace: string
        key: string
        value: string
        type: string
      }
    }>
  }
}

export interface ProductOptimization {
  id: number
  shopify_product_id: string
  original_title: string
  optimized_title?: string
  original_description: string
  optimized_description?: string
  status: 'pending' | 'completed' | 'error'
  created_at: string
  completed_at?: string
  error_message?: string
}