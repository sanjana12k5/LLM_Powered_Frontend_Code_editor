import React from 'react';
import { useApp } from '../context/AppContext';
import { Circle } from 'lucide-react';

export default function StatusBar() {
    const { state } = useApp();
    const activeFile = state.openFiles[state.activeFileIndex];

    return (
        <div className="flex items-center justify-between px-3 py-1 bg-gradient-to-r from-blue-700 to-indigo-700 text-white text-[11px] select-none">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                    <Circle className="w-2 h-2 fill-green-400 text-green-400" />
                    {state.statusMessage}
                </span>
                {state.issues.length > 0 && (
                    <span className="flex items-center gap-1">
                        ⚠ {state.issues.length} issue{state.issues.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-4">
                {activeFile && (
                    <>
                        <span>{activeFile.language}</span>
                        <span>UTF-8</span>
                    </>
                )}
                <span>AI Diagnostic Studio</span>
            </div>
        </div>
    );
}
