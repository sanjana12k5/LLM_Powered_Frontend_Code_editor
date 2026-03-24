import React from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import {
    FolderOpen, FilePlus2, Play, Save, Home,
    Minus, Square, X, Cpu
} from 'lucide-react';

export default function TopBar() {
    const { state, dispatch } = useApp();

    const handleOpenProject = async () => {
        try {
            let folderPath;
            if (window.electronAPI) {
                folderPath = await window.electronAPI.openFolderDialog();
            } else {
                folderPath = prompt('Enter project folder path:');
            }
            if (!folderPath) return;

            dispatch({ type: 'SET_STATUS', payload: 'Loading project...' });

            let tree;
            if (window.electronAPI) {
                tree = await window.electronAPI.readDirectory(folderPath);
            } else {
                const res = await axios.post('/api/read-files', { projectPath: folderPath });
                tree = res.data.tree;
            }

            const projectName = folderPath.split(/[\\/]/).pop();
            dispatch({
                type: 'SET_PROJECT',
                payload: { path: folderPath, name: projectName, tree }
            });
        } catch (err) {
            console.error(err);
            dispatch({ type: 'SET_STATUS', payload: 'Failed to open project' });
        }
    };

    const handleRunAnalysis = async () => {
        if (!state.projectPath) return;
        dispatch({ type: 'SET_ANALYSIS_RUNNING', payload: true });
        dispatch({ type: 'SET_STATUS', payload: 'Running analysis...' });

        try {
            const res = await axios.post('/api/run-analysis', {
                projectPath: state.projectPath
            });
            dispatch({ type: 'SET_ISSUES', payload: res.data.issues || [] });
            dispatch({ type: 'SET_STATUS', payload: `Found ${res.data.issues?.length || 0} issues` });

            // Add issues to AI chat
            if (res.data.issues?.length > 0) {
                dispatch({
                    type: 'ADD_AI_MESSAGE',
                    payload: {
                        role: 'system',
                        content: `Analysis complete. Found ${res.data.issues.length} issue(s).`,
                        issues: res.data.issues,
                        timestamp: new Date().toISOString()
                    }
                });
            }
        } catch (err) {
            console.error(err);
            dispatch({ type: 'SET_ISSUES', payload: [] });
            dispatch({ type: 'SET_STATUS', payload: 'Analysis failed' });
        }
    };

    const handleSaveAll = async () => {
        const modifiedFiles = state.openFiles.filter(f => f.modified);
        if (modifiedFiles.length === 0) {
            dispatch({ type: 'SET_STATUS', payload: 'No files to save' });
            return;
        }

        dispatch({ type: 'SET_STATUS', payload: 'Saving files...' });

        for (let i = 0; i < state.openFiles.length; i++) {
            const file = state.openFiles[i];
            if (!file.modified) continue;

            try {
                if (window.electronAPI) {
                    await window.electronAPI.saveFile(file.path, file.content);
                } else {
                    await axios.post('/api/save-files', {
                        files: [{ path: file.path, content: file.content }]
                    });
                }
                dispatch({ type: 'MARK_FILE_SAVED', payload: i });
            } catch (err) {
                console.error('Failed to save:', file.path, err);
            }
        }

        dispatch({ type: 'SET_STATUS', payload: `Saved ${modifiedFiles.length} file(s)` });
    };

    const handleRunProject = async (isDebug) => {
        if (!state.projectPath || !window.electronAPI) return;
        try {
            const pkgPath = `${state.projectPath}/package.json`;
            const res = await window.electronAPI.readFile(pkgPath);
            let cmd = 'node index.js';
            let args = [];
            
            if (res.success) {
                const pkg = JSON.parse(res.content);
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                if (deps.react || deps['react-scripts'] || deps.vite) {
                    cmd = 'npm';
                    args = ['run', pkg.scripts?.dev ? 'dev' : 'start'];
                } else if (pkg.scripts?.start) {
                    cmd = 'npm';
                    args = ['start'];
                }
            } else {
                cmd = 'node';
                args = ['index.js']; // fallback
            }

            if (isDebug) {
                if (cmd === 'node') args.unshift('--inspect');
            }

            dispatch({ type: 'SET_STATUS', payload: `Starting project...` });
            window.electronAPI.startTerminalProcess(cmd, args, state.projectPath);
        } catch (err) {
            console.error(err);
            dispatch({ type: 'SET_STATUS', payload: `Failed to start project` });
        }
    };

    return (
        <div className="flex items-center bg-studio-surface border-b border-studio-border select-none"
            style={{ WebkitAppRegion: 'drag' }}>
            {/* Logo */}
            <div className="flex items-center gap-2 px-4 py-2"
                style={{ WebkitAppRegion: 'no-drag' }}>
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <Cpu className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    AI Studio
                </span>
                {state.projectName && (
                    <span className="text-xs text-studio-text-muted ml-2">
                        — {state.projectName}
                    </span>
                )}
            </div>

            {/* Toolbar buttons */}
            <div className="flex items-center gap-1 px-2" style={{ WebkitAppRegion: 'no-drag' }}>
                <button onClick={handleOpenProject}
                    className="btn-ghost flex items-center gap-1.5" title="Open Project">
                    <FolderOpen className="w-4 h-4" />
                    <span className="text-xs">Open Project</span>
                </button>

                <button onClick={() => dispatch({ type: 'GO_HOME' })}
                    className="btn-ghost flex items-center gap-1.5" title="New AI Project">
                    <FilePlus2 className="w-4 h-4" />
                    <span className="text-xs">New AI Project</span>
                </button>

                <div className="w-px h-5 bg-studio-border mx-1"></div>

                <button onClick={handleRunAnalysis}
                    disabled={!state.projectPath || state.analysisRunning}
                    className="btn-ghost flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Run Analysis">
                    <Play className="w-4 h-4 text-studio-success" />
                    <span className="text-xs">Run Analysis</span>
                </button>

                <div className="w-px h-5 bg-studio-border mx-1"></div>

                <button onClick={() => handleRunProject(false)}
                    disabled={!state.projectPath}
                    className="btn-ghost flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Run Project">
                    <Play className="w-4 h-4 text-green-400" />
                    <span className="text-xs">Run</span>
                </button>
                <button onClick={() => handleRunProject(true)}
                    disabled={!state.projectPath}
                    className="btn-ghost flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Run and Debug">
                    <Play className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs">Debug</span>
                </button>

                <div className="w-px h-5 bg-studio-border mx-1"></div>

                <button onClick={handleSaveAll}
                    className="btn-ghost flex items-center gap-1.5" title="Save All Files">
                    <Save className="w-4 h-4" />
                    <span className="text-xs">Save Files</span>
                </button>
            </div>

            {/* Spacer for drag region */}
            <div className="flex-1"></div>

        </div>
    );
}
