import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import {
    Bot, Send, AlertTriangle, AlertCircle, Info,
    CheckCircle2, Copy, Wand2, Loader2, MessageSquare,
    ChevronDown, ChevronRight, Sparkles
} from 'lucide-react';

function IssueItem({ issue, onGetFix }) {
    const [expanded, setExpanded] = useState(false);
    const severityConfig = {
        error: { icon: AlertCircle, color: 'text-studio-error', bg: 'bg-red-500/10' },
        warning: { icon: AlertTriangle, color: 'text-studio-warning', bg: 'bg-yellow-500/10' },
        info: { icon: Info, color: 'text-studio-info', bg: 'bg-blue-500/10' },
    };
    const sev = severityConfig[issue.severity] || severityConfig.info;
    const SevIcon = sev.icon;

    return (
        <div className={`${sev.bg} rounded-lg border border-white/5 overflow-hidden`}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-start gap-2 p-3 text-left"
            >
                <SevIcon className={`w-4 h-4 shrink-0 mt-0.5 ${sev.color}`} />
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-studio-text leading-relaxed">{issue.message}</p>
                    <p className="text-[10px] text-studio-text-muted mt-1">
                        {issue.file}:{issue.line}
                    </p>
                </div>
                {expanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-studio-text-muted shrink-0" />
                ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-studio-text-muted shrink-0" />
                )}
            </button>
            {expanded && (
                <div className="px-3 pb-3 pt-0">
                    <button
                        onClick={() => onGetFix(issue)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-studio-accent/20 text-studio-accent rounded-md text-xs hover:bg-studio-accent/30 transition-colors"
                    >
                        <Wand2 className="w-3 h-3" />
                        Get AI Fix
                    </button>
                </div>
            )}
        </div>
    );
}

function AIMessage({ message }) {
    const { dispatch } = useApp();

    const handleApplyFix = (filePath, newContent) => {
        dispatch({
            type: 'APPLY_FIX',
            payload: { filePath, newContent }
        });
        dispatch({ type: 'SET_STATUS', payload: `Applied fix to ${filePath.split(/[\\/]/).pop()}` });
    };

    if (message.role === 'system' && message.issues) {
        return (
            <div className="animate-slide-up">
                <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-studio-warning" />
                    <span className="text-xs font-medium text-studio-text">{message.content}</span>
                </div>
                <div className="space-y-2">
                    {message.issues.map((issue, i) => (
                        <IssueItem key={i} issue={issue} onGetFix={() => { }} />
                    ))}
                </div>
            </div>
        );
    }

    if (message.role === 'user') {
        return (
            <div className="flex justify-end animate-slide-up">
                <div className="max-w-[85%] bg-blue-600/20 border border-blue-500/20 rounded-xl rounded-tr-sm px-3 py-2">
                    <p className="text-xs text-studio-text leading-relaxed">{message.content}</p>
                </div>
            </div>
        );
    }

    // AI response
    return (
        <div className="animate-slide-up">
            <div className="flex items-start gap-2">
                <div className="p-1.5 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="bg-white/5 border border-white/5 rounded-xl rounded-tl-sm px-3 py-2">
                        <p className="text-xs text-studio-text leading-relaxed whitespace-pre-wrap">
                            {message.content}
                        </p>

                        {message.fixedCode && (
                            <div className="mt-3">
                                <div className="bg-studio-bg rounded-lg border border-studio-border overflow-hidden">
                                    <div className="flex items-center justify-between px-3 py-1.5 bg-studio-surface border-b border-studio-border">
                                        <span className="text-[10px] text-studio-text-muted font-mono">
                                            {message.fixFile || 'Fixed Code'}
                                        </span>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(message.fixedCode)}
                                            className="p-1 hover:bg-white/10 rounded transition-colors"
                                            title="Copy code"
                                        >
                                            <Copy className="w-3 h-3 text-studio-text-muted" />
                                        </button>
                                    </div>
                                    <pre className="p-3 text-[11px] font-mono text-studio-text overflow-x-auto">
                                        <code>{message.fixedCode}</code>
                                    </pre>
                                </div>

                                {message.fixFile && (
                                    <button
                                        onClick={() => handleApplyFix(message.fixFile, message.fixedCode)}
                                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-studio-success/20 text-studio-success rounded-md text-xs hover:bg-studio-success/30 transition-colors"
                                    >
                                        <CheckCircle2 className="w-3 h-3" />
                                        Apply Fix
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AIPanel() {
    const { state, dispatch } = useApp();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [state.aiMessages]);

    const handleSend = async () => {
        if (!input.trim() || state.aiLoading) return;

        const userMessage = {
            role: 'user',
            content: input,
            timestamp: new Date().toISOString()
        };

        dispatch({ type: 'ADD_AI_MESSAGE', payload: userMessage });
        dispatch({ type: 'SET_AI_LOADING', payload: true });
        setInput('');

        try {
            // Get current file context
            const activeFile = state.openFiles[state.activeFileIndex];
            const context = {
                message: input,
                currentFile: activeFile ? {
                    path: activeFile.path,
                    name: activeFile.name,
                    content: activeFile.content,
                    language: activeFile.language
                } : null,
                issues: state.issues
            };

            const res = await axios.post('/api/get-ai-fix', context);

            dispatch({
                type: 'ADD_AI_MESSAGE',
                payload: {
                    role: 'assistant',
                    content: res.data.explanation || res.data.response || 'No response from AI.',
                    fixedCode: res.data.fixedCode,
                    fixFile: res.data.filePath || activeFile?.path,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (err) {
            console.error('AI request failed:', err);
            dispatch({
                type: 'ADD_AI_MESSAGE',
                payload: {
                    role: 'assistant',
                    content: 'Sorry, I encountered an error. Please check your AI API configuration in the .env file.',
                    timestamp: new Date().toISOString()
                }
            });
        } finally {
            dispatch({ type: 'SET_AI_LOADING', payload: false });
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="panel-header">
                <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>AI Assistant</span>
                </div>
                <div className="flex items-center gap-1">
                    {state.issues.length > 0 && (
                        <span className="px-1.5 py-0.5 bg-studio-error/20 text-studio-error rounded text-[10px] font-medium">
                            {state.issues.length} issues
                        </span>
                    )}
                </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {state.aiMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="p-3 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl mb-4">
                            <Bot className="w-8 h-8 text-purple-400/60" />
                        </div>
                        <h4 className="text-sm font-medium text-studio-text-muted mb-1">AI Assistant</h4>
                        <p className="text-xs text-studio-text-muted/60 leading-relaxed">
                            Run analysis to detect issues, or ask me anything about your code.
                        </p>
                    </div>
                ) : (
                    state.aiMessages.map((msg, i) => (
                        <AIMessage key={i} message={msg} />
                    ))
                )}
                {state.aiLoading && (
                    <div className="flex items-center gap-2 text-studio-text-muted animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                        <span className="text-xs">AI is thinking...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-3 border-t border-studio-border">
                <div className="flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about your code..."
                        className="flex-1 bg-studio-bg border border-studio-border rounded-lg px-3 py-2 text-xs text-studio-text placeholder-studio-text-muted/50 focus:outline-none focus:border-studio-accent/50 resize-none"
                        rows={2}
                    />
                    <button
                        onClick={handleSend}
                        disabled={state.aiLoading || !input.trim()}
                        className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 transition-all self-end"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
