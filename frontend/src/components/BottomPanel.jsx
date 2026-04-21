import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, ChevronDown, ChevronUp, StopCircle, X, Maximize2, Plus, MoreHorizontal } from 'lucide-react';

export default function BottomPanel() {
    const { state } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('terminal');
    
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
            if (data.includes('[Process exited')) setIsRunning(false);
        });
        return cleanup;
    }, []);

    useEffect(() => {
        if (state.projectPath && !currentPath) setCurrentPath(state.projectPath);
    }, [state.projectPath, currentPath]);

    useEffect(() => {
        if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
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

    const handleClear = () => setOutput('');
    const killProcess = () => {
        if (window.electronAPI) {
            window.electronAPI.killTerminalProcess();
            setIsRunning(false);
            setOutput((prev) => prev + '\n[Process killed manually]\n');
        }
    };

    const errorCount = state.issues?.filter(i => i.severity === 'error').length || 0;
    const warningCount = state.issues?.length || 0;

    return (
        <div className="flex flex-col shrink-0" style={{ borderTop: '1px solid #3c3c3c' }}>
            {/* Panel Tab Bar */}
            <div 
                className="flex items-center justify-between shrink-0 h-[35px]"
                style={{ background: '#1e1e1e' }}
            >
                <div className="flex items-center h-full">
                    {['problems', 'output', 'terminal', 'debug'].map(tab => {
                        const isActive = activeTab === tab && isOpen;
                        const label = tab.charAt(0).toUpperCase() + tab.slice(1);
                        const badge = tab === 'problems' && warningCount > 0 ? warningCount : null;
                        
                        return (
                            <button
                                key={tab}
                                onClick={() => {
                                    if (activeTab === tab && isOpen) {
                                        setIsOpen(false);
                                    } else {
                                        setActiveTab(tab);
                                        setIsOpen(true);
                                    }
                                }}
                                className="flex items-center gap-1 px-3 h-full text-[11px] uppercase tracking-wider font-medium transition-colors"
                                style={{
                                    color: isActive ? '#cccccc' : '#858585',
                                    borderBottom: isActive ? '1px solid #cccccc' : '1px solid transparent',
                                    borderTop: isActive ? '1px solid #1e1e1e' : '1px solid transparent',
                                }}
                                onMouseOver={e => { if (!isActive) e.currentTarget.style.color = '#cccccc'; }}
                                onMouseOut={e => { if (!isActive) e.currentTarget.style.color = '#858585'; }}
                            >
                                {label}
                                {badge && (
                                    <span 
                                        className="ml-1 px-1.5 py-0 rounded-full text-[10px]"
                                        style={{ background: '#007acc', color: '#ffffff', fontWeight: 600 }}
                                    >
                                        {badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                
                <div className="flex items-center gap-0.5 px-2">
                    {activeTab === 'terminal' && isOpen && (
                        <>
                            <button className="p-1 rounded-sm hover:bg-white/10" style={{ color: '#858585' }} title="New Terminal">
                                <Plus className="w-[14px] h-[14px]" />
                            </button>
                            {isRunning && (
                                <button onClick={killProcess} className="p-1 rounded-sm hover:bg-white/10" style={{ color: '#f14c4c' }} title="Kill Terminal">
                                    <StopCircle className="w-[14px] h-[14px]" />
                                </button>
                            )}
                            <button onClick={handleClear} className="p-1 rounded-sm hover:bg-white/10" style={{ color: '#858585' }} title="Clear">
                                <Trash2 className="w-[14px] h-[14px]" />
                            </button>
                        </>
                    )}
                    <button className="p-1 rounded-sm hover:bg-white/10" style={{ color: '#858585' }} title="Maximize Panel">
                        <Maximize2 className="w-[14px] h-[14px]" />
                    </button>
                    <button 
                        onClick={() => setIsOpen(false)} 
                        className="p-1 rounded-sm hover:bg-white/10" 
                        style={{ color: '#858585' }} 
                        title="Close Panel"
                    >
                        <X className="w-[14px] h-[14px]" />
                    </button>
                </div>
            </div>

            {/* Panel Content */}
            {isOpen && (
                <div style={{ height: '200px', background: '#1e1e1e' }}>
                    {activeTab === 'terminal' && (
                        <div className="flex flex-col h-full">
                            <div 
                                ref={outputRef}
                                className="flex-1 p-2 overflow-y-auto text-[13px] whitespace-pre-wrap"
                                style={{ fontFamily: "Consolas, 'Courier New', monospace", color: '#cccccc' }}
                            >
                                {output || <span style={{ color: '#858585' }}>Terminal ready. Type a command below...</span>}
                            </div>
                            <div className="flex items-center px-2 py-1" style={{ borderTop: '1px solid #3c3c3c' }}>
                                <span className="text-[13px] mr-2 truncate max-w-[50%]" style={{ fontFamily: "Consolas, 'Courier New', monospace", color: '#6a9955' }}>
                                    {currentPath || state.projectPath || 'PS'}&gt;
                                </span>
                                <input
                                    type="text"
                                    value={command}
                                    onChange={(e) => setCommand(e.target.value)}
                                    onKeyDown={handleRunCommand}
                                    disabled={!state.projectPath && !window.electronAPI}
                                    placeholder={state.projectPath ? "" : "Open a project first"}
                                    className="flex-1 bg-transparent border-none outline-none text-[13px]"
                                    style={{ fontFamily: "Consolas, 'Courier New', monospace", color: '#cccccc' }}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'output' && (
                        <div className="flex-1 p-3 text-[13px]" style={{ color: '#858585', fontFamily: "Consolas, 'Courier New', monospace" }}>
                            No output available.
                        </div>
                    )}

                    {activeTab === 'problems' && (
                        <div className="h-full overflow-y-auto">
                            {(!state.issues || state.issues.length === 0) ? (
                                <div className="p-3 text-[13px]" style={{ color: '#858585' }}>
                                    No problems have been detected in the workspace.
                                </div>
                            ) : (
                                <div>
                                    {state.issues.map((issue, idx) => (
                                        <div 
                                            key={idx} 
                                            className="flex items-start gap-2 px-4 h-[22px] items-center text-[13px] transition-colors cursor-pointer"
                                            style={{ color: '#cccccc' }}
                                            onMouseOver={e => e.currentTarget.style.background = '#2a2d2e'}
                                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <span style={{ color: '#f14c4c' }}>●</span>
                                            <span className="truncate">{issue.message || 'Issue detected'}</span>
                                            <span className="ml-auto" style={{ color: '#858585' }}>{issue.file || ''}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'debug' && (
                        <div className="p-3 text-[13px]" style={{ color: '#858585' }}>
                            Run and Debug console. Start a debugging session to see output here.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
