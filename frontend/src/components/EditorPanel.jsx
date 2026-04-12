import React, { useCallback, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useApp } from '../context/AppContext';
import { socket } from '../socket';
import { X, Circle, Code2, Columns, Map as SidebarRight, WrapText, Wand2, Sun, Moon, ChevronRight } from 'lucide-react';

export default function EditorPanel() {
    const { state, dispatch } = useApp();
    const [isSplit, setIsSplit] = useState(false);
    const [splitFileIndex, setSplitFileIndex] = useState(-1);
    const [editorSettings, setEditorSettings] = useState({
        theme: 'vs-dark',
        minimap: true,
        wordWrap: 'on'
    });
    
    const editorRefMain = useRef(null);
    const editorRefSplit = useRef(null);

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

    // Handle keyboard shortcut Ctrl+S inside Monaco
    const handleEditorMountMain = useCallback((editor, monaco) => {
        editorRefMain.current = editor;
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            handleSave();
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
        <div className="flex-1 flex flex-col bg-studio-editor overflow-hidden">
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
                    <button onClick={() => setIsSplit(!isSplit)} className={`p-1.5 rounded hover:bg-white/10 ${isSplit ? 'text-studio-accent bg-studio-accent/10' : 'text-studio-text-muted hover:text-studio-text'}`} title="Split Editor Right">
                        <Columns className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

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
                                    fontSize: 14,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                                    minimap: { enabled: editorSettings.minimap, scale: 1 },
                                    scrollBeyondLastLine: false,
                                    renderLineHighlight: 'all',
                                    cursorBlinking: 'smooth',
                                    smoothScrolling: true,
                                    padding: { top: 8 },
                                    lineNumbers: 'on',
                                    wordWrap: editorSettings.wordWrap,
                                    bracketPairColorization: { enabled: true },
                                    autoClosingBrackets: 'always',
                                    formatOnPaste: true,
                                    suggestOnTriggerCharacters: true,
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
                                        fontSize: 14,
                                        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                                        minimap: { enabled: editorSettings.minimap, scale: 1 },
                                        scrollBeyondLastLine: false,
                                        renderLineHighlight: 'all',
                                        cursorBlinking: 'smooth',
                                        smoothScrolling: true,
                                        padding: { top: 8 },
                                        lineNumbers: 'on',
                                        wordWrap: editorSettings.wordWrap,
                                        bracketPairColorization: { enabled: true },
                                        autoClosingBrackets: 'always',
                                        formatOnPaste: true,
                                        suggestOnTriggerCharacters: true,
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
