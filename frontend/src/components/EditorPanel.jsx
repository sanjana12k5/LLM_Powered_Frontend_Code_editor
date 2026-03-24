import React, { useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useApp } from '../context/AppContext';
import { X, Circle, Code2 } from 'lucide-react';

export default function EditorPanel() {
    const { state, dispatch } = useApp();
    const activeFile = state.openFiles[state.activeFileIndex];

    const handleEditorChange = useCallback((value) => {
        if (state.activeFileIndex >= 0) {
            dispatch({
                type: 'UPDATE_FILE_CONTENT',
                payload: { index: state.activeFileIndex, content: value }
            });
        }
    }, [state.activeFileIndex, dispatch]);

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
    const handleEditorMount = useCallback((editor, monaco) => {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            handleSave();
        });
    }, [handleSave]);

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

    return (
        <div className="flex-1 flex flex-col bg-studio-editor overflow-hidden">
            {/* Tabs */}
            <div className="flex bg-studio-surface border-b border-studio-border overflow-x-auto"
                style={{ scrollbarWidth: 'none' }}>
                {state.openFiles.map((file, index) => (
                    <div
                        key={file.path}
                        onClick={() => dispatch({ type: 'SET_ACTIVE_FILE', payload: index })}
                        className={`group flex items-center gap-2 px-3 py-2 cursor-pointer border-r border-studio-border min-w-0 shrink-0 transition-colors ${index === state.activeFileIndex
                                ? 'bg-studio-tab-active border-t-2 border-t-blue-500 text-studio-text'
                                : 'bg-studio-tab text-studio-text-muted hover:bg-studio-surface-hover hover:text-studio-text border-t-2 border-t-transparent'
                            }`}
                    >
                        <span className="text-xs truncate max-w-[120px]">{file.name}</span>
                        {file.modified && (
                            <Circle className="w-2 h-2 fill-blue-400 text-blue-400 shrink-0" />
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                dispatch({ type: 'CLOSE_FILE', payload: index });
                            }}
                            className="ml-1 p-0.5 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden">
                {activeFile && (
                    <Editor
                        key={activeFile.path}
                        height="100%"
                        language={activeFile.language}
                        value={activeFile.content}
                        onChange={handleEditorChange}
                        onMount={handleEditorMount}
                        theme="vs-dark"
                        options={{
                            fontSize: 14,
                            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                            minimap: { enabled: true, scale: 1 },
                            scrollBeyondLastLine: false,
                            renderLineHighlight: 'all',
                            cursorBlinking: 'smooth',
                            smoothScrolling: true,
                            padding: { top: 8 },
                            lineNumbers: 'on',
                            wordWrap: 'on',
                            bracketPairColorization: { enabled: true },
                            autoClosingBrackets: 'always',
                            formatOnPaste: true,
                            suggestOnTriggerCharacters: true,
                        }}
                    />
                )}
            </div>
        </div>
    );
}
