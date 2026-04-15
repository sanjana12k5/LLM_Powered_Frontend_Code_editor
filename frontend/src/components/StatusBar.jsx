import React from 'react';
import { useApp } from '../context/AppContext';
import { Circle, AlertTriangle, Check, Code, FileCode, GitBranch, Keyboard } from 'lucide-react';

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
            'java': 'Java',
            'csharp': 'C#',
            'cpp': 'C++',
        };
        return labels[lang] || lang;
    };

    return (
        <div className="flex items-center justify-between px-3 py-1 bg-gradient-to-r from-studio-accent/90 to-purple-600/90 text-white text-[11px] select-none h-6">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                    <Circle className="w-2 h-2 fill-green-400 text-green-400" />
                    <span className="max-w-[200px] truncate">{state.statusMessage}</span>
                </span>
                {state.issues.length > 0 && (
                    <span className="flex items-center gap-1 text-yellow-300">
                        <AlertTriangle className="w-3 h-3" />
                        {state.issues.length} issue{state.issues.length !== 1 ? 's' : ''}
                    </span>
                )}
                {state.collabRoomId && (
                    <span className="flex items-center gap-1 text-green-300">
                        <GitBranch className="w-3 h-3" />
                        {state.collabRoomId}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-4">
                {activeFile ? (
                    <>
                        <span className="flex items-center gap-1">
                            <Code className="w-3 h-3" />
                            Ln {1}, Col {1}
                        </span>
                        <span className="flex items-center gap-1">
                            <FileCode className="w-3 h-3" />
                            {getLanguageLabel(activeFile.language)}
                        </span>
                        <span>UTF-8</span>
                        <span>Spaces: 4</span>
                    </>
                ) : null}
                <span className="flex items-center gap-1 opacity-75">
                    <Keyboard className="w-3 h-3" />
                    Ctrl+S Save
                </span>
                <span className="flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    AI Diagnostic Studio
                </span>
            </div>
        </div>
    );
}
