import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Search, ChevronRight, FileText, Command, Settings, Layout, Play, Moon } from 'lucide-react';

export default function CommandPalette() {
    const { state, dispatch } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState('commands'); // 'commands' or 'files'
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    // Global keyboard listener to open palette
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'p' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                setIsOpen(true);
                if (e.shiftKey) {
                    setMode('commands');
                    setQuery('>');
                } else {
                    setMode('files');
                    setQuery('');
                }
            } else if (e.key === 'F1') {
                e.preventDefault();
                setIsOpen(true);
                setMode('commands');
                setQuery('>');
            } else if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setSelectedIndex(0);
        }
    }, [isOpen, mode]);

    const handleQueryChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (val.startsWith('>')) {
            setMode('commands');
        } else {
            setMode('files');
        }
        setSelectedIndex(0);
    };

    // Flatten file tree for file search
    const flattenTree = (nodes, prefix = '') => {
        let files = [];
        for (const node of nodes) {
            if (node.type === 'directory') {
                files = files.concat(flattenTree(node.children || [], prefix + node.name + '/'));
            } else {
                files.push({ ...node, fullPathDisplay: prefix + node.name });
            }
        }
        return files;
    };

    const flatFiles = useMemo(() => flattenTree(state.fileTree), [state.fileTree]);

    // Available Commands
    const commands = useMemo(() => [
        { id: 'theme.toggle', label: 'Toggle Dark/Light Theme', icon: Moon, action: () => alert('Theme toggle action not fully wired') },
        { id: 'view.explorer', label: 'View: Show Explorer', icon: Layout, action: () => dispatch({ type: 'SET_SIDEBAR_VIEW', payload: 'explorer' }) },
        { id: 'view.search', label: 'View: Show Search', icon: Search, action: () => dispatch({ type: 'SET_SIDEBAR_VIEW', payload: 'search' }) },
        { id: 'file.saveAll', label: 'File: Save All', icon: Settings, action: () => alert('Save All triggered') },
        { id: 'analysis.run', label: 'AI: Run Code Analysis', icon: Play, action: () => alert('Analysis triggered') },
    ], [dispatch]);

    const filteredItems = useMemo(() => {
        if (mode === 'commands') {
            const parsedQuery = query.startsWith('>') ? query.slice(1).trim().toLowerCase() : query.trim().toLowerCase();
            if (!parsedQuery) return commands;
            return commands.filter(cmd => cmd.label.toLowerCase().includes(parsedQuery) || cmd.id.toLowerCase().includes(parsedQuery));
        } else {
            const parsedQuery = query.toLowerCase();
            if (!parsedQuery) return flatFiles.slice(0, 50); // Show max 50 recently/first
            return flatFiles.filter(file => file.fullPathDisplay.toLowerCase().includes(parsedQuery)).slice(0, 50);
        }
    }, [mode, query, flatFiles, commands]);

    const handleSelect = async (item) => {
        setIsOpen(false);
        if (mode === 'commands') {
            item.action();
        } else {
            // Open file
            try {
                let content = '';
                if (window.electronAPI) {
                    const result = await window.electronAPI.readFile(item.path);
                    content = result.success ? result.content : '// Failed to read file';
                }
                
                const getLanguage = (ext) => {
                    const map = { '.js': 'javascript', '.jsx': 'javascript', '.ts': 'typescript', '.tsx': 'typescript', '.css': 'css', '.json': 'json', '.html': 'html', '.md': 'markdown' };
                    return map[ext] || 'plaintext';
                };

                dispatch({
                    type: 'OPEN_FILE',
                    payload: {
                        path: item.path,
                        name: item.name,
                        content,
                        language: getLanguage(item.extension || '')
                    }
                });
            } catch(e) {
                console.error(e);
            }
        }
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredItems[selectedIndex]) {
                handleSelect(filteredItems[selectedIndex]);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-start pt-16 pointer-events-auto">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)}></div>
            
            <div className="relative w-[600px] bg-studio-surface border border-studio-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="flex items-center px-4 py-3 border-b border-studio-border bg-studio-bg">
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={query}
                        onChange={handleQueryChange}
                        onKeyDown={handleInputKeyDown}
                        placeholder={mode === 'commands' ? "Type the name of a command to run." : "Search files by name"}
                        className="w-full bg-transparent border-none outline-none text-studio-text placeholder-studio-text-muted"
                    />
                </div>
                
                <div className="overflow-y-auto max-h-[400px]">
                    {filteredItems.length === 0 ? (
                        <div className="px-4 py-4 text-sm text-studio-text-muted text-center">
                            No matching {mode === 'commands' ? 'commands' : 'files'}
                        </div>
                    ) : (
                        <ul className="py-2">
                            {filteredItems.map((item, index) => {
                                const isSelected = index === selectedIndex;
                                if (mode === 'commands') {
                                    const Icon = item.icon || Command;
                                    return (
                                        <li 
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={`px-4 py-2 flex items-center gap-3 cursor-pointer ${isSelected ? 'bg-studio-accent text-white' : 'text-studio-text hover:bg-studio-surface-hover'}`}
                                        >
                                            <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-studio-text-muted'}`} />
                                            <span className="text-sm">{item.label}</span>
                                        </li>
                                    );
                                } else {
                                    return (
                                        <li 
                                            key={item.path}
                                            onClick={() => handleSelect(item)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={`px-4 py-2 flex flex-col justify-center cursor-pointer ${isSelected ? 'bg-studio-accent text-white' : 'text-studio-text hover:bg-studio-surface-hover'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <FileText className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-studio-text-muted'}`} />
                                                <span className="text-sm font-medium">{item.name}</span>
                                            </div>
                                            <span className={`text-xs ml-6 ${isSelected ? 'text-white/80' : 'text-studio-text-muted'}`}>{item.fullPathDisplay}</span>
                                        </li>
                                    );
                                }
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
