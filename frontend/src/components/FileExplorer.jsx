import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    Folder, FolderOpen, FileCode2, FileText, FileType,
    ChevronRight, ChevronDown, Search, FilePlus2, FolderPlus, RefreshCw,
    MoreVertical, Trash2, Copy, Pencil, X
} from 'lucide-react';

const FILE_ICONS = {
    '.js': { icon: FileCode2, color: 'text-yellow-400' },
    '.jsx': { icon: FileCode2, color: 'text-cyan-400' },
    '.ts': { icon: FileCode2, color: 'text-blue-400' },
    '.tsx': { icon: FileCode2, color: 'text-blue-300' },
    '.html': { icon: FileType, color: 'text-orange-400' },
    '.css': { icon: FileText, color: 'text-purple-400' },
    '.json': { icon: FileText, color: 'text-green-400' },
    '.md': { icon: FileText, color: 'text-gray-400' },
};

function getFileIcon(extension) {
    return FILE_ICONS[extension] || { icon: FileText, color: 'text-studio-text-muted' };
}

function getLanguage(extension) {
    const map = {
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.html': 'html',
        '.css': 'css',
        '.json': 'json',
        '.md': 'markdown',
        '.txt': 'plaintext',
        '.yml': 'yaml',
        '.yaml': 'yaml',
        '.env': 'plaintext',
    };
    return map[extension] || 'plaintext';
}

function filterTree(nodes, searchTerm) {
    if (!searchTerm) return nodes;
    const term = searchTerm.toLowerCase();
    
    return nodes.map(node => {
        if (node.type === 'directory') {
            const filteredChildren = filterTree(node.children || [], searchTerm);
            if (filteredChildren.length > 0 || node.name.toLowerCase().includes(term)) {
                return { ...node, children: filteredChildren };
            }
            return null;
        }
        if (node.name.toLowerCase().includes(term)) return node;
        return null;
    }).filter(Boolean);
}

function FileTreeNode({ node, depth = 0, onContextMenu }) {
    const { state, dispatch } = useApp();
    const isExpanded = state.expandedFolders.has(node.path);
    const isActive = state.openFiles[state.activeFileIndex]?.path === node.path;

    const handleClick = async () => {
        if (node.type === 'directory') {
            dispatch({ type: 'TOGGLE_FOLDER', payload: node.path });
        } else {
            try {
                let content = '';
                if (window.electronAPI) {
                    const result = await window.electronAPI.readFile(node.path);
                    content = result.success ? result.content : '// Failed to read file';
                } else {
                    content = '// File content loaded from backend';
                }

                dispatch({
                    type: 'OPEN_FILE',
                    payload: {
                        path: node.path,
                        name: node.name,
                        content,
                        language: getLanguage(node.extension || '')
                    }
                });
            } catch (err) {
                console.error('Failed to read file:', err);
            }
        }
    };

    if (node.type === 'directory') {
        return (
            <div>
                <button
                    onClick={handleClick}
                    onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, node); }}
                    className={`w-full flex items-center gap-1 px-2 py-1 hover:bg-studio-surface-hover text-sm text-studio-text-muted hover:text-studio-text transition-colors`}
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                >
                    {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    )}
                    {isExpanded ? (
                        <FolderOpen className="w-4 h-4 text-blue-400 shrink-0" />
                    ) : (
                        <Folder className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                    <span className="truncate">{node.name}</span>
                </button>
                {isExpanded && node.children && (
                    <div>
                        {node.children
                            .sort((a, b) => {
                                if (a.type === b.type) return a.name.localeCompare(b.name);
                                return a.type === 'directory' ? -1 : 1;
                            })
                            .map((child) => (
                                <FileTreeNode key={child.path} node={child} depth={depth + 1} />
                            ))}
                     </div>
                )}
            </div>
        );
    }

    const { icon: Icon, color } = getFileIcon(node.extension || '');

    return (
        <button
            onClick={handleClick}
            onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, node); }}
            className={`w-full flex items-center gap-1.5 px-2 py-1 text-sm transition-colors ${isActive
                    ? 'bg-blue-500/15 text-studio-text border-l-2 border-blue-500'
                    : 'text-studio-text-muted hover:bg-studio-surface-hover hover:text-studio-text border-l-2 border-transparent'
                }`}
            style={{ paddingLeft: `${depth * 16 + 20}px` }}
        >
            <Icon className={`w-4 h-4 shrink-0 ${color}`} />
            <span className="truncate">{node.name}</span>
        </button>
    );
}

