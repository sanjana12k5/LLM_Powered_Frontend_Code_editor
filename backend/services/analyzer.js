const fs = require('fs');
const path = require('path');
const { ESLint } = require('eslint');

/**
 * Analyzer Service
 * Runs ESLint for JS/JSX and custom static checks for HTML/CSS
 */

// Collect all files of certain types recursively
function collectFiles(dirPath, extensions, basePath = dirPath) {
    let files = [];
    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                files = files.concat(collectFiles(fullPath, extensions, basePath));
            } else {
                const ext = path.extname(entry.name).toLowerCase();
                if (extensions.includes(ext)) {
                    files.push({
                        fullPath,
                        relativePath: path.relative(basePath, fullPath),
                        extension: ext,
                        content: fs.readFileSync(fullPath, 'utf-8')
                    });
                }
            }
        }
    } catch (err) {
        console.error('Error collecting files:', err.message);
    }
    return files;
}

// -------- ESLint Analysis for JS/JSX --------
async function runESLint(files) {
    const issues = [];
    const jsFiles = files.filter(f => ['.js', '.jsx'].includes(f.extension));
    if (jsFiles.length === 0) return issues;

    try {
        const eslint = new ESLint({
            useEslintrc: false,
            overrideConfig: {
                env: { browser: true, es2021: true, node: true },
                parserOptions: {
                    ecmaVersion: 'latest',
                    sourceType: 'module',
                    ecmaFeatures: { jsx: true }
                },
                rules: {
                    'no-unused-vars': 'warn',
                    'no-undef': 'warn',
                    'no-console': 'off',
                    'semi': ['warn', 'always'],
                    'no-empty': 'warn',
                    'no-unreachable': 'error',
                    'no-duplicate-case': 'error',
                    'no-dupe-keys': 'error',
                    'no-extra-semi': 'warn',
                    'eqeqeq': 'warn',
                    'no-var': 'warn',
                    'prefer-const': 'warn',
                }
            }
        });

        for (const file of jsFiles) {
            try {
                const results = await eslint.lintText(file.content, {
                    filePath: file.fullPath
                });
                for (const result of results) {
                    for (const msg of result.messages) {
                        issues.push({
                            file: file.relativePath,
                            fullPath: file.fullPath,
                            line: msg.line || 1,
                            column: msg.column || 1,
                            severity: msg.severity === 2 ? 'error' : 'warning',
                            message: msg.message,
                            ruleId: msg.ruleId || 'unknown',
                            source: 'eslint'
                        });
                    }
                }
            } catch (err) {
                // Skip files that can't be parsed
                issues.push({
                    file: file.relativePath,
                    fullPath: file.fullPath,
                    line: 1,
                    column: 1,
                    severity: 'error',
                    message: `Parse error: ${err.message}`,
                    ruleId: 'parse-error',
                    source: 'eslint'
                });
            }
        }
    } catch (err) {
        console.error('ESLint initialization error:', err.message);
    }

    return issues;
}

