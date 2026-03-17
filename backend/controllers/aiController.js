const aiService = require('../services/aiService');

exports.getAIFix = async (req, res) => {
    const { message, currentFile, issues } = req.body;

    try {
        // Build context for the AI
        let prompt = '';

        if (issues && issues.length > 0) {
            prompt += 'The following issues were detected in the codebase:\n\n';
            issues.forEach((issue, i) => {
                prompt += `${i + 1}. [${issue.severity.toUpperCase()}] ${issue.file}:${issue.line} — ${issue.message}\n`;
            });
            prompt += '\n';
        }

        if (currentFile) {
            prompt += `Current file: ${currentFile.name} (${currentFile.language})\n`;
            prompt += `File path: ${currentFile.path}\n\n`;
            prompt += '```' + currentFile.language + '\n';
            prompt += currentFile.content + '\n';
            prompt += '```\n\n';
        }

        prompt += `User request: ${message}\n\n`;
        prompt += 'Please analyze the code and provide:\n';
        prompt += '1. A clear explanation of the issue(s)\n';
        prompt += '2. The complete fixed code\n\n';
        prompt += 'Format your response as:\n';
        prompt += 'EXPLANATION:\n[your explanation]\n\n';
        prompt += 'FIXED_CODE:\n[the complete fixed code]\n';

        const aiResponse = await aiService.query(prompt);

        // Parse AI response
        let explanation = aiResponse;
        let fixedCode = null;

        const explanationMatch = aiResponse.match(/EXPLANATION:\s*([\s\S]*?)(?=FIXED_CODE:|$)/i);
        const codeMatch = aiResponse.match(/FIXED_CODE:\s*(?:```\w*\n?)?([\s\S]*?)(?:```|$)/i);

        if (explanationMatch) {
            explanation = explanationMatch[1].trim();
        }
        if (codeMatch) {
            fixedCode = codeMatch[1].trim();
        }

        res.json({
            success: true,
            explanation,
            fixedCode,
            filePath: currentFile?.path || null,
            response: explanation
        });
    } catch (err) {
        console.error('AI fix error:', err);
        res.status(500).json({
            error: err.message,
            explanation: 'Failed to get AI response. Please check your API key configuration.',
            fixedCode: null
        });
    }
};
