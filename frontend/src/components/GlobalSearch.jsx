import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, ChevronRight, ChevronDown, FileText, Replace } from 'lucide-react';

export default function GlobalSearch() {
    const { state, dispatch } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [replaceQuery, setReplaceQuery] = useState('');
    const [showReplace, setShowReplace] = useState(false);
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Mock search function since we don't have full file contexts loaded
    // In a real implementation we would make a backend call or use an electron IPC
    const performSearch = async (e) => {
        if (e.key === 'Enter' && searchQuery) {
            setIsSearching(true);
            try {
                // Mock waiting 
                await new Promise(r => setTimeout(r, 600));
                
                // If electron API is available, we could conceivably call window.electronAPI.searchFiles(state.projectPath, searchQuery)
                // For now, we'll try to find it in open files just to have *something* show up, or show a mock result
                
                const mockResults = state.openFiles
                    .filter(file => file.content.includes(searchQuery))
                    .map(file => {
                        const lines = file.content.split('\n');
                        const matches = [];
                        lines.forEach((line, i) => {
                            if (line.includes(searchQuery)) {
                                matches.push({ line: i + 1, text: line.trim() });
                            }
                        });
                        return { path: file.path, name: file.name, matches, expanded: true };
                    });

                if (mockResults.length === 0) {
                    setResults([{
                        path: 'mock/path',
                        name: 'Mock result (Search not fully implemented without backend)',
                        matches: [{ line: 1, text: 'This is a mock match for ' + searchQuery }],
                        expanded: true
                    }]);
                } else {
                    setResults(mockResults);
                }
            } finally {
                setIsSearching(false);
            }
        }
    };

    const toggleResult = (index) => {
        setResults(prev => {
            const next = [...prev];
            next[index].expanded = !next[index].expanded;
            return next;
        });
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="panel-header px-4 py-2 bg-studio-surface border-b border-studio-border">
                <span className="text-xs font-semibold text-studio-text uppercase tracking-wider">Search</span>
            </div>
            
            <div className="p-3 border-b border-studio-border space-y-2">
                <div className="relative flex items-center">
                    <div className="absolute left-2 flex items-center justify-center p-1 rounded hover:bg-white/10 cursor-pointer"
                         onClick={() => setShowReplace(!showReplace)}>
                        {showReplace ? <ChevronDown className="w-3.5 h-3.5 text-studio-text-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-studio-text-muted" />}
                    </div>
                    <div className="bg-studio-bg border border-studio-border rounded px-2 py-1 pl-8 w-full flex items-center gap-2 focus-within:border-studio-accent transition-colors">
                        <input 
                            type="text" 
                            placeholder="Search" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={performSearch}
                            className="bg-transparent border-none outline-none w-full text-xs text-studio-text placeholder-studio-text-muted"
                        />
                    </div>
                </div>

                {showReplace && (
                    <div className="relative flex items-center">
                        <div className="bg-studio-bg border border-studio-border rounded px-2 py-1 pl-8 w-full flex items-center gap-2 focus-within:border-studio-accent transition-colors">
                            <input 
                                type="text" 
                                placeholder="Replace" 
                                value={replaceQuery}
                                onChange={(e) => setReplaceQuery(e.target.value)}
                                className="bg-transparent border-none outline-none w-full text-xs text-studio-text placeholder-studio-text-muted"
                            />
                            <div className="absolute right-1 top-1 bottom-1 flex gap-1">
                                <button className="p-1 rounded hover:bg-white/10 text-studio-text-muted" title="Replace">
                                    <Replace className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto w-full">
                {isSearching ? (
                    <div className="p-4 text-center text-xs text-studio-text-muted">
                        Searching...
                    </div>
                ) : results.length === 0 ? (
                    <div className="p-4 text-center text-xs text-studio-text-muted opacity-60">
                        {searchQuery ? 'No results found' : 'Type to search'}
                    </div>
                ) : (
                    <div className="py-2">
                        {results.map((result, i) => (
                            <div key={i} className="mb-1">
                                <button 
                                    className="w-full flex items-center gap-1.5 px-3 py-1 hover:bg-studio-surface-hover text-studio-text text-sm transition-colors text-left"
                                    onClick={() => toggleResult(i)}
                                >
                                    {result.expanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-studio-text-muted" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0 text-studio-text-muted" />}
                                    <FileText className="w-3.5 h-3.5 shrink-0 text-studio-text-muted" />
                                    <span className="truncate">{result.name}</span>
                                    <span className="ml-auto text-xs text-studio-text-muted px-1.5 py-0.5 bg-studio-bg rounded-full">
                                        {result.matches.length}
                                    </span>
                                </button>
                                
                                {result.expanded && (
                                    <div className="py-1">
                                        {result.matches.map((match, j) => (
                                            <button 
                                                key={j}
                                                className="w-full flex items-start gap-2 pl-9 pr-3 py-1 hover:bg-studio-surface-hover text-left transition-colors"
                                                onClick={() => {
                                                    // Typically this would open the file and jump to line
                                                }}
                                            >
                                                <div className="mt-1 w-4 h-4 flex-shrink-0 flex items-center justify-center rounded-full bg-studio-text-muted/10">
                                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <span className="text-xs text-studio-text truncate block">{match.text}</span>
                                                    <span className="text-[10px] text-studio-text-muted">Line {match.line}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
