import React from 'react';
import { useApp } from '../context/AppContext';
import { 
    Files, Search, GitBranch, Blocks, Settings, UserCircle, Play, Bug
} from 'lucide-react';

const ACTIVITY_ITEMS = [
    { id: 'explorer', icon: Files, title: 'Explorer (Ctrl+Shift+E)' },
    { id: 'search', icon: Search, title: 'Search (Ctrl+Shift+F)' },
    { id: 'source-control', icon: GitBranch, title: 'Source Control (Ctrl+Shift+G)' },
    { id: 'debug', icon: Bug, title: 'Run and Debug (Ctrl+Shift+D)' },
    { id: 'extensions', icon: Blocks, title: 'Extensions (Ctrl+Shift+X)' },
];

export default function ActivityBar() {
    const { state, dispatch } = useApp();

    const handleViewChange = (view) => {
        if (state.activeSidebarView === view) {
            // Toggle sidebar off (VS Code behavior)
            dispatch({ type: 'SET_SIDEBAR_VIEW', payload: '' });
        } else {
            dispatch({ type: 'SET_SIDEBAR_VIEW', payload: view });
        }
    };

    return (
        <div 
            className="w-[48px] h-full flex flex-col items-center shrink-0 select-none"
            style={{ 
                background: '#333333',
                WebkitAppRegion: 'no-drag'
            }}
        >
            {/* Top icons */}
            <div className="flex flex-col w-full">
                {ACTIVITY_ITEMS.map(({ id, icon: Icon, title }) => {
                    const isActive = state.activeSidebarView === id;
                    return (
                        <button 
                            key={id}
                            onClick={() => handleViewChange(id)}
                            className="relative w-full h-[48px] flex items-center justify-center transition-colors"
                            title={title}
                            style={{
                                color: isActive ? '#ffffff' : '#858585',
                            }}
                            onMouseOver={(e) => {
                                if (!isActive) e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseOut={(e) => {
                                if (!isActive) e.currentTarget.style.color = '#858585';
                            }}
                        >
                            {/* Active indicator — left white border */}
                            {isActive && (
                                <div 
                                    className="absolute left-0 top-0 bottom-0 w-[2px]"
                                    style={{ background: '#ffffff' }}
                                />
                            )}
                            <Icon className="w-[24px] h-[24px]" strokeWidth={1.5} />
                        </button>
                    );
                })}
            </div>
            
            {/* Spacer */}
            <div className="flex-1" />
            
            {/* Bottom icons */}
            <div className="flex flex-col w-full mb-1">
                <button 
                    className="w-full h-[48px] flex items-center justify-center transition-colors"
                    title="Accounts"
                    style={{ color: '#858585' }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#858585'}
                >
                    <UserCircle className="w-[24px] h-[24px]" strokeWidth={1.5} />
                </button>
                <button 
                    className="w-full h-[48px] flex items-center justify-center transition-colors"
                    title="Manage"
                    style={{ color: '#858585' }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#858585'}
                >
                    <Settings className="w-[24px] h-[24px]" strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
}
