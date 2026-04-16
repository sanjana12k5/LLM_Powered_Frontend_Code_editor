import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import {
    FolderOpen, FilePlus2, Play, Save, Home,
    Minus, Square, X, Cpu, Users, Keyboard, XCircle
} from 'lucide-react';
import { socket } from '../socket';

const KEYBOARD_SHORTCUTS = [
    { keys: 'Ctrl+S', action: 'Save File' },
    { keys: 'Ctrl+Shift+S', action: 'Save All Files' },
    { keys: 'Ctrl+F', action: 'Find' },
    { keys: 'Ctrl+H', action: 'Find and Replace' },
    { keys: 'Ctrl+G', action: 'Go to Line' },
    { keys: 'Ctrl+W', action: 'Close File' },
    { keys: 'Ctrl+Shift+W', action: 'Close All Files' },
    { keys: 'Ctrl+Tab', action: 'Next File' },
    { keys: 'Ctrl+Shift+Tab', action: 'Previous File' },
    { keys: 'Ctrl+/', action: 'Toggle Comment' },
    { keys: 'Ctrl+Shift+A', action: 'Select All' },
    { keys: 'Alt+Up', action: 'Move Line Up' },
    { keys: 'Alt+Down', action: 'Move Line Down' },
    { keys: 'Ctrl+[', action: 'Outdent Line' },
    { keys: 'Ctrl+]', action: 'Indent Line' },
    { keys: 'Ctrl+D', action: 'Duplicate Line' },
    { keys: 'Ctrl+Shift+K', action: 'Delete Line' },
    { keys: 'F1', action: 'Command Palette' },
    { keys: 'Ctrl+Shift+P', action: 'Quick Open' },
    { keys: 'Ctrl+`', action: 'Toggle Terminal' },
];

export default function TopBar() {
    const { state, dispatch } = useApp();
    const [showShortcuts, setShowShortcuts] = useState(false);

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

    const handleCollaborate = () => {
        if (state.collabRoomId) {
            if (window.confirm('Leave current collaboration room?')) {
                socket.disconnect();
                dispatch({ type: 'LEAVE_COLLAB_ROOM' });
            }
            return;
        }

        const action = window.prompt('Enter "create" to host a new room, or enter an existing Room ID to join:');
        if (!action) return;

        let roomId = action.toLowerCase() === 'create' 
            ? Math.random().toString(36).substring(2, 8).toUpperCase()
            : action.toUpperCase();

        if (!socket.connected) {
            socket.connect();
        }
        socket.emit('join-room', roomId);
        dispatch({ type: 'SET_COLLAB_ROOM', payload: roomId });
        dispatch({ type: 'SET_STATUS', payload: `Joined Room: ${roomId}` });
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
        <>
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

                <button onClick={handleCollaborate}
                    className={`btn-ghost flex items-center gap-1.5 ${state.collabRoomId ? 'text-studio-accent bg-studio-accent/10' : ''}`}
                    title={state.collabRoomId ? "Leave Room" : "Collaborate"}>
                    <Users className="w-4 h-4" />
                    <span className="text-xs">{state.collabRoomId ? state.collabRoomId : "Collaborate"}</span>
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

                <div className="w-px h-5 bg-studio-border mx-1"></div>

                <button onClick={() => setShowShortcuts(true)}
                    className="btn-ghost flex items-center gap-1.5" title="Keyboard Shortcuts">
                    <Keyboard className="w-4 h-4" />
                    <span className="text-xs">Shortcuts</span>
                </button>
            </div>

            {/* Spacer for drag region */}
            <div className="flex-1"></div>

        </div>

        {/* Keyboard Shortcuts Modal */}
        {showShortcuts && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
                <div 
                    className="bg-studio-surface border border-studio-border rounded-lg shadow-2xl w-[480px] max-h-[80vh] overflow-hidden flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-studio-border">
                        <h2 className="text-sm font-semibold text-studio-text">Keyboard Shortcuts</h2>
                        <button onClick={() => setShowShortcuts(false)} className="p-1 rounded hover:bg-studio-surface-hover">
                            <XCircle className="w-5 h-5 text-studio-text-muted" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-studio-border">
                                    <th className="text-left text-xs text-studio-text-muted px-2 py-1.5 font-medium">Keys</th>
                                    <th className="text-left text-xs text-studio-text-muted px-2 py-1.5 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                                    <tr key={index} className="border-b border-studio-border/50">
                                        <td className="px-2 py-1.5">
                                            <kbd className="bg-studio-bg px-1.5 py-0.5 rounded text-xs text-studio-accent font-mono">
                                                {shortcut.keys}
                                            </kbd>
                                        </td>
                                        <td className="px-2 py-1.5 text-xs text-studio-text-muted">{shortcut.action}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-4 py-2 border-t border-studio-border flex justify-end">
                        <button onClick={() => setShowShortcuts(false)} className="px-3 py-1.5 bg-studio-accent text-white text-xs rounded hover:bg-studio-accent-hover">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
