const aiService = require('../services/aiService');

exports.getAIFix = async (req, res) => {
    const { message, currentFile, issues, contextFiles } = req.body;

    try {
        let prompt = `You are an expert AI autonomous developer tuned for "Vibe Coding" inside an advanced IDE.
You have full context of the user's workspace based on the opened files provided below.
Your goal is to infer the broader architectural "vibe", seamlessly implement features across multiple files, and aggressively deliver production-ready code. DO NOT be lazy. DO NOT use placeholders like "rest of code goes here". Write complete implementations.

`;
        
        if (issues && issues.length > 0) {
            prompt += '### DETECTED WORKSPACE ISSUES\n\n';
            issues.forEach((issue, i) => {
                prompt += `${i + 1}. [${issue.severity.toUpperCase()}] ${issue.file}:${issue.line} — ${issue.message}\n`;
            });
            prompt += '\n';
        }

        prompt += '### OPEN PROJECT FILES (CONTEXT)\n\n';
        
        if (contextFiles && contextFiles.length > 0) {
            contextFiles.forEach(cf => {
                const isCurrent = currentFile && cf.path === currentFile.path;
                prompt += `--- FILE: ${cf.path} ${isCurrent ? '(CURRENTLY FOCUSED)' : ''} ---\n`;
                prompt += `\`\`\`${cf.language}\n${cf.content}\n\`\`\`\n\n`;
            });
        } else if (currentFile) {
            prompt += `--- FILE: ${currentFile.path} (CURRENTLY FOCUSED) ---\n`;
            prompt += `\`\`\`${currentFile.language}\n${currentFile.content}\n\`\`\`\n\n`;
        }

        prompt += `### USER REQUEST:\n${message}\n\n`;
        
        prompt += `### EXECUTION INSTRUCTIONS:
1. Briefly explain your implementation plan, acknowledging the cross-file impact if any.
2. Provide ALL necessary code edits to fulfill the user's request across ANY of the contextual files.
3. You MUST provide your proposed file changes in a STRICT JSON block formatted exactly like this:
\`\`\`json
{
  "edits": [
    {
      "path": "relative/path/or/absolute/path.js",
      "action": "modify", // "modify", "create", or "delete"
      "content": "entire new content of the file"
    }
  ]
}
\`\`\`
CRITICAL: The "content" property MUST contain the FULL, COMPLETE contents of the file. No truncation. No placeholders.

Format your response as:
**Explanation:**
[Your explanation]

**Changes:**
[JSON block]
`;

        const aiResponse = await aiService.query(prompt);

        // Parse AI response robustly
        let explanation = '';
        let edits = [];
        let rawContent = typeof aiResponse === 'object' ? aiResponse.explanation || JSON.stringify(aiResponse) : aiResponse;

        // Try extracting JSON block
        const jsonMatch = rawContent.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[1]);
                edits = parsed.edits || [];
            } catch (e) {
                console.error("Failed to parse JSON edits block", e);
            }
        }
        
        // Cleanup the raw content to use as explanation summary by removing the json block completely
        explanation = rawContent.replace(/```json\s*(\{[\s\S]*?\})\s*```/, '').trim();

        res.json({
            success: true,
            explanation,
            edits,
            filePath: currentFile?.path || null,
            response: explanation
        });
    } catch (err) {
        console.error('AI fix error:', err);
        res.status(500).json({
            error: err.message,
            explanation: 'Failed to get AI response. Please check your API key configuration.',
            edits: []
        });
    }
};
