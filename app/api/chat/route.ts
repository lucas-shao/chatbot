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

        const completion = await client.chat.completions.create({
            model: "deepseek-chat",
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000
        });

        return new Response(JSON.stringify(completion.choices[0].message), {
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (err) {
        console.error('DeepSeek API Error:', err);

        return new Response(
            JSON.stringify({
                error: 'Failed to fetch from DeepSeek API',
                details: err instanceof Error ? err.message : 'Unknown error'
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
} 