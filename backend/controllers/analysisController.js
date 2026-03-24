const analyzerService = require('../services/analyzer');

exports.runAnalysis = async (req, res) => {
    const { projectPath } = req.body;
    if (!projectPath) {
        return res.status(400).json({ error: 'projectPath is required' });
    }

    try {
        const issues = await analyzerService.analyzeProject(projectPath);
        res.json({ success: true, issues });
    } catch (err) {
        console.error('Analysis error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getIssues = async (req, res) => {
    const { projectPath } = req.body;
    if (!projectPath) {
        return res.status(400).json({ error: 'projectPath is required' });
    }

    try {
        const issues = await analyzerService.analyzeProject(projectPath);
        res.json({ success: true, issues });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
