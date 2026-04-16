import React, { useCallback, useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useApp } from '../context/AppContext';
import { socket } from '../socket';
import { 
    X, Circle, Code2, Columns, Map as SidebarRight, WrapText, Wand2, Sun, Moon, ChevronRight,
    Search, Replace, Navigation, ZoomIn, ZoomOut, Settings, FileCode,
    MoreVertical, Copy, Trash2, Pencil, Share2
} from 'lucide-react';

export default function EditorPanel() {
    const { state, dispatch } = useApp();
    const [isSplit, setIsSplit] = useState(false);
    const [splitFileIndex, setSplitFileIndex] = useState(-1);
    const [showFind, setShowFind] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [fontSize, setFontSize] = useState(14);
    const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
    const [selection, setSelection] = useState(null);
    const [findQuery, setFindQuery] = useState('');
    const [replaceQuery, setReplaceQuery] = useState('');
    const [showReplace, setShowReplace] = useState(false);
    const [goToLine, setGoToLine] = useState('');
    const [showGoToLine, setShowGoToLine] = useState(false);
    const [editorSettings, setEditorSettings] = useState({
        theme: 'vs-dark',
        minimap: true,
        wordWrap: 'on',
        lineNumbers: 'on',
        formatOnSave: true,
        autoSave: true,
        bracketPairs: true,
        renderWhitespace: 'none',
        tabSize: 4
    });
    
    const editorRefMain = useRef(null);
    const editorRefSplit = useRef(null);
    const monacoRef = useRef(null);
    const remoteDecorationsRef = useRef({});

    const activeFile = state.openFiles[state.activeFileIndex];
    const splitFile = state.openFiles[splitFileIndex === -1 ? state.activeFileIndex : splitFileIndex];

    const handleEditorChange = useCallback((value) => {
        if (state.activeFileIndex >= 0) {
            // Only emit if it's an actual change locally triggered
            if (activeFile && value !== activeFile.content && state.collabRoomId) {
                socket.emit('code-update', {
                    roomId: state.collabRoomId,
                    code: value,
                    fileId: activeFile.path
                });
            }
            dispatch({
                type: 'UPDATE_FILE_CONTENT',
                payload: { index: state.activeFileIndex, content: value }
            });
        }
    }, [state.activeFileIndex, activeFile, state.collabRoomId, dispatch]);

    React.useEffect(() => {
        const handleCodeUpdate = ({ code, fileId, userId }) => {
            // Find the file index
            const index = state.openFiles.findIndex(f => f.path === fileId);
            if (index !== -1 && state.openFiles[index].content !== code) {
                dispatch({
                    type: 'UPDATE_FILE_CONTENT',
                    payload: { index, content: code }
                });
            }
        };

        socket.on('code-update', handleCodeUpdate);
        return () => socket.off('code-update', handleCodeUpdate);
    }, [state.openFiles, dispatch]);

    const handleSave = useCallback(async () => {
        if (!activeFile) return;
        try {
            if (window.electronAPI) {
                await window.electronAPI.saveFile(activeFile.path, activeFile.content);
            }
            dispatch({ type: 'MARK_FILE_SAVED', payload: state.activeFileIndex });
            dispatch({ type: 'SET_STATUS', payload: `Saved ${activeFile.name}` });
        } catch (err) {
            console.error('Save failed:', err);
        }
    }, [activeFile, state.activeFileIndex, dispatch]);

    // Handle cursor position changes
    useEffect(() => {
        const editor = editorRefMain.current;
        if (!editor) return;
        const disposable = editor.onDidChangeCursorPosition((e) => {
            setCursorPosition({ line: e.position.lineNumber, column: e.position.column });
        });
        return () => disposable.dispose();
    }, [activeFile]);

    // Handle selection changes
    useEffect(() => {
        const editor = editorRefMain.current;
        if (!editor) return;
        const disposable = editor.onDidChangeCursorSelection((e) => {
            const sel = e.selection;
            const currentSelection = {
                startLine: sel.startLineNumber,
                startCol: sel.startColumn,
                endLine: sel.endLineNumber,
                endCol: sel.endColumn
            };
            if (sel.startLineNumber !== sel.endLineNumber || sel.startColumn !== sel.endColumn) {
                setSelection(currentSelection);
            } else {
                setSelection(null);
            }

            if (state.collabRoomId && activeFile) {
                socket.emit('cursor-update', {
                    roomId: state.collabRoomId,
                    fileId: activeFile.path,
                    selection: currentSelection,
                    cursorPosition: { line: e.position.lineNumber, column: e.position.column }
                });
            }
        });
        return () => disposable.dispose();
    }, [activeFile, state.collabRoomId]);

    // Handle find
    const handleFind = useCallback(() => {
        const editor = editorRefMain.current;
        if (!editor || !findQuery) return;
        const model = editor.getModel();
        if (!model) return;
        const searchParams = {
            searchString: findQuery,
            isCaseSensitive: false,
            isWholeWord: false,
            isRegex: false,
            matchCase: false
        };
        const matches = model.findMatches(findQuery, false, searchParams.isRegex, searchParams.matchCase, searchParams.isWholeWord, false);
        if (matches.length > 0) {
            const match = matches[0];
            editor.setSelection(match.range);
            editor.revealLineInCenter(match.range.startLineNumber);
        }
    }, [findQuery]);

    const handleFindNext = useCallback(() => {
        const editor = editorRefMain.current;
        if (!editor || !findQuery) return;
        editor.getAction('actions.findNext').run();
    }, [findQuery]);

    const handleFindPrevious = useCallback(() => {
        const editor = editorRefMain.current;
        if (!editor || !findQuery) return;
        editor.getAction('actions.findPrevious').run();
    }, [findQuery]);

    const handleReplaceAll = useCallback(() => {
        const editor = editorRefMain.current;
        if (!editor || !findQuery || !replaceQuery) return;
        const model = editor.getModel();
        if (!model) return;
        const oldContent = model.getValue();
        const newContent = oldContent.replace(new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replaceQuery);
        const targetIndex = state.activeFileIndex;
        if (targetIndex >= 0) {
            dispatch({
                type: 'UPDATE_FILE_CONTENT',
                payload: { index: targetIndex, content: newContent }
            });
        }
    }, [findQuery, replaceQuery, state.activeFileIndex, dispatch]);

    // Handle go to line
    const handleGoToLineAction = useCallback(() => {
        const editor = editorRefMain.current;
        if (!editor || !goToLine) return;
        const lineNum = parseInt(goToLine, 10);
        if (isNaN(lineNum)) return;
        editor.revealLine(lineNum);
        editor.setPosition({ lineNumber: lineNum, column: 1 });
        setShowGoToLine(false);
        setGoToLine('');
    }, [goToLine]);

    const handleShareSnippet = () => {
        if (!state.collabRoomId || !activeFile) {
            dispatch({ type: 'SET_STATUS', payload: 'Must be in a room to share snippets' });
            return;
        }
        const editor = editorRefMain.current;
        if (!editor) return;
        
        const selectionRange = editor.getSelection();
        if (selectionRange.isEmpty()) {
            dispatch({ type: 'SET_STATUS', payload: 'Select some code to share' });
            return;
        }

        const selectedText = editor.getModel().getValueInRange(selectionRange);

        socket.emit('chat-message', {
            roomId: state.collabRoomId,
            message: `Shared snippet from ${activeFile.name}`,
            type: 'snippet',
            snippetData: {
                code: selectedText,
                language: activeFile.language,
                path: activeFile.path,
                startLine: selectionRange.startLineNumber,
                endLine: selectionRange.endLineNumber
            }
        });
        dispatch({ type: 'SET_STATUS', payload: 'Snippet shared to chat' });
    };

    useEffect(() => {
        if (!state.scrollTarget || !activeFile || !editorRefMain.current) return;
        if (state.scrollTarget.path === activeFile.path) {
            const editor = editorRefMain.current;
            const line = state.scrollTarget.line || 1;
            editor.revealLineInCenter(line);
            editor.setPosition({ lineNumber: line, column: 1 });
            dispatch({ type: 'SET_SCROLL_TARGET', payload: null });
        }
    }, [state.scrollTarget, activeFile, dispatch]);

    useEffect(() => {
        const handleRemoteCursor = ({ userId, fileId, selection, cursorPosition }) => {
            if (!activeFile || fileId !== activeFile.path || !editorRefMain.current || !monacoRef.current) return;
            const editor = editorRefMain.current;
            const monaco = monacoRef.current;

            if (!remoteDecorationsRef.current[userId]) {
                remoteDecorationsRef.current[userId] = editor.createDecorationsCollection([]);
            }

            const decs = [];
            if (selection && (selection.startLine !== selection.endLine || selection.startCol !== selection.endCol)) {
                decs.push({
                    range: new monaco.Range(selection.startLine, selection.startCol, selection.endLine, selection.endCol),
                    options: { className: 'remote-selection', stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges }
                });
            } else if (cursorPosition) {
                decs.push({
                    range: new monaco.Range(cursorPosition.line, cursorPosition.column, cursorPosition.line, cursorPosition.column),
                    options: { className: 'remote-cursor', isWholeLine: false, stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges }
                });
            }
            remoteDecorationsRef.current[userId].set(decs);
        };

        socket.on('cursor-update', handleRemoteCursor);
        return () => socket.off('cursor-update', handleRemoteCursor);
    }, [activeFile]);

    const increaseFontSize = () => {
        setFontSize(prev => Math.min(prev + 1, 24));
    };

    const decreaseFontSize = () => {
        setFontSize(prev => Math.max(prev - 1, 8));
    };

    // Handle keyboard shortcut Ctrl+S inside Monaco
    const handleEditorMountMain = useCallback((editor, monaco) => {
        editorRefMain.current = editor;
        monacoRef.current = monaco;
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            handleSave();
        });
        
        // Add keyboard shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
            setShowFind(true);
        });
        
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG, () => {
            setShowGoToLine(true);
        });
    }, [handleSave]);

    const handleEditorMountSplit = useCallback((editor, monaco) => {
        editorRefSplit.current = editor;
        // In split, we also invoke handleSave which saves activeFile for simplicity, or we could handle saving splitFile
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            handleSave();
        });
    }, [handleSave]);

    const formatDocument = () => {
        if (editorRefMain.current) {
            editorRefMain.current.getAction('editor.action.formatDocument').run();
        }
        if (isSplit && editorRefSplit.current) {
            editorRefSplit.current.getAction('editor.action.formatDocument').run();
        }
    };

    const handleEditorChangeSplit = useCallback((value) => {
        const targetIndex = splitFileIndex === -1 ? state.activeFileIndex : splitFileIndex;
        if (targetIndex >= 0) {
            const currentSplitFile = state.openFiles[targetIndex];
            if (currentSplitFile && value !== currentSplitFile.content && state.collabRoomId) {
                socket.emit('code-update', {
                    roomId: state.collabRoomId,
                    code: value,
                    fileId: currentSplitFile.path
                });
            }
            dispatch({
                type: 'UPDATE_FILE_CONTENT',
                payload: { index: targetIndex, content: value }
            });
        }
    }, [splitFileIndex, state.activeFileIndex, state.openFiles, state.collabRoomId, dispatch]);

    // Handle global keyboard shortcut Ctrl+S
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    if (state.openFiles.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-studio-editor">
                <div className="text-center animate-fade-in">
                    <Code2 className="w-16 h-16 mx-auto mb-4 text-studio-text-muted/20" />
                    <h3 className="text-studio-text-muted text-lg mb-2">No file open</h3>
                    <p className="text-studio-text-muted/60 text-sm">
                        Select a file from the explorer to start editing
                    </p>
                    <div className="mt-6 text-xs text-studio-text-muted/40 space-y-1">
                        <p>Ctrl+S to save</p>
                    </div>
                </div>
            </div>
        );
    }

    const renderTabs = (isSplitPane = false) => (
        <div className="flex bg-studio-surface border-b border-studio-border overflow-x-auto shrink-0"
            style={{ scrollbarWidth: 'none' }}>
            {state.openFiles.map((file, index) => {
                const isActive = isSplitPane ? index === (splitFileIndex === -1 ? state.activeFileIndex : splitFileIndex) : index === state.activeFileIndex;
                return (
                    <div
                        key={file.path}
                        onClick={() => {
                            if (isSplitPane) setSplitFileIndex(index);
                            else dispatch({ type: 'SET_ACTIVE_FILE', payload: index });
                        }}
                        className={`group flex items-center gap-2 px-3 py-2 cursor-pointer border-r border-studio-border min-w-0 shrink-0 transition-colors ${isActive
                                ? 'bg-studio-tab-active border-t-2 border-t-blue-500 text-studio-text'
                                : 'bg-studio-tab text-studio-text-muted hover:bg-studio-surface-hover hover:text-studio-text border-t-2 border-t-transparent'
                            }`}
                    >
                        <span className="text-xs truncate max-w-[120px]" title={file.path}>{file.name}</span>
                        {file.modified && (
                            <Circle className="w-2 h-2 fill-blue-400 text-blue-400 shrink-0" />
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                dispatch({ type: 'CLOSE_FILE', payload: index });
                                if (isSplitPane && splitFileIndex === index) {
                                    setSplitFileIndex(-1);
                                }
                            }}
                            className="ml-1 p-0.5 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="flex-1 flex flex-col bg-studio-editor overflow-hidden relative">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-studio-surface border-b border-studio-border shrink-0">
                <div className="flex items-center gap-2 text-xs text-studio-text-muted">
                    {activeFile ? (
                        <>
                            <span className="truncate max-w-[300px]" title={activeFile.path}>
                                {activeFile.path.split(/[\\/]/).map((part, i, arr) => (
                                    <React.Fragment key={i}>
                                        <span>{part}</span>
                                        {i < arr.length - 1 && <ChevronRight className="inline w-3 h-3 mx-0.5" />}
                                    </React.Fragment>
                                ))}
                            </span>
                        </>
                    ) : <span>No specific file tracked</span>}
                </div>
                
                <div className="flex items-center gap-1.5">
                    <button onClick={handleShareSnippet} disabled={!activeFile || !state.collabRoomId} className="p-1.5 rounded hover:bg-white/10 text-studio-text-muted hover:text-studio-text disabled:opacity-40" title="Share Snippet to Chat">
                        <Share2 className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                    <div className="w-px h-4 bg-studio-border mx-1"></div>
                    <button onClick={formatDocument} className="p-1.5 rounded hover:bg-white/10 text-studio-text-muted hover:text-studio-text" title="Format Document">
                        <Wand2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-studio-border mx-1"></div>
                    <button onClick={() => setEditorSettings(s => ({ ...s, wordWrap: s.wordWrap === 'on' ? 'off' : 'on' }))} className={`p-1.5 rounded hover:bg-white/10 ${editorSettings.wordWrap === 'on' ? 'text-studio-accent bg-studio-accent/10' : 'text-studio-text-muted hover:text-studio-text'}`} title="Toggle Word Wrap">
                        <WrapText className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditorSettings(s => ({ ...s, minimap: !s.minimap }))} className={`p-1.5 rounded hover:bg-white/10 ${editorSettings.minimap ? 'text-studio-accent bg-studio-accent/10' : 'text-studio-text-muted hover:text-studio-text'}`} title="Toggle Minimap">
                        <SidebarRight className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditorSettings(s => ({ ...s, theme: s.theme === 'vs-dark' ? 'light' : 'vs-dark' }))} className="p-1.5 rounded hover:bg-white/10 text-studio-text-muted hover:text-studio-text" title="Toggle Theme">
                        {editorSettings.theme === 'vs-dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    </button>
                    <div className="w-px h-4 bg-studio-border mx-1"></div>
                    <button onClick={() => setShowFind(!showFind)} className={`p-1.5 rounded hover:bg-white/10 ${showFind ? 'text-studio-accent bg-studio-accent/10' : 'text-studio-text-muted hover:text-studio-text'}`} title="Find (Ctrl+F)">
                        <Search className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setShowGoToLine(true)} className="p-1.5 rounded hover:bg-white/10 text-studio-text-muted hover:text-studio-text" title="Go to Line (Ctrl+G)">
                        <Navigation className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-studio-border mx-1"></div>
                    <button onClick={decreaseFontSize} className="p-1.5 rounded hover:bg-white/10 text-studio-text-muted hover:text-studio-text" title="Decrease Font Size">
                        <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-studio-text-muted w-6 text-center">{fontSize}</span>
                    <button onClick={increaseFontSize} className="p-1.5 rounded hover:bg-white/10 text-studio-text-muted hover:text-studio-text" title="Increase Font Size">
                        <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-studio-border mx-1"></div>
                    <button onClick={() => setIsSplit(!isSplit)} className={`p-1.5 rounded hover:bg-white/10 ${isSplit ? 'text-studio-accent bg-studio-accent/10' : 'text-studio-text-muted hover:text-studio-text'}`} title="Split Editor Right">
                        <Columns className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-studio-border mx-1"></div>
                    <button onClick={() => setShowSettings(!showSettings)} className={`p-1.5 rounded hover:bg-white/10 ${showSettings ? 'text-studio-accent bg-studio-accent/10' : 'text-studio-text-muted hover:text-studio-text'}`} title="Editor Settings">
                        <Settings className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Find/Replace Bar */}
            {showFind && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-studio-surface border-b border-studio-border shrink-0">
                    <div className="flex items-center gap-1 bg-studio-bg rounded px-2 py-1">
                        <Search className="w-3.5 h-3.5 text-studio-text-muted" />
                        <input 
                            type="text" 
                            placeholder="Find"
                            value={findQuery}
                            onChange={e => setFindQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleFind()}
                            className="bg-transparent border-none outline-none text-xs text-studio-text placeholder-studio-text-muted w-48"
                            autoFocus
                        />
                    </div>
                    <button onClick={handleFind} className="p-1 rounded hover:bg-white/10 text-studio-text-muted" title="Find Next">
                        Search
                    </button>
                    <button onClick={() => setShowReplace(!showReplace)} className="p-1 rounded hover:bg-white/10 text-studio-text-muted text-xs">
                        {showReplace ? 'Hide Replace' : 'Replace'}
                    </button>
                    {showReplace && (
                        <>
                            <div className="flex items-center gap-1 bg-studio-bg rounded px-2 py-1">
                                <Replace className="w-3.5 h-3.5 text-studio-text-muted" />
                                <input 
                                    type="text" 
                                    placeholder="Replace with"
                                    value={replaceQuery}
                                    onChange={e => setReplaceQuery(e.target.value)}
                                    className="bg-transparent border-none outline-none text-xs text-studio-text placeholder-studio-text-muted w-48"
                                />
                            </div>
                            <button onClick={handleReplaceAll} className="p-1 rounded hover:bg-white/10 text-studio-text-muted text-xs">
                                Replace All
                            </button>
                        </>
                    )}
                    <button onClick={() => { setShowFind(false); setFindQuery(''); setShowReplace(false); }} className="ml-auto p-1 rounded hover:bg-white/10 text-studio-text-muted">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Go to Line Modal */}
            {showGoToLine && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-studio-surface border border-studio-border rounded-lg shadow-xl p-4 w-80">
                        <h3 className="text-sm font-semibold text-studio-text mb-3">Go to Line</h3>
                        <input 
                            type="text" 
                            placeholder="Line number"
                            value={goToLine}
                            onChange={e => setGoToLine(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleGoToLineAction()}
                            className="w-full bg-studio-bg border border-studio-border rounded px-3 py-2 text-sm text-studio-text outline-none focus:border-studio-accent"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setShowGoToLine(false)} className="px-3 py-1.5 text-xs text-studio-text-muted hover:text-studio-text">Cancel</button>
                            <button onClick={handleGoToLineAction} className="px-3 py-1.5 bg-studio-accent text-white rounded text-xs hover:bg-studio-accent-hover">Go</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Dropdown */}
            {showSettings && (
                <div className="absolute right-14 top-12 bg-studio-surface border border-studio-border rounded-lg shadow-xl p-3 z-40 w-64">
                    <h3 className="text-xs font-semibold text-studio-text mb-2 uppercase tracking-wider">Editor Settings</h3>
                    <div className="space-y-2">
                        <label className="flex items-center justify-between text-xs cursor-pointer">
                            <span className="text-studio-text-muted">Line Numbers</span>
                            <input 
                                type="checkbox" 
                                checked={editorSettings.lineNumbers === 'on'}
                                onChange={e => setEditorSettings(s => ({ ...s, lineNumbers: e.target.checked ? 'on' : 'off' }))}
                                className="accent-studio-accent"
                            />
                        </label>
                        <label className="flex items-center justify-between text-xs cursor-pointer">
                            <span className="text-studio-text-muted">Minimap</span>
                            <input 
                                type="checkbox" 
                                checked={editorSettings.minimap}
                                onChange={e => setEditorSettings(s => ({ ...s, minimap: e.target.checked }))}
                                className="accent-studio-accent"
                            />
                        </label>
                        <label className="flex items-center justify-between text-xs cursor-pointer">
                            <span className="text-studio-text-muted">Word Wrap</span>
                            <input 
                                type="checkbox" 
                                checked={editorSettings.wordWrap === 'on'}
                                onChange={e => setEditorSettings(s => ({ ...s, wordWrap: e.target.checked ? 'on' : 'off' }))}
                                className="accent-studio-accent"
                            />
                        </label>
                        <label className="flex items-center justify-between text-xs cursor-pointer">
                            <span className="text-studio-text-muted">Bracket Pairs</span>
                            <input 
                                type="checkbox" 
                                checked={editorSettings.bracketPairs}
                                onChange={e => setEditorSettings(s => ({ ...s, bracketPairs: e.target.checked }))}
                                className="accent-studio-accent"
                            />
                        </label>
                        <label className="flex items-center justify-between text-xs cursor-pointer">
                            <span className="text-studio-text-muted">Auto Save</span>
                            <input 
                                type="checkbox" 
                                checked={editorSettings.autoSave}
                                onChange={e => setEditorSettings(s => ({ ...s, autoSave: e.target.checked }))}
                                className="accent-studio-accent"
                            />
                        </label>
                        <label className="flex items-center justify-between text-xs cursor-pointer">
                            <span className="text-studio-text-muted">Format on Save</span>
                            <input 
                                type="checkbox" 
                                checked={editorSettings.formatOnSave}
                                onChange={e => setEditorSettings(s => ({ ...s, formatOnSave: e.target.checked }))}
                                className="accent-studio-accent"
                            />
                        </label>
                        <div className="border-t border-studio-border pt-2 mt-2">
                            <span className="text-xs text-studio-text-muted">Tab Size</span>
                            <select 
                                value={editorSettings.tabSize}
                                onChange={e => setEditorSettings(s => ({ ...s, tabSize: parseInt(e.target.value) }))}
                                className="ml-2 bg-studio-bg border border-studio-border rounded px-2 py-0.5 text-xs text-studio-text"
                            >
                                <option value={2}>2 spaces</option>
                                <option value={4}>4 spaces</option>
                            </select>
                        </div>
                        <div className="border-t border-studio-border pt-2 mt-2">
                            <span className="text-xs text-studio-text-muted">Render Whitespace</span>
                            <select 
                                value={editorSettings.renderWhitespace}
                                onChange={e => setEditorSettings(s => ({ ...s, renderWhitespace: e.target.value }))}
                                className="ml-2 bg-studio-bg border border-studio-border rounded px-2 py-0.5 text-xs text-studio-text"
                            >
                                <option value="none">None</option>
                                <option value="selection">Selection</option>
                                <option value="all">All</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Editor Area (Flex Row for Split) */}
            <div className="flex-1 flex overflow-hidden">
                {/* Primary Editor Pane */}
                <div className="flex-1 flex flex-col overflow-hidden border-r border-studio-border">
                    {renderTabs(false)}
                    <div className="flex-1 overflow-hidden relative">
                        {activeFile && (
                            <Editor
                                key={`main-${activeFile.path}`}
                                height="100%"
                                language={activeFile.language}
                                value={activeFile.content}
                                onChange={handleEditorChange}
                                onMount={handleEditorMountMain}
                                theme={editorSettings.theme}
                                options={{
                                    fontSize,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                                    minimap: { enabled: editorSettings.minimap, scale: 1 },
                                    scrollBeyondLastLine: false,
                                    renderLineHighlight: 'all',
                                    cursorBlinking: 'smooth',
                                    smoothScrolling: true,
                                    padding: { top: 8 },
                                    lineNumbers: editorSettings.lineNumbers,
                                    wordWrap: editorSettings.wordWrap,
                                    bracketPairColorization: { enabled: editorSettings.bracketPairs },
                                    autoClosingBrackets: 'always',
                                    formatOnPaste: true,
                                    suggestOnTriggerCharacters: true,
                                    renderWhitespace: editorSettings.renderWhitespace,
                                    tabSize: editorSettings.tabSize,
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Secondary Editor Pane (Split) */}
                {isSplit && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {renderTabs(true)}
                        <div className="flex-1 overflow-hidden relative">
                            {splitFile && (
                                <Editor
                                    key={`split-${splitFile.path}`}
                                    height="100%"
                                    language={splitFile.language}
                                    value={splitFile.content}
                                    onChange={handleEditorChangeSplit}
                                    onMount={handleEditorMountSplit}
                                    theme={editorSettings.theme}
                                    options={{
                                        fontSize,
                                        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                                        minimap: { enabled: editorSettings.minimap, scale: 1 },
                                        scrollBeyondLastLine: false,
                                        renderLineHighlight: 'all',
                                        cursorBlinking: 'smooth',
                                        smoothScrolling: true,
                                        padding: { top: 8 },
                                        lineNumbers: editorSettings.lineNumbers,
                                        wordWrap: editorSettings.wordWrap,
                                        bracketPairColorization: { enabled: editorSettings.bracketPairs },
                                        autoClosingBrackets: 'always',
                                        formatOnPaste: true,
                                        suggestOnTriggerCharacters: true,
                                        renderWhitespace: editorSettings.renderWhitespace,
                                        tabSize: editorSettings.tabSize,
                                    }}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
