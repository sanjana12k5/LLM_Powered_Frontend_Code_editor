import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Terminal, Trash2, ChevronDown, ChevronUp, PlayCircle, StopCircle } from 'lucide-react';

export default function TerminalPanel() {
    const { state } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [output, setOutput] = useState('');
    const [command, setCommand] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const outputRef = useRef(null);

    useEffect(() => {
        if (!window.electronAPI) return;

        const cleanup = window.electronAPI.onTerminalOutput((data) => {
            setOutput((prev) => prev + data);
            setIsOpen(true);
            if (data.includes('[Process exited')) {
                setIsRunning(false);
            }
        });

        return cleanup;
    }, []);

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output, isOpen]);

    const handleRunCommand = async (e) => {
        if (e.key === 'Enter' && command.trim()) {
            const cmd = command.trim();
            setCommand('');
            setOutput((prev) => prev + `\n$ ${cmd}\n`);
            
            try {
                const res = await window.electronAPI.runCommand(cmd, state.projectPath);
                if (res.stdout) setOutput((prev) => prev + res.stdout);
                if (res.stderr) setOutput((prev) => prev + res.stderr);
                if (res.error) setOutput((prev) => prev + `Error: ${res.error}\n`);
            } catch (err) {
                setOutput((prev) => prev + `Failed to execute: ${err.message}\n`);
            }
        }
    };

    const handleClear = () => setOutput('');

    const toggleTerminal = () => setIsOpen(!isOpen);

    const killProcess = () => {
        if (window.electronAPI) {
            window.electronAPI.killTerminalProcess();
            setIsRunning(false);
            setOutput((prev) => prev + '\n[Process killed manually]\n');
        }
    };

    return (
        <div className="flex flex-col border-t border-studio-border bg-studio-surface">
            {/* Terminal Header */}
            <div 
                className="flex items-center justify-between px-3 py-1.5 cursor-pointer bg-studio-surface hover:bg-studio-surface-hover transition-colors select-none"
                onClick={toggleTerminal}
            >
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-studio-text-muted" />
                    <span className="text-xs text-studio-text uppercase tracking-wider font-semibold">Terminal</span>
                </div>
                <div className="flex items-center gap-2">
                    {isRunning && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); killProcess(); }}
                            className="p-1 hover:bg-white/10 rounded text-red-400 group relative"
                            title="Stop long-running process"
                        >
                            <StopCircle className="w-4 h-4" />
                        </button>
                    )}
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleClear(); }}
                        className="p-1 hover:bg-white/10 rounded text-studio-text-muted"
                        title="Clear output"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-studio-text-muted" />
                    ) : (
                        <ChevronUp className="w-4 h-4 text-studio-text-muted" />
                    )}
                </div>
            </div>

            {/* Terminal Content */}
            {isOpen && (
                <div className="flex flex-col h-48 sm:h-64 border-t border-studio-border">
                    <div 
                        ref={outputRef}
                        className="flex-1 p-2 overflow-y-auto font-mono text-xs whitespace-pre-wrap text-[#d4d4d4]"
                        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace" }}
                    >
                        {output || <span className="text-studio-text-muted/50 italic">Terminal ready. Type a command below...</span>}
                    </div>
                    <div className="flex items-center border-t border-studio-border px-2 py-1 bg-[#1e1e1e]">
                        <span className="text-blue-400 font-mono text-xs mr-2">$</span>
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
                </div>
            )}
        </div>
    );
}