// -------- Custom HTML Analysis --------
function analyzeHTML(files) {
    const issues = [];
    const htmlFiles = files.filter(f => f.extension === '.html');

    for (const file of htmlFiles) {
        const content = file.content;
        const lines = content.split('\n');

        // Check for DOCTYPE
        if (!content.match(/<!DOCTYPE\s+html>/i)) {
            issues.push({
                file: file.relativePath,
                fullPath: file.fullPath,
                line: 1,
                column: 1,
                severity: 'warning',
                message: 'Missing <!DOCTYPE html> declaration',
                ruleId: 'missing-doctype',
                source: 'html-analyzer'
            });
        }

        // Check for essential tags
        const requiredTags = ['<html', '<head', '<body', '<title'];
        for (const tag of requiredTags) {
            if (!content.toLowerCase().includes(tag)) {
                issues.push({
                    file: file.relativePath,
                    fullPath: file.fullPath,
                    line: 1,
                    column: 1,
                    severity: 'warning',
                    message: `Missing ${tag}> tag`,
                    ruleId: 'missing-tag',
                    source: 'html-analyzer'
                });
            }
        }

        // Check for meta charset
        if (!content.match(/<meta\s+charset/i)) {
            issues.push({
                file: file.relativePath,
                fullPath: file.fullPath,
                line: 1,
                column: 1,
                severity: 'info',
                message: 'Missing <meta charset="..."> tag',
                ruleId: 'missing-charset',
                source: 'html-analyzer'
            });
        }

        // Check for viewport meta
        if (!content.match(/<meta\s+name=["']viewport["']/i)) {
            issues.push({
                file: file.relativePath,
                fullPath: file.fullPath,
                line: 1,
                column: 1,
                severity: 'info',
                message: 'Missing viewport meta tag for responsive design',
                ruleId: 'missing-viewport',
                source: 'html-analyzer'
            });
        }

        // Check for unclosed tags (basic)
        const selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link'];
        const openTagRegex = /<(\w+)[\s>]/g;
        const closeTagRegex = /<\/(\w+)\s*>/g;
        const openTags = {};
        const closeTags = {};

        let match;
        while ((match = openTagRegex.exec(content)) !== null) {
            const tag = match[1].toLowerCase();
            if (!selfClosing.includes(tag) && tag !== '!doctype') {
                openTags[tag] = (openTags[tag] || 0) + 1;
            }
        }
        while ((match = closeTagRegex.exec(content)) !== null) {
            const tag = match[1].toLowerCase();
            closeTags[tag] = (closeTags[tag] || 0) + 1;
        }

        for (const tag of Object.keys(openTags)) {
            const openCount = openTags[tag] || 0;
            const closeCount = closeTags[tag] || 0;
            if (openCount > closeCount) {
                issues.push({
                    file: file.relativePath,
                    fullPath: file.fullPath,
                    line: 1,
                    column: 1,
                    severity: 'warning',
                    message: `Potentially unclosed <${tag}> tag (${openCount} open, ${closeCount} close)`,
                    ruleId: 'unclosed-tag',
                    source: 'html-analyzer'
                });
            }
        }

        // Check for empty alt attributes on images
        lines.forEach((line, idx) => {
            if (line.match(/<img\s/) && !line.match(/alt\s*=/i)) {
                issues.push({
                    file: file.relativePath,
                    fullPath: file.fullPath,
                    line: idx + 1,
                    column: 1,
                    severity: 'warning',
                    message: 'Image tag missing alt attribute (accessibility)',
                    ruleId: 'missing-alt',
                    source: 'html-analyzer'
                });
            }
        });
    }

    return issues;
}

// -------- Custom CSS Analysis --------
function analyzeCSS(files) {
    const issues = [];
    const cssFiles = files.filter(f => f.extension === '.css');
    const htmlFiles = files.filter(f => f.extension === '.html');
    const jsFiles = files.filter(f => ['.js', '.jsx'].includes(f.extension));

    // Combine all HTML and JS content for class usage check
    const allContent = [...htmlFiles, ...jsFiles].map(f => f.content).join('\n');

    for (const file of cssFiles) {
        const content = file.content;
        const lines = content.split('\n');

        // Extract CSS selectors
        const selectorRegex = /^\s*([.#][\w-]+)\s*\{/gm;
        let match;

        while ((match = selectorRegex.exec(content)) !== null) {
            const selector = match[1];
            const selectorName = selector.substring(1); // Remove . or #

            // Check if selector is used in HTML or JS files
            if (!allContent.includes(selectorName)) {
                const lineNum = content.substring(0, match.index).split('\n').length;
                issues.push({
                    file: file.relativePath,
                    fullPath: file.fullPath,
                    line: lineNum,
                    column: 1,
                    severity: 'info',
                    message: `Potentially unused CSS selector: ${selector}`,
                    ruleId: 'unused-css',
                    source: 'css-analyzer'
                });
            }
        }

        // Check for !important usage
        lines.forEach((line, idx) => {
            if (line.includes('!important')) {
                issues.push({
                    file: file.relativePath,
                    fullPath: file.fullPath,
                    line: idx + 1,
                    column: line.indexOf('!important') + 1,
                    severity: 'info',
                    message: 'Usage of !important — consider refactoring to avoid specificity issues',
                    ruleId: 'important-usage',
                    source: 'css-analyzer'
                });
            }
        });

        // Check for duplicate selectors
        const selectors = [];
        const dupRegex = /^\s*([^@{}\n][^{]*?)\s*\{/gm;
        while ((match = dupRegex.exec(content)) !== null) {
            const sel = match[1].trim();
            if (selectors.includes(sel)) {
                const lineNum = content.substring(0, match.index).split('\n').length;
                issues.push({
                    file: file.relativePath,
                    fullPath: file.fullPath,
                    line: lineNum,
                    column: 1,
                    severity: 'warning',
                    message: `Duplicate CSS selector: ${sel}`,
                    ruleId: 'duplicate-selector',
                    source: 'css-analyzer'
                });
            }
            selectors.push(sel);
        }
    }

    return issues;
}

// -------- Broken Import Detection --------
function checkBrokenImports(files) {
    const issues = [];
    const jsFiles = files.filter(f => ['.js', '.jsx'].includes(f.extension));

    for (const file of jsFiles) {
        const lines = file.content.split('\n');

        lines.forEach((line, idx) => {
            // Match import statements
            const importMatch = line.match(/import\s+.*?from\s+['"](\..*?)['"]/);
            if (importMatch) {
                const importPath = importMatch[1];
                const dir = path.dirname(file.fullPath);

                // Try to resolve the import
                const possibleExtensions = ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx'];
                let found = false;
                for (const ext of possibleExtensions) {
                    const resolved = path.resolve(dir, importPath + ext);
                    if (fs.existsSync(resolved)) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    issues.push({
                        file: file.relativePath,
                        fullPath: file.fullPath,
                        line: idx + 1,
                        column: 1,
                        severity: 'error',
                        message: `Broken import: cannot resolve '${importPath}'`,
                        ruleId: 'broken-import',
                        source: 'import-analyzer'
                    });
                }
            }

            // Match require statements
            const requireMatch = line.match(/require\s*\(\s*['"](\..*?)['"]\s*\)/);
            if (requireMatch) {
                const requirePath = requireMatch[1];
                const dir = path.dirname(file.fullPath);
                const possibleExtensions = ['', '.js', '.json', '/index.js'];
                let found = false;
                for (const ext of possibleExtensions) {
                    const resolved = path.resolve(dir, requirePath + ext);
                    if (fs.existsSync(resolved)) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    issues.push({
                        file: file.relativePath,
                        fullPath: file.fullPath,
                        line: idx + 1,
                        column: 1,
                        severity: 'error',
                        message: `Broken require: cannot resolve '${requirePath}'`,
                        ruleId: 'broken-import',
                        source: 'import-analyzer'
                    });
                }
            }
        });
    }

    return issues;
}

// -------- Main analyze function --------
async function analyzeProject(projectPath) {
    console.log('[Analyzer] Analyzing project:', projectPath);

    const files = collectFiles(projectPath, ['.html', '.css', '.js', '.jsx']);
    console.log(`[Analyzer] Found ${files.length} files to analyze`);

    const allIssues = [];

    // Run ESLint
    const eslintIssues = await runESLint(files);
    allIssues.push(...eslintIssues);

    // Run HTML analysis
    const htmlIssues = analyzeHTML(files);
    allIssues.push(...htmlIssues);

    // Run CSS analysis
    const cssIssues = analyzeCSS(files);
    allIssues.push(...cssIssues);

    // Check broken imports
    const importIssues = checkBrokenImports(files);
    allIssues.push(...importIssues);

    console.log(`[Analyzer] Found ${allIssues.length} total issues`);

    // Sort: errors first, then warnings, then info
    const severityOrder = { error: 0, warning: 1, info: 2 };
    allIssues.sort((a, b) =>
        (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3)
    );

    return allIssues;
}

module.exports = { analyzeProject };
