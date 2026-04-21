import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import {
    Minus, Square, X, Cpu
} from 'lucide-react';
import { socket } from '../socket';

// VS Code menu definitions
const MENU_ITEMS = {
    File: [
        { label: 'New File', shortcut: 'Ctrl+N', action: 'newFile' },
        { label: 'Open File...', shortcut: 'Ctrl+O', action: 'openFile' },
        { label: 'Open Folder...', shortcut: 'Ctrl+K Ctrl+O', action: 'openFolder' },
        { type: 'separator' },
        { label: 'Save', shortcut: 'Ctrl+S', action: 'save' },
        { label: 'Save All', shortcut: 'Ctrl+K S', action: 'saveAll' },
        { type: 'separator' },
        { label: 'Preferences', action: 'preferences', children: true },
        { type: 'separator' },
        { label: 'Exit', shortcut: 'Alt+F4', action: 'exit' },
    ],
    Edit: [
        { label: 'Undo', shortcut: 'Ctrl+Z', action: 'undo' },
        { label: 'Redo', shortcut: 'Ctrl+Y', action: 'redo' },
        { type: 'separator' },
        { label: 'Cut', shortcut: 'Ctrl+X', action: 'cut' },
        { label: 'Copy', shortcut: 'Ctrl+C', action: 'copy' },
        { label: 'Paste', shortcut: 'Ctrl+V', action: 'paste' },
        { type: 'separator' },
        { label: 'Find', shortcut: 'Ctrl+F', action: 'find' },
        { label: 'Replace', shortcut: 'Ctrl+H', action: 'replace' },
        { label: 'Find in Files', shortcut: 'Ctrl+Shift+F', action: 'findInFiles' },
    ],
    Selection: [
        { label: 'Select All', shortcut: 'Ctrl+A', action: 'selectAll' },
        { label: 'Expand Selection', shortcut: 'Shift+Alt+Right', action: 'expandSelection' },
        { label: 'Shrink Selection', shortcut: 'Shift+Alt+Left', action: 'shrinkSelection' },
        { type: 'separator' },
        { label: 'Copy Line Up', shortcut: 'Shift+Alt+Up', action: 'copyLineUp' },
        { label: 'Copy Line Down', shortcut: 'Shift+Alt+Down', action: 'copyLineDown' },
        { label: 'Move Line Up', shortcut: 'Alt+Up', action: 'moveLineUp' },
        { label: 'Move Line Down', shortcut: 'Alt+Down', action: 'moveLineDown' },
    ],
    View: [
        { label: 'Command Palette...', shortcut: 'Ctrl+Shift+P', action: 'commandPalette' },
        { label: 'Open View...', action: 'openView' },
        { type: 'separator' },
        { label: 'Explorer', shortcut: 'Ctrl+Shift+E', action: 'showExplorer' },
        { label: 'Search', shortcut: 'Ctrl+Shift+F', action: 'showSearch' },
        { label: 'Source Control', shortcut: 'Ctrl+Shift+G', action: 'showSourceControl' },
        { type: 'separator' },
        { label: 'Terminal', shortcut: 'Ctrl+`', action: 'toggleTerminal' },
        { label: 'Problems', shortcut: 'Ctrl+Shift+M', action: 'showProblems' },
    ],
    Go: [
        { label: 'Go to File...', shortcut: 'Ctrl+P', action: 'quickOpen' },
        { label: 'Go to Line...', shortcut: 'Ctrl+G', action: 'goToLine' },
        { label: 'Go to Symbol...', shortcut: 'Ctrl+Shift+O', action: 'goToSymbol' },
        { type: 'separator' },
        { label: 'Go to Definition', shortcut: 'F12', action: 'goToDefinition' },
        { label: 'Go Back', shortcut: 'Alt+Left', action: 'goBack' },
        { label: 'Go Forward', shortcut: 'Alt+Right', action: 'goForward' },
    ],
    Run: [
        { label: 'Start Debugging', shortcut: 'F5', action: 'startDebugging' },
        { label: 'Run Without Debugging', shortcut: 'Ctrl+F5', action: 'runWithoutDebugging' },
        { type: 'separator' },
        { label: 'Run Analysis', action: 'runAnalysis' },
        { label: 'Run Project', action: 'runProject' },
    ],
    Terminal: [
        { label: 'New Terminal', shortcut: 'Ctrl+Shift+`', action: 'newTerminal' },
        { label: 'Split Terminal', action: 'splitTerminal' },
        { type: 'separator' },
        { label: 'Run Task...', action: 'runTask' },
    ],
    Help: [
        { label: 'Welcome', action: 'showWelcome' },
        { label: 'Keyboard Shortcuts', shortcut: 'Ctrl+K Ctrl+S', action: 'showShortcuts' },
        { label: 'Documentation', action: 'docs' },
        { type: 'separator' },
        { label: 'About', action: 'about' },
    ],
};

