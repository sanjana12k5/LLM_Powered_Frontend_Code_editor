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
    if (!apiKey || apiKey === 'your-gemini-api-key-here' || apiKey === 'YOUR_KEY_HERE') {
        throw new Error('Gemini API key not configured. Set GEMINI_API_KEY in .env file.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    // Ensure request body format
    const body = {
        contents: [
            {
                parts: [
                    { text: prompt }
                ]
            }
        ]
    };

    try {
        const fetchResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!fetchResponse.ok) {
            const errorData = await fetchResponse.json().catch(() => ({}));
            const error = new Error(`Gemini API Error ${fetchResponse.status}`);
            error.response = { data: errorData }; // Simulate axios shape
            throw error;
        }

        const data = await fetchResponse.json();
        const response = { data }; // Simulate axios shape

        // Extract AI response safely
        let text = '';
        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            text = response.data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid response format');
        }

        return text;
    } catch (error) {
        // Log full error response
        console.error('[Gemini API] Request Error:', error.response?.data || error.message);
        throw error;
    }
}

// -------- Main Query Function --------
async function query(prompt) {
    const provider = process.env.AI_PROVIDER || 'openai';
    console.log(`[AI Service] Using provider: ${provider}`);

    try {
        if (provider === 'gemini') {
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

// -------- Optional Test Function --------
if (require.main === module) {
    // Run this file directly to test the Gemini API integration
    require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

    (async () => {
        try {
            console.log("Testing Gemini API...");
            const dummyPrompt = "Explain what a variable is in JavaScript and provide a short code example.\n\nEXPLANATION:\n...\n\nFIXED_CODE:\n...";
            const response = await query(dummyPrompt);
            console.log("\n--- AI Response Received ---");
            console.log("Explanation:\n", response.explanation);
            console.log("\nFixed Code:\n", response.fixedCode);
        } catch (err) {
            console.error("Test failed:", err.message);
        }
    })();
}
