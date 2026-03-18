const STORES = {
  us: {
    name: 'Moom Health US',
    domain: process.env.SHOPIFY_US_DOMAIN,
    token: process.env.SHOPIFY_US_TOKEN,
    currency: 'USD',
  },
  my: {
    name: 'Moom Health Malaysia',
    domain: process.env.SHOPIFY_MY_DOMAIN,
    token: process.env.SHOPIFY_MY_TOKEN,
    currency: 'MYR',
  },
  hk: {
    name: 'Moom Health Hong Kong',
    domain: process.env.SHOPIFY_HK_DOMAIN,
    token: process.env.SHOPIFY_HK_TOKEN,
    currency: 'HKD',
  },
};

async function shopifyFetch(storeKey, endpoint, params = {}) {
  const store = STORES[storeKey];
  if (!store) throw new Error(`Unknown store: ${storeKey}`);
  if (!store.domain || !store.token) {
    throw new Error(`Missing credentials for store: ${storeKey}`);
  }

  const url = new URL(`https://${store.domain}/admin/api/2024-01/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  });

  const res = await fetch(url.toString(), {
    headers: {
      'X-Shopify-Access-Token': store.token,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify API error (${storeKey} ${endpoint}): ${res.status} ${text}`);
  }

  return res.json();
}

// Trim order data to avoid huge Claude context
function trimOrder(order) {
  return {
    id: order.id,
    order_number: order.order_number,
    created_at: order.created_at,
    financial_status: order.financial_status,
    fulfillment_status: order.fulfillment_status,
    total_price: order.total_price,
    currency: order.currency,
    line_items_count: order.line_items?.length,
    top_items: order.line_items?.slice(0, 3).map((i) => ({
      title: i.title,
      quantity: i.quantity,
      price: i.price,
    })),
    customer_email: order.email,
  };
}

function trimProduct(p) {
  return {
    id: p.id,
    title: p.title,
    status: p.status,
    product_type: p.product_type,
    created_at: p.created_at,
    variants_count: p.variants?.length,
    total_inventory: p.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0),
    price_range: p.variants?.length
      ? `${Math.min(...p.variants.map((v) => parseFloat(v.price)))} - ${Math.max(...p.variants.map((v) => parseFloat(v.price)))}`
      : null,
  };
}

function trimCustomer(c) {
  return {
    id: c.id,
    email: c.email,
    first_name: c.first_name,
    last_name: c.last_name,
    created_at: c.created_at,
    orders_count: c.orders_count,
    total_spent: c.total_spent,
    tags: c.tags,
  };
}

export async function getOrders(storeKey, { limit = 20, status = 'any', created_at_min, created_at_max } = {}) {
  const data = await shopifyFetch(storeKey, 'orders.json', {
    limit,
    status,
    created_at_min,
    created_at_max,
  });
  const store = STORES[storeKey];
  const orders = data.orders.map(trimOrder);
  const totalRevenue = data.orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
  return {
    store: store.name,
    currency: store.currency,
    orders_returned: orders.length,
    total_revenue: totalRevenue.toFixed(2),
    orders,
  };
}

export async function getOrdersCount(storeKey, { status = 'any', created_at_min, created_at_max } = {}) {
  const data = await shopifyFetch(storeKey, 'orders/count.json', {
    status,
    created_at_min,
    created_at_max,
  });
  return { store: STORES[storeKey].name, count: data.count };
}

export async function getProducts(storeKey, { limit = 20, title, status = 'active' } = {}) {
  const data = await shopifyFetch(storeKey, 'products.json', { limit, title, status });
  return {
    store: STORES[storeKey].name,
    products_returned: data.products.length,
    products: data.products.map(trimProduct),
  };
}

export async function getCustomers(storeKey, { limit = 20, query, created_at_min } = {}) {
  const data = await shopifyFetch(storeKey, 'customers.json', { limit, query, created_at_min });
  return {
    store: STORES[storeKey].name,
    customers_returned: data.customers.length,
    customers: data.customers.map(trimCustomer),
  };
}

export { STORES };
