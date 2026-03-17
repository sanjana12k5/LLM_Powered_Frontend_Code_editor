import React from 'react';
import { useApp } from '../context/AppContext';
import {
    Folder, FolderOpen, FileCode2, FileText, FileType,
    ChevronRight, ChevronDown, Search
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

function FileTreeNode({ node, depth = 0 }) {
    const { state, dispatch } = useApp();
    const isExpanded = state.expandedFolders.has(node.path);
    const isActive = state.openFiles[state.activeFileIndex]?.path === node.path;

    const handleClick = async () => {
        if (node.type === 'directory') {
            dispatch({ type: 'TOGGLE_FOLDER', payload: node.path });
        } else {
            // Load file content
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
    const { state } = useApp();

    return (
        <div className="flex flex-col h-full">
            <div className="panel-header">
                <span>Explorer</span>
                <Search className="w-3.5 h-3.5 cursor-pointer hover:text-studio-text transition-colors" />
            </div>

            <div className="flex-1 overflow-y-auto py-1">
                {state.fileTree.length === 0 ? (
                    <div className="px-4 py-8 text-center text-studio-text-muted text-xs">
                        <Folder className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        <p>No project open</p>
                        <p className="mt-1 opacity-60">Open a project to see files</p>
                    </div>
                ) : (
                    state.fileTree
                        .sort((a, b) => {
                            if (a.type === b.type) return a.name.localeCompare(b.name);
                            return a.type === 'directory' ? -1 : 1;
                        })
                        .map((node) => (
                            <FileTreeNode key={node.path} node={node} />
                        ))
                )}
            </div>
        </div>
    );
}
