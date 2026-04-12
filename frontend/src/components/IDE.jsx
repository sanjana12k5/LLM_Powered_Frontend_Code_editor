import React from 'react';
import TopBar from './TopBar';
import FileExplorer from './FileExplorer';
import EditorPanel from './EditorPanel';
import AIPanel from './AIPanel';
import StatusBar from './StatusBar';
import TerminalPanel from './TerminalPanel';
import CollaborationPanel from './CollaborationPanel';
import { Bot, Users } from 'lucide-react';
import { useState } from 'react';

export default function IDE() {
    const [rightPanelTab, setRightPanelTab] = useState('collab'); // 'collab' or 'ai'

    return (
        <div id="ide-root" className="h-screen flex flex-col bg-studio-bg">
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

                {/* Right Panel */}
                <div className="w-80 min-w-[260px] max-w-[500px] border-l border-studio-border flex flex-col bg-studio-surface resize-x overflow-auto"
                    style={{ resize: 'horizontal', direction: 'rtl' }}>
                    <div style={{ direction: 'ltr' }} className="flex flex-col h-full">
                        <div className="flex border-b border-studio-border bg-studio-surface shrink-0">
                            <button
                                onClick={() => setRightPanelTab('collab')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                                    rightPanelTab === 'collab' 
                                        ? 'text-studio-text border-b-2 border-studio-accent' 
                                        : 'text-studio-text-muted hover:text-studio-text hover:bg-studio-surface-hover'
                                }`}
                            >
                                <Users className="w-4 h-4" />
                                Collab
                            </button>
                            <button
                                onClick={() => setRightPanelTab('ai')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                                    rightPanelTab === 'ai' 
                                        ? 'text-studio-text border-b-2 border-studio-accent' 
                                        : 'text-studio-text-muted hover:text-studio-text hover:bg-studio-surface-hover'
                                }`}
                            >
                                <Bot className="w-4 h-4" />
                                AI Assistant
                            </button>
                        </div>
                        {rightPanelTab === 'ai' ? <AIPanel /> : <CollaborationPanel />}
                    </div>
                </div>
            </div>
            <StatusBar />
        </div>
    );
}
