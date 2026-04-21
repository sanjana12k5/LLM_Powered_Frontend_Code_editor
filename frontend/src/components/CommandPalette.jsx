import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { FileText } from 'lucide-react';

export default function CommandPalette() {
    const { state, dispatch } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState('commands');
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

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
        setMode(val.startsWith('>') ? 'commands' : 'files');
        setSelectedIndex(0);
    };

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

    const commands = useMemo(() => [
        { id: 'view.explorer', label: 'View: Show Explorer', action: () => dispatch({ type: 'SET_SIDEBAR_VIEW', payload: 'explorer' }) },
        { id: 'view.search', label: 'View: Show Search', action: () => dispatch({ type: 'SET_SIDEBAR_VIEW', payload: 'search' }) },
        { id: 'view.sourceControl', label: 'View: Show Source Control', action: () => dispatch({ type: 'SET_SIDEBAR_VIEW', payload: 'source-control' }) },
        { id: 'view.extensions', label: 'View: Show Extensions', action: () => dispatch({ type: 'SET_SIDEBAR_VIEW', payload: 'extensions' }) },
    ], [dispatch]);

    const filteredItems = useMemo(() => {
        if (mode === 'commands') {
            const parsedQuery = query.startsWith('>') ? query.slice(1).trim().toLowerCase() : query.trim().toLowerCase();
            if (!parsedQuery) return commands;
            return commands.filter(cmd => cmd.label.toLowerCase().includes(parsedQuery));
        } else {
            const parsedQuery = query.toLowerCase();
            if (!parsedQuery) return flatFiles.slice(0, 30);
            return flatFiles.filter(file => file.fullPathDisplay.toLowerCase().includes(parsedQuery)).slice(0, 30);
        }
    }, [mode, query, flatFiles, commands]);

    const handleSelect = async (item) => {
        setIsOpen(false);
        if (mode === 'commands') {
            item.action();
        } else {
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
                    payload: { path: item.path, name: item.name, content, language: getLanguage(item.extension || '') }
                });
            } catch(e) { console.error(e); }
        }
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredItems[selectedIndex]) handleSelect(filteredItems[selectedIndex]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-start pt-0">
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setIsOpen(false)} />
            
            <div 
                className="relative w-[600px] mt-0 overflow-hidden flex flex-col shadow-2xl"
                style={{ 
                    background: '#252526', 
                    border: '1px solid #3c3c3c',
                    borderTop: 'none',
                    maxHeight: '50vh',
                }}
            >
                <div className="flex items-center px-2 py-1" style={{ background: '#252526', borderBottom: '1px solid #3c3c3c' }}>
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={query}
                        onChange={handleQueryChange}
                        onKeyDown={handleInputKeyDown}
                        placeholder={mode === 'commands' ? "Type the name of a command" : "Search files by name (prefix > for commands)"}
                        className="w-full bg-transparent border-none outline-none text-[13px]"
                        style={{ color: '#cccccc' }}
                    />
                </div>
                
                <div className="overflow-y-auto">
                    {filteredItems.length === 0 ? (
                        <div className="px-3 py-3 text-[13px]" style={{ color: '#858585' }}>
                            No matching {mode === 'commands' ? 'commands' : 'files'}
                        </div>
                    ) : (
                        <div>
                            {filteredItems.map((item, index) => {
                                const isSelected = index === selectedIndex;
                                if (mode === 'commands') {
                                    return (
                                        <div 
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className="flex items-center px-3 h-[22px] cursor-pointer text-[13px]"
                                            style={{
                                                background: isSelected ? '#04395e' : 'transparent',
                                                color: isSelected ? '#ffffff' : '#cccccc',
                                            }}
                                        >
                                            {item.label}
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div 
                                            key={item.path}
                                            onClick={() => handleSelect(item)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className="flex items-center gap-2 px-3 h-[22px] cursor-pointer text-[13px]"
                                            style={{
                                                background: isSelected ? '#04395e' : 'transparent',
                                                color: isSelected ? '#ffffff' : '#cccccc',
                                            }}
                                        >
                                            <FileText className="w-[14px] h-[14px] shrink-0" style={{ color: isSelected ? '#ffffff' : '#858585' }} />
                                            <span className="truncate">{item.name}</span>
                                            <span className="ml-auto truncate text-[12px]" style={{ color: isSelected ? '#ffffff80' : '#858585' }}>{item.fullPathDisplay}</span>
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
