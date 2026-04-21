import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    Folder, FolderOpen, FileCode2, FileText, FileType,
    ChevronRight, ChevronDown, Search, FilePlus2, FolderPlus, RefreshCw,
    MoreHorizontal, Trash2, Copy, Pencil, Minimize2
} from 'lucide-react';

const FILE_ICONS = {
    '.js': { icon: FileCode2, color: '#e8ab53' },
    '.jsx': { icon: FileCode2, color: '#00d8ff' },
    '.ts': { icon: FileCode2, color: '#3178c6' },
    '.tsx': { icon: FileCode2, color: '#3178c6' },
    '.html': { icon: FileType, color: '#e44d26' },
    '.css': { icon: FileText, color: '#563d7c' },
    '.json': { icon: FileText, color: '#5bb775' },
    '.md': { icon: FileText, color: '#858585' },
    '.py': { icon: FileCode2, color: '#3572a5' },
    '.env': { icon: FileText, color: '#858585' },
};

function getFileIcon(extension) {
    return FILE_ICONS[extension] || { icon: FileText, color: '#858585' };
}

function getLanguage(extension) {
    const map = {
        '.js': 'javascript', '.jsx': 'javascript', '.ts': 'typescript', '.tsx': 'typescript',
        '.html': 'html', '.css': 'css', '.json': 'json', '.md': 'markdown',
        '.txt': 'plaintext', '.yml': 'yaml', '.yaml': 'yaml', '.env': 'plaintext', '.py': 'python',
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

    const paddingLeft = depth * 12 + 12;

    if (node.type === 'directory') {
        return (
            <div>
                <button
                    onClick={handleClick}
                    onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, node); }}
                    className="w-full flex items-center gap-1 h-[22px] text-[13px] transition-colors"
                    style={{ 
                        paddingLeft: `${paddingLeft}px`,
                        color: '#cccccc',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#2a2d2e'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    {isExpanded ? (
                        <ChevronDown className="w-[16px] h-[16px] shrink-0" style={{ color: '#858585' }} />
                    ) : (
                        <ChevronRight className="w-[16px] h-[16px] shrink-0" style={{ color: '#858585' }} />
                    )}
                    {isExpanded ? (
                        <FolderOpen className="w-[16px] h-[16px] shrink-0" style={{ color: '#dcb67a' }} />
                    ) : (
                        <Folder className="w-[16px] h-[16px] shrink-0" style={{ color: '#dcb67a' }} />
                    )}
                    <span className="truncate ml-0.5">{node.name}</span>
                </button>
                {isExpanded && node.children && (
                    <div>
                        {node.children
                            .sort((a, b) => {
                                if (a.type === b.type) return a.name.localeCompare(b.name);
                                return a.type === 'directory' ? -1 : 1;
                            })
                            .map((child) => (
                                <FileTreeNode key={child.path} node={child} depth={depth + 1} onContextMenu={onContextMenu} />
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
            className="w-full flex items-center gap-1 h-[22px] text-[13px] transition-colors"
            style={{ 
                paddingLeft: `${paddingLeft + 16}px`,
                color: '#cccccc',
                background: isActive ? '#04395e' : 'transparent',
            }}
            onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = '#2a2d2e'; }}
            onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
        >
            <Icon className="w-[16px] h-[16px] shrink-0" style={{ color }} />
            <span className="truncate ml-0.5">{node.name}</span>
        </button>
    );
}

export default function FileExplorer() {
    const { state, dispatch } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, node: null });
    const [sectionOpen, setSectionOpen] = useState({ explorer: true, outline: false, timeline: false });
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
        <div className="flex flex-col h-full" style={{ background: '#252526' }}>
            {/* Sidebar Title */}
            <div 
                className="flex items-center justify-between px-5 h-[35px] shrink-0"
                style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '1px', textTransform: 'uppercase', color: '#bbbbbb' }}
            >
                <span>Explorer</span>
                <div className="flex gap-0.5">
                    <button onClick={handleCreateFile} className="p-1 rounded-sm hover:bg-white/10" title="New File">
                        <FilePlus2 className="w-4 h-4" style={{ color: '#858585' }} />
                    </button>
                    <button onClick={handleCreateFolder} className="p-1 rounded-sm hover:bg-white/10" title="New Folder">
                        <FolderPlus className="w-4 h-4" style={{ color: '#858585' }} />
                    </button>
                    <button onClick={reloadProject} className="p-1 rounded-sm hover:bg-white/10" title="Refresh Explorer">
                        <RefreshCw className="w-4 h-4" style={{ color: '#858585' }} />
                    </button>
                    <button className="p-1 rounded-sm hover:bg-white/10" title="Collapse Folders">
                        <Minimize2 className="w-4 h-4" style={{ color: '#858585' }} />
                    </button>
                </div>
            </div>

            {/* Collapsible Section: Project Files */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <button
                    onClick={() => setSectionOpen(s => ({ ...s, explorer: !s.explorer }))}
                    className="flex items-center gap-1 px-2 h-[22px] text-[11px] font-bold uppercase shrink-0 w-full text-left"
                    style={{ background: '#252526', color: '#bbbbbb', borderTop: '1px solid #3c3c3c' }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#2a2d2e'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#252526'}
                >
                    {sectionOpen.explorer ? <ChevronDown className="w-[14px] h-[14px]" /> : <ChevronRight className="w-[14px] h-[14px]" />}
                    <span>{state.projectName ? state.projectName.toUpperCase() : 'NO FOLDER OPENED'}</span>
                </button>

                {sectionOpen.explorer && (
                    <div className="flex-1 overflow-y-auto">
                        {state.fileTree.length === 0 ? (
                            <div className="px-5 py-4 text-[13px]" style={{ color: '#858585' }}>
                                <p>You have not yet opened a folder.</p>
                                <button 
                                    className="mt-3 w-full py-1 rounded-sm text-[13px]"
                                    style={{ background: '#0e639c', color: '#ffffff' }}
                                    onClick={() => {/* handled by TopBar */}}
                                >
                                    Open Folder
                                </button>
                            </div>
                        ) : (
                            <div className="py-0">
                                {filteredTree
                                    .sort((a, b) => {
                                        if (a.type === b.type) return a.name.localeCompare(b.name);
                                        return a.type === 'directory' ? -1 : 1;
                                    })
                                    .map((node) => (
                                        <FileTreeNode key={node.path} node={node} onContextMenu={handleContextMenu} />
                                    ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Collapsible Section: Outline */}
            <div className="shrink-0">
                <button
                    onClick={() => setSectionOpen(s => ({ ...s, outline: !s.outline }))}
                    className="flex items-center gap-1 px-2 h-[22px] text-[11px] font-bold uppercase w-full text-left"
                    style={{ background: '#252526', color: '#bbbbbb', borderTop: '1px solid #3c3c3c' }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#2a2d2e'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#252526'}
                >
                    {sectionOpen.outline ? <ChevronDown className="w-[14px] h-[14px]" /> : <ChevronRight className="w-[14px] h-[14px]" />}
                    <span>OUTLINE</span>
                </button>
                {sectionOpen.outline && (
                    <div className="py-2 px-5 text-[12px]" style={{ color: '#858585' }}>
                        No symbols found in the active editor.
                    </div>
                )}
            </div>

            {/* Collapsible Section: Timeline */}
            <div className="shrink-0">
                <button
                    onClick={() => setSectionOpen(s => ({ ...s, timeline: !s.timeline }))}
                    className="flex items-center gap-1 px-2 h-[22px] text-[11px] font-bold uppercase w-full text-left"
                    style={{ background: '#252526', color: '#bbbbbb', borderTop: '1px solid #3c3c3c' }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#2a2d2e'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#252526'}
                >
                    {sectionOpen.timeline ? <ChevronDown className="w-[14px] h-[14px]" /> : <ChevronRight className="w-[14px] h-[14px]" />}
                    <span>TIMELINE</span>
                </button>
                {sectionOpen.timeline && (
                    <div className="py-2 px-5 text-[12px]" style={{ color: '#858585' }}>
                        The active editor cannot provide timeline information.
                    </div>
                )}
            </div>

            {/* Context Menu */}
            {contextMenu.show && (
                <div 
                    ref={contextMenuRef}
                    className="fixed py-1 rounded-md shadow-2xl z-50"
                    style={{ 
                        left: contextMenu.x, top: contextMenu.y,
                        background: '#3c3c3c',
                        border: '1px solid #454545',
                        minWidth: '160px',
                    }}
                >
                    <button onClick={handleRename} className="menu-item w-full text-left">
                        <Pencil className="w-[14px] h-[14px]" />
                        Rename
                    </button>
                    <button onClick={handleCopyPath} className="menu-item w-full text-left">
                        <Copy className="w-[14px] h-[14px]" />
                        Copy Path
                    </button>
                    <div className="my-1 mx-3" style={{ borderTop: '1px solid #555555' }}></div>
                    <button onClick={handleDeleteFile} className="menu-item w-full text-left" style={{ color: '#f14c4c' }}>
                        <Trash2 className="w-[14px] h-[14px]" />
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}
