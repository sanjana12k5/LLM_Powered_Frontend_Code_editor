import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronRight, ChevronDown, FileText, Replace } from 'lucide-react';

export default function GlobalSearch() {
    const { state } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [replaceQuery, setReplaceQuery] = useState('');
    const [showReplace, setShowReplace] = useState(false);
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const performSearch = async (e) => {
        if (e.key === 'Enter' && searchQuery) {
            setIsSearching(true);
            try {
                await new Promise(r => setTimeout(r, 400));
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
                setResults(mockResults);
            } finally {
                setIsSearching(false);
            }
        }
    };

    const toggleResult = (index) => {
        setResults(prev => {
            const next = [...prev];
            next[index] = { ...next[index], expanded: !next[index].expanded };
            return next;
        });
    };

    return (
        <div className="flex flex-col h-full" style={{ background: '#252526' }}>
            {/* Header */}
            <div 
                className="flex items-center px-5 h-[35px] shrink-0"
                style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '1px', textTransform: 'uppercase', color: '#bbbbbb' }}
            >
                Search
            </div>
            
            {/* Search Inputs */}
            <div className="px-3 pb-2 space-y-1.5">
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => setShowReplace(!showReplace)}
                        className="p-1 rounded-sm hover:bg-white/10 shrink-0"
                        style={{ color: '#858585' }}
                    >
                        {showReplace ? <ChevronDown className="w-[14px] h-[14px]" /> : <ChevronRight className="w-[14px] h-[14px]" />}
                    </button>
                    <input 
                        type="text" 
                        placeholder="Search" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={performSearch}
                        className="vscode-input flex-1 rounded-sm text-[13px]"
                    />
                </div>

                {showReplace && (
                    <div className="flex items-center gap-1 ml-6">
                        <input 
                            type="text" 
                            placeholder="Replace" 
                            value={replaceQuery}
                            onChange={(e) => setReplaceQuery(e.target.value)}
                            className="vscode-input flex-1 rounded-sm text-[13px]"
                        />
                    </div>
                )}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
                {isSearching ? (
                    <div className="p-4 text-[13px]" style={{ color: '#858585' }}>
                        Searching...
                    </div>
                ) : results.length === 0 ? (
                    <div className="p-4 text-[13px]" style={{ color: '#858585' }}>
                        {searchQuery ? 'No results found.' : 'Search across files in your workspace.'}
                    </div>
                ) : (
                    <div>
                        {results.map((result, i) => (
                            <div key={i}>
                                <button 
                                    className="w-full flex items-center gap-1 px-3 h-[22px] text-[13px] text-left"
                                    style={{ color: '#cccccc' }}
                                    onClick={() => toggleResult(i)}
                                    onMouseOver={e => e.currentTarget.style.background = '#2a2d2e'}
                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    {result.expanded ? <ChevronDown className="w-[14px] h-[14px] shrink-0" style={{ color: '#858585' }} /> : <ChevronRight className="w-[14px] h-[14px] shrink-0" style={{ color: '#858585' }} />}
                                    <FileText className="w-[14px] h-[14px] shrink-0" style={{ color: '#858585' }} />
                                    <span className="truncate">{result.name}</span>
                                    <span className="ml-auto shrink-0 text-[11px] px-1" style={{ background: '#007acc', color: '#ffffff', borderRadius: '2px' }}>
                                        {result.matches.length}
                                    </span>
                                </button>
                                
                                {result.expanded && (
                                    <div>
                                        {result.matches.map((match, j) => (
                                            <button 
                                                key={j}
                                                className="w-full pl-10 pr-3 h-[22px] text-left text-[13px] truncate"
                                                style={{ color: '#cccccc' }}
                                                onMouseOver={e => e.currentTarget.style.background = '#2a2d2e'}
                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                {match.text}
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
