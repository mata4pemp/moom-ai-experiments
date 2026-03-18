import Anthropic from '@anthropic-ai/sdk';
import { tools } from '@/lib/tools';
import { getOrders, getOrdersCount, getProducts, getCustomers } from '@/lib/shopify';
import { supabase } from '@/lib/supabase';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a helpful business assistant for Moom Health, a women's supplements brand with three Shopify stores:
- US store (moomhealth.myshopify.com) — store key: "us", currency: USD
- Malaysia store (moomhealth-my.myshopify.com) — store key: "my", currency: MYR
- Hong Kong store (moomhealth-hk.myshopify.com) — store key: "hk", currency: HKD

You help the team understand their business: orders, revenue, products, inventory, and customers.

Guidelines:
- When asked about "all stores" or no specific store is mentioned, query all three.
- Always show currency symbols and format numbers clearly (e.g. USD 1,234.50).
- Be concise but complete. Use bullet points or tables for multi-store comparisons.
- Today's date is ${new Date().toISOString().split('T')[0]}.
- If you need date ranges, calculate them relative to today.
- When comparing stores, highlight which is performing best.`;

async function executeTool(toolName, toolInput) {
  const storeKeys = toolInput.store === 'all' ? ['us', 'my', 'hk'] : [toolInput.store];

  const results = await Promise.all(
    storeKeys.map((storeKey) => {
      const params = { ...toolInput, store: storeKey };
      switch (toolName) {
        case 'get_orders':
          return getOrders(storeKey, params);
        case 'get_orders_count':
          return getOrdersCount(storeKey, params);
        case 'get_products':
          return getProducts(storeKey, params);
        case 'get_customers':
          return getCustomers(storeKey, params);
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    })
  );

  return storeKeys.length === 1 ? results[0] : results;
}

export async function POST(request) {
  try {
    const { message, conversationId } = await request.json();

    if (!message?.trim()) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Create new conversation or use existing
    let convId = conversationId;
    if (!convId) {
      const { data, error } = await supabase
        .from('conversations')
        .insert({ title: message.slice(0, 60) })
        .select()
        .single();
      if (error) throw error;
      convId = data.id;
    }

    // Save user message
    await supabase.from('messages').insert({
      conversation_id: convId,
      role: 'user',
      content: message,
    });

    // Load conversation history for context
    const { data: history, error: historyError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (historyError) throw historyError;

    // Build messages array for Claude (all previous messages in this conversation)
    let currentMessages = history.map((m) => ({ role: m.role, content: m.content }));

    // Agentic loop: let Claude call tools until it's done
    let finalResponse;
    let iterations = 0;
    const MAX_ITERATIONS = 10; // safety limit

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools,
        messages: currentMessages,
      });

      if (response.stop_reason === 'end_turn') {
        finalResponse = response;
        break;
      }

      if (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');

        // Execute all tool calls in parallel
        const toolResults = await Promise.all(
          toolUseBlocks.map(async (toolUse) => {
            try {
              const result = await executeTool(toolUse.name, toolUse.input);
              return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify(result),
              };
            } catch (err) {
              return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: `Error: ${err.message}`,
                is_error: true,
              };
            }
          })
        );

        // Add assistant response + tool results back into the conversation
        currentMessages = [
          ...currentMessages,
          { role: 'assistant', content: response.content },
          { role: 'user', content: toolResults },
        ];
      } else {
        // Unexpected stop reason
        finalResponse = response;
        break;
      }
    }

    // Extract the final text reply
    const replyText = finalResponse.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    // Save assistant reply to database
    await supabase.from('messages').insert({
      conversation_id: convId,
      role: 'assistant',
      content: replyText,
    });

    return Response.json({ reply: replyText, conversationId: convId });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
