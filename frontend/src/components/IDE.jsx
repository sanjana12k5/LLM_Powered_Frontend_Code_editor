import React from 'react';
import TopBar from './TopBar';
import FileExplorer from './FileExplorer';
import EditorPanel from './EditorPanel';
import AIPanel from './AIPanel';
import StatusBar from './StatusBar';
import TerminalPanel from './TerminalPanel';

export default function IDE() {
    return (
        <div className="h-screen flex flex-col bg-studio-bg">
            <TopBar />
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - File Explorer */}
                <div className="w-64 min-w-[200px] max-w-[400px] border-r border-studio-border flex flex-col bg-studio-surface resize-x overflow-auto"
                    style={{ resize: 'horizontal' }}>
                    <FileExplorer />
                </div>

                {/* Center Panel - Editor */}
                <div className="flex-1 flex flex-col min-w-[300px] overflow-hidden">
                    <EditorPanel />
                    <TerminalPanel />
                </div>

                {/* Right Panel - AI Assistant */}
                <div className="w-80 min-w-[260px] max-w-[500px] border-l border-studio-border flex flex-col bg-studio-surface resize-x overflow-auto"
                    style={{ resize: 'horizontal', direction: 'rtl' }}>
                    <div style={{ direction: 'ltr' }} className="flex flex-col h-full">
                        <AIPanel />
                    </div>
                </div>
            </div>
            <StatusBar />
        </div>
    );
}
