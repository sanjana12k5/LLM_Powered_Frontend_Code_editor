import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Terminal as TerminalIcon, Trash2, ChevronDown, ChevronUp, StopCircle, MessageSquareWarning, Braces } from 'lucide-react';

export default function BottomPanel() {
    const { state } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('terminal'); // 'terminal', 'output', 'problems'
    
    // Terminal State
    const [output, setOutput] = useState('');
    const [command, setCommand] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [currentPath, setCurrentPath] = useState('');
    const outputRef = useRef(null);

    useEffect(() => {
        if (!window.electronAPI) return;

        const cleanup = window.electronAPI.onTerminalOutput((data) => {
            setOutput((prev) => prev + data);
            setIsOpen(true);
            setActiveTab('terminal');
            if (data.includes('[Process exited')) {
                setIsRunning(false);
            }
        });

        return cleanup;
    }, []);

    useEffect(() => {
        if (state.projectPath && !currentPath) {
            setCurrentPath(state.projectPath);
        }
    }, [state.projectPath, currentPath]);

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output, isOpen, activeTab]);

    const handleRunCommand = async (e) => {
        if (e.key === 'Enter' && command.trim()) {
            const cmd = command.trim();
            setCommand('');
            
            const displayPath = currentPath || state.projectPath || '~';
            setOutput((prev) => prev + `\n${displayPath}> ${cmd}\n`);
            
            try {
                const activePath = currentPath || state.projectPath;
                const res = await window.electronAPI.runCommand(cmd, activePath);
                
                if (res.stdout) setOutput((prev) => prev + res.stdout);
                if (res.stderr) setOutput((prev) => prev + res.stderr);
                if (res.error) setOutput((prev) => prev + `Error: ${res.error}\n`);
                if (res.cwd) setCurrentPath(res.cwd);
            } catch (err) {
                setOutput((prev) => prev + `Failed to execute: ${err.message}\n`);
            }
        }
    };

    const handleClear = () => {
        if (activeTab === 'terminal') setOutput('');
    };

    const togglePanel = () => setIsOpen(!isOpen);

    const killProcess = () => {
        if (window.electronAPI) {
            window.electronAPI.killTerminalProcess();
            setIsRunning(false);
            setOutput((prev) => prev + '\n[Process killed manually]\n');
        }
    };

    return (
        <div className="flex flex-col border-t border-studio-border bg-studio-surface z-20">
            {/* Panel Tabs / Header */}
            <div className="flex items-center justify-between px-3 cursor-pointer bg-studio-surface select-none">
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => { setActiveTab('problems'); setIsOpen(true); }}
                        className={`px-3 py-2 text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors ${activeTab === 'problems' && isOpen ? 'border-studio-accent text-studio-text' : 'border-transparent text-studio-text-muted hover:text-studio-text'}`}
                    >
                        Problems
                        {state.issues && state.issues.length > 0 && (
                            <span className="ml-2 bg-studio-accent/20 text-studio-accent px-1.5 py-0.5 rounded-full text-[10px]">
                                {state.issues.length}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => { setActiveTab('output'); setIsOpen(true); }}
                        className={`px-3 py-2 text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors ${activeTab === 'output' && isOpen ? 'border-studio-accent text-studio-text' : 'border-transparent text-studio-text-muted hover:text-studio-text'}`}
                    >
                        Output
                    </button>
                    <button 
                        onClick={() => { setActiveTab('terminal'); setIsOpen(true); }}
                        className={`px-3 py-2 text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'terminal' && isOpen ? 'border-studio-accent text-studio-text' : 'border-transparent text-studio-text-muted hover:text-studio-text'}`}
                    >
                        Terminal
                    </button>
                </div>
                
                <div className="flex items-center gap-1 py-1">
                    {activeTab === 'terminal' && isRunning && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); killProcess(); }}
                            className="p-1 hover:bg-white/10 rounded text-red-400 group relative"
                            title="Stop process"
                        >
                            <StopCircle className="w-4 h-4" />
                        </button>
                    )}
                    {(activeTab === 'terminal' || activeTab === 'output') && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleClear(); }}
                            className="p-1 hover:bg-white/10 rounded text-studio-text-muted hover:text-studio-text"
                            title="Clear"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                    <button 
                        onClick={(e) => { e.stopPropagation(); togglePanel(); }}
                        className="p-1 hover:bg-white/10 rounded text-studio-text-muted hover:text-studio-text ml-2"
                        title={isOpen ? "Collapse Panel" : "Expand Panel"}
                    >
                        {isOpen ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronUp className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* Panel Content */}
            {isOpen && (
                <div className="flex flex-col h-48 sm:h-64 border-t border-studio-border bg-studio-editor">
                    {activeTab === 'terminal' && (
                        <>
                            <div 
                                ref={outputRef}
                                className="flex-1 p-2 overflow-y-auto font-mono text-xs whitespace-pre-wrap text-[#d4d4d4]"
                                style={{ fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace" }}
                            >
                                {output || <span className="text-studio-text-muted/50 italic">Terminal ready. Type a command below...</span>}
                            </div>
                            <div className="flex items-center border-t border-studio-border px-2 py-1 bg-[#1e1e1e]">
                                <span className="text-blue-400 font-mono text-xs mr-2 truncate max-w-[50%]" title={currentPath || state.projectPath || '~'}>
                                    {currentPath || state.projectPath || '~'}&gt;
                                </span>
                                <input
                                    type="text"
                                    value={command}
                                    onChange={(e) => setCommand(e.target.value)}
                                    onKeyDown={handleRunCommand}
                                    disabled={!state.projectPath && !window.electronAPI}
                                    placeholder={state.projectPath ? "Enter command..." : "Open a project to run commands"}
                                    className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-white placeholder-studio-text-muted/50"
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'output' && (
                        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-studio-text-muted">
                            {/* Typically output from language servers, extensions, etc. */}
                            <span className="italic opacity-50">No output available.</span>
                        </div>
                    )}

                    {activeTab === 'problems' && (
                        <div className="flex-1 overflow-y-auto">
                            {!state.issues || state.issues.length === 0 ? (
                                <div className="p-4 text-xs text-studio-text-muted flex items-center justify-center h-full flex-col gap-2 opacity-50">
                                    <MessageSquareWarning className="w-8 h-8" />
                                    <span>No problems have been detected in the workspace.</span>
                                </div>
                            ) : (
                                <div className="py-2">
                                    {state.issues.map((issue, idx) => (
                                        <div key={idx} className="flex items-start gap-2 px-4 py-2 hover:bg-studio-surface text-xs text-studio-text transition-colors">
                                            <div className="w-4 h-4 mt-0.5 shrink-0 flex items-center justify-center rounded-full bg-red-400/20 text-red-400 font-bold text-[10px]">!</div>
                                            <div className="flex-1">
                                                <div className="font-medium text-studio-text">{issue.message || 'Issue detected'}</div>
                                                <div className="text-studio-text-muted mt-1 opacity-70 flex gap-2">
                                                    <span>{issue.file || 'Unknown file'}</span>
                                                    {issue.line && <span>Line {issue.line}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
