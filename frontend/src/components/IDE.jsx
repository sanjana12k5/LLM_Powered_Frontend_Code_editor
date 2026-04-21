import React from 'react';
import TopBar from './TopBar';
import FileExplorer from './FileExplorer';
import EditorPanel from './EditorPanel';
import AIPanel from './AIPanel';
import StatusBar from './StatusBar';
import BottomPanel from './BottomPanel';
import CollaborationPanel from './CollaborationPanel';
import ActivityBar from './ActivityBar';
import GlobalSearch from './GlobalSearch';
import CommandPalette from './CommandPalette';
import { useApp } from '../context/AppContext';
import { Bot, Users, MessageSquare, Settings as SettingsIcon, Search, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function IDE() {
    const { state } = useApp();
    const [rightPanelTab, setRightPanelTab] = useState('ai'); // 'collab' or 'ai'

    const showSidebar = state.activeSidebarView !== '';

    return (
        <div id="ide-root" className="h-screen flex flex-col" style={{ background: '#1e1e1e' }}>
            <TopBar />
            <div className="flex-1 flex overflow-hidden">
                {/* Activity Bar */}
                <ActivityBar />

                {/* Primary Side Bar */}
                {showSidebar && (
                    <div 
                        className="flex flex-col overflow-hidden shrink-0"
                        style={{ 
                            width: '260px', 
                            minWidth: '170px', 
                            maxWidth: '500px',
                            background: '#252526',
                            borderRight: '1px solid #3c3c3c',
                            resize: 'horizontal',
                            overflow: 'auto',
                        }}
                    >
                        {state.activeSidebarView === 'explorer' && <FileExplorer />}
                        {state.activeSidebarView === 'search' && <GlobalSearch />}
                        {state.activeSidebarView === 'source-control' && (
                            <div className="flex flex-col h-full">
                                <div className="px-5 h-[35px] flex items-center shrink-0" style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '1px', textTransform: 'uppercase', color: '#bbbbbb' }}>
                                    Source Control
                                </div>
                                <div className="flex-1 flex items-center justify-center px-5 text-center" style={{ color: '#858585', fontSize: '13px' }}>
                                    <div>
                                        <p>In order to use Git features, you can open a folder containing a Git repository.</p>
                                        <button className="mt-3 py-1 px-4 rounded-sm text-[13px]" style={{ background: '#0e639c', color: '#ffffff' }}>
                                            Open Folder
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {state.activeSidebarView === 'debug' && (
                            <div className="flex flex-col h-full">
                                <div className="px-5 h-[35px] flex items-center shrink-0" style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '1px', textTransform: 'uppercase', color: '#bbbbbb' }}>
                                    Run and Debug
                                </div>
                                <div className="flex-1 flex items-center justify-center px-5 text-center" style={{ color: '#858585', fontSize: '13px' }}>
                                    <p>To customize Run and Debug, open a folder and create a launch.json file.</p>
                                </div>
                            </div>
                        )}
                        {state.activeSidebarView === 'extensions' && (
                            <div className="flex flex-col h-full">
                                <div className="px-5 h-[35px] flex items-center justify-between shrink-0" style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '1px', textTransform: 'uppercase', color: '#bbbbbb' }}>
                                    <span>Extensions</span>
                                </div>
                                <div className="px-3 pb-2">
                                    <input 
                                        type="text"
                                        placeholder="Search Extensions in Marketplace"
                                        className="vscode-input w-full rounded-sm text-[13px]"
                                    />
                                </div>
                                <div className="flex-1 flex items-center justify-center px-5 text-center" style={{ color: '#858585', fontSize: '13px' }}>
                                    <p>No extensions installed.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Center Panel — Editor + Bottom Panel */}
                <div className="flex-1 flex flex-col min-w-[300px] overflow-hidden">
                    <EditorPanel />
                    <BottomPanel />
                </div>

                {/* Right Panel — Secondary Side Bar */}
                <div 
                    className="flex flex-col overflow-hidden shrink-0"
                    style={{ 
                        width: '320px',
                        minWidth: '200px',
                        maxWidth: '500px',
                        background: '#252526',
                        borderLeft: '1px solid #3c3c3c',
                        resize: 'horizontal',
                    }}
                >
                    {/* Tab Headers */}
                    <div className="flex shrink-0" style={{ borderBottom: '1px solid #3c3c3c', background: '#252526' }}>
                        <button
                            onClick={() => setRightPanelTab('ai')}
                            className="flex-1 flex items-center justify-center gap-1.5 h-[35px] text-[11px] uppercase tracking-wider font-semibold transition-colors"
                            style={{
                                color: rightPanelTab === 'ai' ? '#cccccc' : '#858585',
                                borderBottom: rightPanelTab === 'ai' ? '1px solid #cccccc' : '1px solid transparent',
                            }}
                            onMouseOver={(e) => { if (rightPanelTab !== 'ai') e.currentTarget.style.color = '#cccccc'; }}
                            onMouseOut={(e) => { if (rightPanelTab !== 'ai') e.currentTarget.style.color = '#858585'; }}
                        >
                            <Bot className="w-[14px] h-[14px]" />
                            Chat
                        </button>
                        <button
                            onClick={() => setRightPanelTab('collab')}
                            className="flex-1 flex items-center justify-center gap-1.5 h-[35px] text-[11px] uppercase tracking-wider font-semibold transition-colors"
                            style={{
                                color: rightPanelTab === 'collab' ? '#cccccc' : '#858585',
                                borderBottom: rightPanelTab === 'collab' ? '1px solid #cccccc' : '1px solid transparent',
                            }}
                            onMouseOver={(e) => { if (rightPanelTab !== 'collab') e.currentTarget.style.color = '#cccccc'; }}
                            onMouseOut={(e) => { if (rightPanelTab !== 'collab') e.currentTarget.style.color = '#858585'; }}
                        >
                            <Users className="w-[14px] h-[14px]" />
                            Sessions
                        </button>
                    </div>

                    {/* Panel Tools */}
                    <div className="flex items-center gap-1 px-3 py-1 shrink-0" style={{ borderBottom: '1px solid #3c3c3c' }}>
                        <div className="flex-1">
                            <span className="text-[11px]" style={{ color: '#858585' }}>
                                {rightPanelTab === 'ai' ? '● AI Assistant' : '● Collaboration'}
                            </span>
                        </div>
                        <button className="p-0.5 rounded-sm hover:bg-white/10" style={{ color: '#858585' }}>
                            <RefreshCw className="w-[14px] h-[14px]" />
                        </button>
                        <button className="p-0.5 rounded-sm hover:bg-white/10" style={{ color: '#858585' }}>
                            <SettingsIcon className="w-[14px] h-[14px]" />
                        </button>
                    </div>

                    {/* Panel Content */}
                    <div className="flex-1 overflow-hidden">
                        {rightPanelTab === 'ai' ? <AIPanel /> : <CollaborationPanel />}
                    </div>
                </div>
            </div>
            <StatusBar />
            <CommandPalette />
        </div>
    );
}
