import React from 'react';
import { useApp } from '../context/AppContext';
import { 
    Files, Search, GitBranch, Blocks, Settings, UserCircle
} from 'lucide-react';

export default function ActivityBar() {
    const { state, dispatch } = useApp();

    const handleViewChange = (view) => {
        dispatch({ type: 'SET_SIDEBAR_VIEW', payload: view });
        // If clicking the active view, we could potentially toggle the sidebar entirely (hide it),
        // but for now, we'll just switch to it. 
        // Adding toggling logic would go here.
    };

    return (
        <div className="w-12 h-full bg-studio-bg border-r border-studio-border flex flex-col items-center py-2 shrink-0 select-none z-10" style={{ WebkitAppRegion: 'no-drag' }}>
            <div className="flex flex-col gap-2 w-full">
                <button 
                    onClick={() => handleViewChange('explorer')}
                    className={`relative w-full h-12 flex items-center justify-center transition-colors ${state.activeSidebarView === 'explorer' ? 'text-studio-text' : 'text-studio-text-muted hover:text-studio-text'}`}
                    title="Explorer"
                >
                    {state.activeSidebarView === 'explorer' && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-studio-accent rounded-r"></div>}
                    <Files className="w-6 h-6" strokeWidth={state.activeSidebarView === 'explorer' ? 2 : 1.5} />
                </button>
                <button 
                    onClick={() => handleViewChange('search')}
                    className={`relative w-full h-12 flex items-center justify-center transition-colors ${state.activeSidebarView === 'search' ? 'text-studio-text' : 'text-studio-text-muted hover:text-studio-text'}`}
                    title="Search"
                >
                    {state.activeSidebarView === 'search' && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-studio-accent rounded-r"></div>}
                    <Search className="w-6 h-6" strokeWidth={state.activeSidebarView === 'search' ? 2 : 1.5} />
                </button>
                <button 
                    onClick={() => handleViewChange('source-control')}
                    className={`relative w-full h-12 flex items-center justify-center transition-colors ${state.activeSidebarView === 'source-control' ? 'text-studio-text' : 'text-studio-text-muted hover:text-studio-text'}`}
                    title="Source Control"
                >
                    {state.activeSidebarView === 'source-control' && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-studio-accent rounded-r"></div>}
                    <GitBranch className="w-6 h-6" strokeWidth={state.activeSidebarView === 'source-control' ? 2 : 1.5} />
                </button>
                <button 
                    onClick={() => handleViewChange('extensions')}
                    className={`relative w-full h-12 flex items-center justify-center transition-colors ${state.activeSidebarView === 'extensions' ? 'text-studio-text' : 'text-studio-text-muted hover:text-studio-text'}`}
                    title="Extensions"
                >
                    {state.activeSidebarView === 'extensions' && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-studio-accent rounded-r"></div>}
                    <Blocks className="w-6 h-6" strokeWidth={state.activeSidebarView === 'extensions' ? 2 : 1.5} />
                </button>
            </div>
            
            <div className="flex-1"></div>
            
            <div className="flex flex-col gap-2 w-full mt-auto">
                <button 
                    className="w-full h-12 flex items-center justify-center text-studio-text-muted hover:text-studio-text transition-colors"
                    title="Accounts"
                >
                    <UserCircle className="w-6 h-6" strokeWidth={1.5} />
                </button>
                <button 
                    className="w-full h-12 flex items-center justify-center text-studio-text-muted hover:text-studio-text transition-colors"
                    title="Manage"
                >
                    <Settings className="w-6 h-6" strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
}
