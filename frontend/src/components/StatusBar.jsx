import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, X as XIcon, Check, GitBranch, Bell, BellOff } from 'lucide-react';

export default function StatusBar() {
    const { state } = useApp();
    const activeFile = state.openFiles[state.activeFileIndex];

    const getLanguageLabel = (lang) => {
        const labels = {
            'javascript': 'JavaScript',
            'typescript': 'TypeScript',
            'html': 'HTML',
            'css': 'CSS',
            'json': 'JSON',
            'markdown': 'Markdown',
            'plaintext': 'Plain Text',
            'yaml': 'YAML',
            'python': 'Python',
        };
        return labels[lang] || lang || 'Plain Text';
    };

    const errorCount = state.issues?.filter(i => i.severity === 'error').length || 0;
    const warningCount = state.issues?.length || 0;

    return (
        <div 
            className="flex items-center justify-between px-2 select-none shrink-0"
            style={{ 
                background: state.collabRoomId ? '#388a34' : '#007acc', 
                height: '22px',
                fontSize: '12px',
                color: '#ffffff',
            }}
        >
            {/* Left side */}
            <div className="flex items-center gap-0">
                {/* Branch */}
                <button className="flex items-center gap-1 px-1.5 h-full hover:bg-white/10 transition-colors">
                    <GitBranch className="w-[14px] h-[14px]" />
                    <span>main</span>
                </button>

                {/* Errors & Warnings */}
                <button className="flex items-center gap-1 px-1.5 h-full hover:bg-white/10 transition-colors">
                    <XIcon className="w-[14px] h-[14px]" />
                    <span>{errorCount}</span>
                    <AlertTriangle className="w-[14px] h-[14px] ml-1" />
                    <span>{warningCount}</span>
                </button>

                {state.collabRoomId && (
                    <button className="flex items-center gap-1 px-1.5 h-full hover:bg-white/10 transition-colors">
                        <span>Room: {state.collabRoomId}</span>
                    </button>
                )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-0">
                {activeFile ? (
                    <>
                        <button className="flex items-center gap-1 px-1.5 h-full hover:bg-white/10 transition-colors">
                            <span>Ln 1, Col 1</span>
                        </button>
                        <button className="flex items-center gap-1 px-1.5 h-full hover:bg-white/10 transition-colors">
                            <span>Spaces: 4</span>
                        </button>
                        <button className="flex items-center gap-1 px-1.5 h-full hover:bg-white/10 transition-colors">
                            <span>UTF-8</span>
                        </button>
                        <button className="flex items-center gap-1 px-1.5 h-full hover:bg-white/10 transition-colors">
                            <span>CRLF</span>
                        </button>
                        <button className="flex items-center gap-1 px-1.5 h-full hover:bg-white/10 transition-colors">
                            <span>{getLanguageLabel(activeFile.language)}</span>
                        </button>
                    </>
                ) : null}
                <button className="flex items-center gap-1 px-1.5 h-full hover:bg-white/10 transition-colors">
                    <Bell className="w-[14px] h-[14px]" />
                </button>
            </div>
        </div>
    );
}
