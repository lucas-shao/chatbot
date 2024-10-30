import OpenAI from 'openai';

if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('Missing DEEPSEEK_API_KEY environment variable');
}

const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com/v1'
});

export async function POST(request: Request) {
    try {
        const { messages } = await request.json();

        const response = await client.chat.completions.create({
            model: "deepseek-chat",
            messages: messages
        });

        return new Response(JSON.stringify(response.choices[0].message));
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch from DeepSeek API' }), { status: 500 });
    }
} 