export default function TopBar() {
    const { state, dispatch } = useApp();
    const [openMenu, setOpenMenu] = useState(null);
    const [showCollabModal, setShowCollabModal] = useState(false);
    const [collabInput, setCollabInput] = useState('');
    const menuRef = useRef(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleOpenProject = async () => {
        setOpenMenu(null);
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

    const handleSaveAll = async () => {
        setOpenMenu(null);
        const modifiedFiles = state.openFiles.filter(f => f.modified);
        if (modifiedFiles.length === 0) {
            dispatch({ type: 'SET_STATUS', payload: 'No files to save' });
            return;
        }

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

    const handleRunAnalysis = async () => {
        setOpenMenu(null);
        if (!state.projectPath) return;
        dispatch({ type: 'SET_ANALYSIS_RUNNING', payload: true });
        dispatch({ type: 'SET_STATUS', payload: 'Running analysis...' });
        try {
            const res = await axios.post('/api/run-analysis', { projectPath: state.projectPath });
            dispatch({ type: 'SET_ISSUES', payload: res.data.issues || [] });
            dispatch({ type: 'SET_STATUS', payload: `Found ${res.data.issues?.length || 0} issues` });
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

    const handleRunProject = async (isDebug) => {
        setOpenMenu(null);
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
                args = ['index.js'];
            }

            if (isDebug && cmd === 'node') args.unshift('--inspect');

            dispatch({ type: 'SET_STATUS', payload: `Starting project...` });
            window.electronAPI.startTerminalProcess(cmd, args, state.projectPath);
        } catch (err) {
            console.error(err);
            dispatch({ type: 'SET_STATUS', payload: `Failed to start project` });
        }
    };

    const handleMenuAction = (action) => {
        setOpenMenu(null);
        switch (action) {
            case 'openFolder': handleOpenProject(); break;
            case 'saveAll': handleSaveAll(); break;
            case 'runAnalysis': handleRunAnalysis(); break;
            case 'runProject': handleRunProject(false); break;
            case 'startDebugging': handleRunProject(true); break;
            case 'showExplorer': dispatch({ type: 'SET_SIDEBAR_VIEW', payload: 'explorer' }); break;
            case 'showSearch': dispatch({ type: 'SET_SIDEBAR_VIEW', payload: 'search' }); break;
            case 'showSourceControl': dispatch({ type: 'SET_SIDEBAR_VIEW', payload: 'source-control' }); break;
            default: break;
        }
    };

    const handleCollaborate = () => {
        if (state.collabRoomId) {
            if (window.confirm('Leave current collaboration room?')) {
                socket.disconnect();
                dispatch({ type: 'LEAVE_COLLAB_ROOM' });
            }
            return;
        }
        setShowCollabModal(true);
    };

    const submitCollabRoom = (e) => {
        e.preventDefault();
        const action = collabInput.trim();
        if (!action) return;

        let roomId = action.toLowerCase() === 'create' 
            ? Math.random().toString(36).substring(2, 8).toUpperCase()
            : action.toUpperCase();

        if (!socket.connected) socket.connect();
        socket.emit('join-room', roomId);
        dispatch({ type: 'SET_COLLAB_ROOM', payload: roomId });
        dispatch({ type: 'SET_STATUS', payload: `Joined Room: ${roomId}` });
        
        setShowCollabModal(false);
        setCollabInput('');
    };

    return (
        <>
        {/* Title Bar — exactly matching VS Code */}
        <div 
            className="flex items-center h-[30px] shrink-0 select-none"
            style={{ 
                background: '#323233', 
                WebkitAppRegion: 'drag',
                fontSize: '13px'
            }}
        >
            {/* App Icon */}
            <div className="flex items-center px-2.5 shrink-0" style={{ WebkitAppRegion: 'no-drag' }}>
                <div className="w-4 h-4 flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-[#75beff]" />
                </div>
            </div>

            {/* Menu Bar */}
            <div ref={menuRef} className="flex items-center" style={{ WebkitAppRegion: 'no-drag' }}>
                {Object.keys(MENU_ITEMS).map((menuName) => (
                    <div key={menuName} className="relative">
                        <button
                            onClick={() => setOpenMenu(openMenu === menuName ? null : menuName)}
                            onMouseEnter={() => openMenu && setOpenMenu(menuName)}
                            className="px-2 py-0.5 rounded-sm text-[13px]"
                            style={{
                                color: openMenu === menuName ? '#ffffff' : '#cccccc',
                                background: openMenu === menuName ? 'rgba(255,255,255,0.1)' : 'transparent',
                            }}
                            onMouseOver={(e) => {
                                if (!openMenu) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                            }}
                            onMouseOut={(e) => {
                                if (openMenu !== menuName) e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            {menuName}
                        </button>

                        {openMenu === menuName && (
                            <div 
                                className="absolute top-full left-0 mt-px py-1 rounded-md shadow-2xl z-50"
                                style={{ 
                                    background: '#3c3c3c', 
                                    border: '1px solid #454545',
                                    minWidth: '220px',
                                }}
                            >
                                {MENU_ITEMS[menuName].map((item, i) => {
                                    if (item.type === 'separator') {
                                        return <div key={i} className="my-1 mx-3" style={{ borderTop: '1px solid #555555' }}></div>;
                                    }
                                    return (
                                        <button
                                            key={i}
                                            className="w-full flex items-center justify-between px-6 py-[3px] text-[13px] text-left"
                                            style={{ color: '#cccccc' }}
                                            onClick={() => handleMenuAction(item.action)}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.background = '#04395e';
                                                e.currentTarget.style.color = '#ffffff';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.color = '#cccccc';
                                            }}
                                        >
                                            <span>{item.label}</span>
                                            {item.shortcut && (
                                                <span className="ml-8 text-[12px]" style={{ color: '#858585' }}>
                                                    {item.shortcut}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Center — Title */}
            <div className="flex-1 text-center" style={{ WebkitAppRegion: 'drag' }}>
                <span className="text-[12px]" style={{ color: '#999999' }}>
                    {state.projectName ? `${state.projectName} — ` : ''}AI Code Editor
                </span>
            </div>

            {/* Collab badge */}
            <div className="flex items-center gap-2 mr-2" style={{ WebkitAppRegion: 'no-drag' }}>
                {state.collabRoomId ? (
                    <button 
                        onClick={handleCollaborate}
                        className="text-[11px] px-2 py-0.5 rounded-sm"
                        style={{ background: '#007acc', color: '#ffffff' }}
                    >
                        Room: {state.collabRoomId}
                    </button>
                ) : (
                    <button 
                        onClick={handleCollaborate}
                        className="text-[11px] px-2 py-0.5 rounded-sm"
                        style={{ color: '#858585' }}
                        onMouseOver={e => e.currentTarget.style.color = '#cccccc'}
                        onMouseOut={e => e.currentTarget.style.color = '#858585'}
                    >
                        Live Share
                    </button>
                )}
            </div>

            {/* Window Controls (Electron) */}
            <div className="flex items-center h-full ml-auto" style={{ WebkitAppRegion: 'no-drag' }}>
                <button className="h-full px-3.5 flex items-center justify-center hover:bg-white/10" style={{ color: '#999999' }}>
                    <Minus className="w-4 h-4" />
                </button>
                <button className="h-full px-3.5 flex items-center justify-center hover:bg-white/10" style={{ color: '#999999' }}>
                    <Square className="w-3.5 h-3.5" />
                </button>
                <button className="h-full px-3.5 flex items-center justify-center hover:bg-[#e81123]" style={{ color: '#999999' }}>
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Collab Modal */}
        {showCollabModal && (
            <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[20vh] z-50" onClick={() => setShowCollabModal(false)}>
                <div 
                    className="w-[400px] rounded-md shadow-2xl overflow-hidden"
                    style={{ background: '#252526', border: '1px solid #3c3c3c' }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid #3c3c3c' }}>
                        <h2 className="text-[13px] font-normal" style={{ color: '#cccccc' }}>
                            Join Collaboration Room
                        </h2>
                    </div>
                    <form onSubmit={submitCollabRoom} className="p-4">
                        <label className="block text-[12px] mb-2" style={{ color: '#858585' }}>
                            Enter "create" to host a new room, or enter an existing Room ID to join:
                        </label>
                        <input 
                            type="text" 
                            value={collabInput}
                            onChange={(e) => setCollabInput(e.target.value)}
                            placeholder="e.g. create or G7T2X"
                            className="vscode-input w-full rounded-sm mb-4 font-mono"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowCollabModal(false)} className="btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary">
                                Join/Create
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </>
    );
}
