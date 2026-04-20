const aiService = require('../services/aiService');

exports.getAIFix = async (req, res) => {
    const { message, currentFile, issues, contextFiles } = req.body;

    try {
        let prompt = `You are an expert AI software developer and code reviewer inside an advanced IDE.\n`;
        
        if (issues && issues.length > 0) {
            prompt += 'The following issues were detected in the codebase:\n\n';
            issues.forEach((issue, i) => {
                prompt += `${i + 1}. [${issue.severity.toUpperCase()}] ${issue.file}:${issue.line} — ${issue.message}\n`;
            });
            prompt += '\n';
        }

        if (currentFile) {
            prompt += `Current focused file: ${currentFile.name} (${currentFile.language})\n`;
            prompt += `File path: ${currentFile.path}\n\n`;
            prompt += '```' + currentFile.language + '\n';
            prompt += currentFile.content + '\n';
            prompt += '```\n\n';
        }

        if (contextFiles && contextFiles.length > 0) {
            prompt += `Other open files for context:\n`;
            contextFiles.forEach(cf => {
                if (cf.path !== currentFile?.path) {
                    prompt += `--- ${cf.path} ---\n\`\`\`${cf.language}\n${cf.content}\n\`\`\`\n\n`;
                }
            });
        }

        prompt += `User Request: ${message}\n\n`;
        
        prompt += `INSTRUCTIONS:
1. Provide a clear, concise explanation of your findings or plan.
2. If the user request requires modifying files, creating files, or deleting files, you MUST provide the proposed file changes in a JSON block formatting exactly like this:
\`\`\`json
{
  "edits": [
    {
      "path": "relative/path/or/absolute/path.js",
      "action": "modify", // "modify", "create", or "delete"
      "content": "entire new content of the file" // Required for modify/create
    }
  ]
}
\`\`\`
Return the FULL implementation for files in "content" property. Do not use placeholders or omit code.

Format your response as:
**Explanation:**
[Your explanation]

**Changes:**
[Optional JSON block if applicable]
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
