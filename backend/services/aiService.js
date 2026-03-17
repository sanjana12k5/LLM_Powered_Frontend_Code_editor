/**
 * AI Service
 * Supports both OpenAI and Google Gemini APIs
 * Configured via environment variables
 */

const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';

// -------- OpenAI --------
async function queryOpenAI(prompt) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your-openai-api-key-here') {
        throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY in .env file.');
    }

    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: 'You are an expert frontend developer and code reviewer. Provide clear, actionable code fixes and explanations. When providing fixed code, provide the COMPLETE file content, not just snippets.'
            },
            { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
    });

    return completion.choices[0].message.content;
}

// -------- Gemini --------
async function queryGemini(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
        throw new Error('Gemini API key not configured. Set GEMINI_API_KEY in .env file.');
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

// -------- Main Query Function --------
async function query(prompt) {
    console.log(`[AI Service] Using provider: ${AI_PROVIDER}`);

    try {
        if (AI_PROVIDER === 'gemini') {
            return await queryGemini(prompt);
        } else {
            return await queryOpenAI(prompt);
        }
    } catch (err) {
        console.error('[AI Service] Error:', err.message);
        throw err;
    }
}

module.exports = { query };
