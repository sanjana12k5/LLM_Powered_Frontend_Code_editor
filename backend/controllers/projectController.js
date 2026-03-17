const aiService = require('../services/aiService');
const fs = require('fs');
const path = require('path');

exports.generateProject = async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'prompt is required' });
    }

    try {
        const systemPrompt = `You are an expert frontend developer. Generate a complete project based on the user's description.

Return your response in the following JSON format ONLY (no markdown, no explanation, just valid JSON):
{
  "projectName": "project-name",
  "files": [
    {
      "path": "relative/path/to/file.ext",
      "content": "file content here"
    }
  ]
}

Rules:
- Generate clean, production-ready code
- Include all necessary files (HTML, CSS, JS/JSX)
- Use modern best practices
- Include a basic README.md
- File paths should be relative to the project root
- Make sure the project is fully functional

User request: ${prompt}`;

        const aiResponse = await aiService.query(systemPrompt);

        // Parse JSON response
        let parsed;
        try {
            // Try to extract JSON from the response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseErr) {
            // Fallback: create a basic project
            parsed = {
                projectName: 'ai-generated-project',
                files: [
                    {
                        path: 'index.html',
                        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Project</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>AI Generated Project</h1>
    <p>The AI generated some content but it needs manual review.</p>
    <pre>${aiResponse.substring(0, 500)}</pre>
    <script src="script.js"></script>
</body>
</html>`
                    },
                    {
                        path: 'styles.css',
                        content: 'body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }'
                    },
                    {
                        path: 'script.js',
                        content: 'console.log("AI Generated Project loaded");'
                    },
                    {
                        path: 'README.md',
                        content: `# AI Generated Project\n\nGenerated from prompt: ${prompt}\n`
                    }
                ]
            };
        }

        res.json({
            success: true,
            projectName: parsed.projectName || 'ai-generated-project',
            files: parsed.files || []
        });
    } catch (err) {
        console.error('Project generation error:', err);
        res.status(500).json({ error: err.message });
    }
};