export default function FileExplorer() {
    const { state, dispatch } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, node: null });
    const contextMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
                setContextMenu({ show: false, x: 0, y: 0, node: null });
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleContextMenu = (e, node) => {
        setContextMenu({ show: true, x: e.clientX, y: e.clientY, node });
    };

    const handleDeleteFile = async () => {
        if (!contextMenu.node || !window.electronAPI) return;
        if (confirm(`Delete ${contextMenu.node.name}?`)) {
            try {
                await window.electronAPI.deleteFile(contextMenu.node.path);
                reloadProject();
            } catch (err) {
                alert('Failed to delete: ' + err.message);
            }
        }
        setContextMenu({ show: false, x: 0, y: 0, node: null });
    };

    const handleRename = async () => {
        if (!contextMenu.node) return;
        const newName = prompt('Enter new name:', contextMenu.node.name);
        if (!newName || newName === contextMenu.node.name) return;
        
        try {
            if (window.electronAPI) {
                const separator = contextMenu.node.path.includes('\\') ? '\\' : '/';
                const newPath = contextMenu.node.path.replace(contextMenu.node.name, newName);
                await window.electronAPI.renameFile(contextMenu.node.path, newPath);
                reloadProject();
            }
        } catch (err) {
            alert('Failed to rename: ' + err.message);
        }
        setContextMenu({ show: false, x: 0, y: 0, node: null });
    };

    const handleCopyPath = async () => {
        if (!contextMenu.node) return;
        await navigator.clipboard.writeText(contextMenu.node.path);
        setContextMenu({ show: false, x: 0, y: 0, node: null });
    };

    const reloadProject = async () => {
        if (!state.projectPath || !window.electronAPI) return;
        try {
            const tree = await window.electronAPI.readDirectory(state.projectPath);
            dispatch({
                type: 'SET_PROJECT',
                payload: { path: state.projectPath, name: state.projectName, tree }
            });
        } catch (err) {
            console.error('Failed to reload project:', err);
        }
    };

    const handleCreateFile = async () => {
        if (!state.projectPath || !window.electronAPI) return;
        const name = prompt('Enter new file name:');
        if (!name) return;
        try {
            const separator = state.projectPath.includes('\\') ? '\\' : '/';
            const fullPath = `${state.projectPath}${separator}${name}`;
            await window.electronAPI.createFile(fullPath);
            reloadProject();
        } catch (err) {
            alert('Failed to create file: ' + err.message);
        }
    };

    const handleCreateFolder = async () => {
        if (!state.projectPath || !window.electronAPI) return;
        const name = prompt('Enter new folder name:');
        if (!name) return;
        try {
            const separator = state.projectPath.includes('\\') ? '\\' : '/';
            const fullPath = `${state.projectPath}${separator}${name}`;
            await window.electronAPI.createFolder(fullPath);
            reloadProject();
        } catch (err) {
            alert('Failed to create folder: ' + err.message);
        }
    };

    const filteredTree = useMemo(() => filterTree(state.fileTree, searchTerm), [state.fileTree, searchTerm]);

    return (
        <div className="flex flex-col h-full">
            <div className="panel-header flex justify-between items-center px-4 py-2 bg-studio-surface border-b border-studio-border">
                <span className="text-xs font-semibold text-studio-text uppercase tracking-wider">Explorer</span>
                <div className="flex gap-1">
                    <button onClick={handleCreateFile} className="p-1 hover:bg-white/10 rounded cursor-pointer transition-colors" title="New File">
                        <FilePlus2 className="w-3.5 h-3.5 text-studio-text-muted hover:text-studio-text" />
                    </button>
                    <button onClick={handleCreateFolder} className="p-1 hover:bg-white/10 rounded cursor-pointer transition-colors" title="New Folder">
                        <FolderPlus className="w-3.5 h-3.5 text-studio-text-muted hover:text-studio-text" />
                    </button>
                    <button onClick={reloadProject} className="p-1 hover:bg-white/10 rounded cursor-pointer transition-colors" title="Refresh">
                        <RefreshCw className="w-3.5 h-3.5 text-studio-text-muted hover:text-studio-text" />
                    </button>
                </div>
            </div>

            <div className="px-2 py-1.5 border-b border-studio-border flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-studio-text-muted shrink-0" />
                <input 
                    type="text" 
                    placeholder="Search files..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-xs text-studio-text placeholder-studio-text-muted"
                />
            </div>

            <div className="flex-1 overflow-y-auto py-1">
                {state.fileTree.length === 0 ? (
                    <div className="px-4 py-8 text-center text-studio-text-muted text-xs">
                        <Folder className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        <p>No project open</p>
                        <p className="mt-1 opacity-60">Open a project to see files</p>
                    </div>
                ) : (
                    filteredTree
                        .sort((a, b) => {
                            if (a.type === b.type) return a.name.localeCompare(b.name);
                            return a.type === 'directory' ? -1 : 1;
                        })
                        .map((node) => (
                            <FileTreeNode key={node.path} node={node} onContextMenu={handleContextMenu} />
                        ))
                )}
            </div>

            {/* Context Menu */}
            {contextMenu.show && (
                <div 
                    ref={contextMenuRef}
                    className="fixed bg-studio-surface border border-studio-border rounded-lg shadow-xl py-1 z-50 min-w-[160px]"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <button onClick={handleRename} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-studio-text hover:bg-studio-surface-hover">
                        <Pencil className="w-3.5 h-3.5" />
                        Rename
                    </button>
                    <button onClick={handleCopyPath} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-studio-text hover:bg-studio-surface-hover">
                        <Copy className="w-3.5 h-3.5" />
                        Copy Path
                    </button>
                    <div className="border-t border-studio-border my-1"></div>
                    <button onClick={handleDeleteFile} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-studio-error hover:bg-studio-surface-hover">
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}
