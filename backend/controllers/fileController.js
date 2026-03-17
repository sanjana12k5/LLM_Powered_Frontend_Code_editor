const fs = require('fs');
const path = require('path');

// Recursive file reader
function readDirRecursive(dirPath, basePath = dirPath) {
    const items = [];
    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
            const fullPath = path.join(dirPath, entry.name);
            const relativePath = path.relative(basePath, fullPath);
            if (entry.isDirectory()) {
                items.push({
                    name: entry.name,
                    path: fullPath,
                    relativePath,
                    type: 'directory',
                    children: readDirRecursive(fullPath, basePath)
                });
            } else {
                const ext = path.extname(entry.name).toLowerCase();
                const supportedExts = ['.html', '.css', '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt', '.env', '.yml', '.yaml'];
                if (supportedExts.includes(ext)) {
                    items.push({
                        name: entry.name,
                        path: fullPath,
                        relativePath,
                        type: 'file',
                        extension: ext
                    });
                }
            }
        }
    } catch (err) {
        console.error('Error reading directory:', err.message);
    }
    return items;
}

exports.readFiles = (req, res) => {
    const { projectPath } = req.body;
    if (!projectPath) {
        return res.status(400).json({ error: 'projectPath is required' });
    }

    try {
        if (!fs.existsSync(projectPath)) {
            return res.status(404).json({ error: 'Directory not found' });
        }
        const tree = readDirRecursive(projectPath);
        res.json({ success: true, tree, projectPath });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.saveFiles = (req, res) => {
    const { files } = req.body;
    if (!files || !Array.isArray(files)) {
        return res.status(400).json({ error: 'files array is required' });
    }

    const results = [];
    for (const file of files) {
        try {
            const dir = path.dirname(file.path);
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(file.path, file.content, 'utf-8');
            results.push({ path: file.path, success: true });
        } catch (err) {
            results.push({ path: file.path, success: false, error: err.message });
        }
    }

    res.json({ success: true, results });
};

exports.uploadProject = (req, res) => {
    const { projectPath } = req.body;
    if (!projectPath) {
        return res.status(400).json({ error: 'projectPath is required' });
    }

    try {
        const tree = readDirRecursive(projectPath);
        res.json({ success: true, tree, projectName: path.basename(projectPath) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
