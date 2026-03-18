export const tools = [
  {
    name: 'get_orders',
    description:
      'Get orders from a Moom Health Shopify store. Use this to answer questions about sales, orders, revenue, or fulfillment. Store keys: "us" = moomhealth.myshopify.com, "my" = Malaysia, "hk" = Hong Kong. Use "all" to query all 3 stores.',
    input_schema: {
      type: 'object',
      properties: {
        store: {
          type: 'string',
          enum: ['us', 'my', 'hk', 'all'],
          description: 'Which store to query. Use "all" to query all 3 stores.',
        },
        limit: {
          type: 'number',
          description: 'Max orders to return per store (default 20, max 50)',
        },
        status: {
          type: 'string',
          enum: ['open', 'closed', 'cancelled', 'any'],
          description: 'Order status filter (default: any)',
        },
        created_at_min: {
          type: 'string',
          description: 'Start date ISO format e.g. 2024-01-01T00:00:00Z',
        },
        created_at_max: {
          type: 'string',
          description: 'End date ISO format',
        },
      },
      required: ['store'],
    },
  },
  {
    name: 'get_orders_count',
    description:
      'Get a count of orders from a Moom Health store. Use this for quick counts without needing full order data. Much faster than get_orders when you just need a number.',
    input_schema: {
      type: 'object',
      properties: {
        store: {
          type: 'string',
          enum: ['us', 'my', 'hk', 'all'],
          description: 'Which store to query',
        },
        status: {
          type: 'string',
          enum: ['open', 'closed', 'cancelled', 'any'],
        },
        created_at_min: {
          type: 'string',
          description: 'Start date ISO format',
        },
        created_at_max: {
          type: 'string',
          description: 'End date ISO format',
        },
      },
      required: ['store'],
    },
  },
  {
    name: 'get_products',
    description:
      'Get products from a Moom Health Shopify store. Use this to answer questions about products, inventory levels, pricing, or product catalog.',
    input_schema: {
      type: 'object',
      properties: {
        store: {
          type: 'string',
          enum: ['us', 'my', 'hk', 'all'],
          description: 'Which store to query',
        },
        limit: {
          type: 'number',
          description: 'Max products to return (default 20)',
        },
        title: {
          type: 'string',
          description: 'Search by product title (partial match)',
        },
        status: {
          type: 'string',
          enum: ['active', 'draft', 'archived'],
          description: 'Product status (default: active)',
        },
      },
      required: ['store'],
    },
  },
  {
    name: 'get_customers',
    description:
      'Get customers from a Moom Health Shopify store. Use this to answer questions about customer counts, new customers, customer spending, or to look up specific customers.',
    input_schema: {
      type: 'object',
      properties: {
        store: {
          type: 'string',
          enum: ['us', 'my', 'hk', 'all'],
          description: 'Which store to query',
        },
        limit: {
          type: 'number',
          description: 'Max customers to return (default 20)',
        },
        query: {
          type: 'string',
          description: 'Search by email or name',
        },
        created_at_min: {
          type: 'string',
          description: 'Only customers created after this date (ISO format)',
        },
      },
      required: ['store'],
    },
  },
];
