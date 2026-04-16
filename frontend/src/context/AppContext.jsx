import React, { createContext, useContext, useReducer, useCallback } from 'react';

const AppContext = createContext(null);

const initialState = {
    // App state
    screen: 'welcome', // 'welcome' | 'ide'
    projectPath: null,
    projectName: '',

    // File explorer
    fileTree: [],
    expandedFolders: new Set(),

    // Editor
    openFiles: [],       // [{ path, name, content, language, modified }]
    activeFileIndex: -1,

    // AI Panel
    aiMessages: [],
    aiLoading: false,

    // Analysis
    issues: [],
    analysisRunning: false,

    // Navigation
    scrollTarget: null, // { path, line, column, randomId }

    // Status
    statusMessage: 'Ready',

    // Collaboration
    collabRoomId: null,
    collabMessages: [], // { id, userId, message, type, screenshot, timestamp }
};

function appReducer(state, action) {
    switch (action.type) {
        case 'SET_SCREEN':
            return { ...state, screen: action.payload };

        case 'SET_PROJECT': {
            return {
                ...state,
                projectPath: action.payload.path,
                projectName: action.payload.name,
                fileTree: action.payload.tree,
                screen: 'ide',
                openFiles: [],
                activeFileIndex: -1,
                issues: [],
                aiMessages: [],
            };
        }

        case 'TOGGLE_FOLDER': {
            const next = new Set(state.expandedFolders);
            if (next.has(action.payload)) {
                next.delete(action.payload);
            } else {
                next.add(action.payload);
            }
            return { ...state, expandedFolders: next };
        }

        case 'OPEN_FILE': {
            const { path, name, content, language } = action.payload;
            const existingIndex = state.openFiles.findIndex(f => f.path === path);
            if (existingIndex !== -1) {
                return { ...state, activeFileIndex: existingIndex };
            }
            const newFiles = [...state.openFiles, { path, name, content, language, modified: false }];
            return { ...state, openFiles: newFiles, activeFileIndex: newFiles.length - 1 };
        }

        case 'SET_ACTIVE_FILE':
            return { ...state, activeFileIndex: action.payload };

        case 'CLOSE_FILE': {
            const newFiles = state.openFiles.filter((_, i) => i !== action.payload);
            let newIndex = state.activeFileIndex;
            if (action.payload === state.activeFileIndex) {
                newIndex = Math.min(action.payload, newFiles.length - 1);
            } else if (action.payload < state.activeFileIndex) {
                newIndex = state.activeFileIndex - 1;
            }
            return { ...state, openFiles: newFiles, activeFileIndex: newIndex };
        }

        case 'UPDATE_FILE_CONTENT': {
            const files = state.openFiles.map((f, i) =>
                i === action.payload.index ? { ...f, content: action.payload.content, modified: true } : f
            );
            return { ...state, openFiles: files };
        }

        case 'MARK_FILE_SAVED': {
            const files = state.openFiles.map((f, i) =>
                i === action.payload ? { ...f, modified: false } : f
            );
            return { ...state, openFiles: files };
        }

        case 'SET_ISSUES':
            return { ...state, issues: action.payload, analysisRunning: false };

        case 'SET_ANALYSIS_RUNNING':
            return { ...state, analysisRunning: action.payload };

        case 'ADD_AI_MESSAGE':
            return { ...state, aiMessages: [...state.aiMessages, action.payload] };

        case 'SET_AI_LOADING':
            return { ...state, aiLoading: action.payload };

        case 'SET_STATUS':
            return { ...state, statusMessage: action.payload };

        case 'APPLY_FIX': {
            const { filePath, newContent } = action.payload;
            const files = state.openFiles.map(f =>
                f.path === filePath ? { ...f, content: newContent, modified: true } : f
            );
            return { ...state, openFiles: files };
        }

        case 'GO_HOME':
            return { ...initialState };

        case 'SET_COLLAB_ROOM':
            return { ...state, collabRoomId: action.payload };

        case 'ADD_COLLAB_MESSAGE':
            return { ...state, collabMessages: [...state.collabMessages, action.payload] };

        case 'LEAVE_COLLAB_ROOM':
            return { ...state, collabRoomId: null, collabMessages: [] };

        case 'SET_SCROLL_TARGET':
            return { ...state, scrollTarget: action.payload };

        default:
            return state;
    }
}

export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
}
