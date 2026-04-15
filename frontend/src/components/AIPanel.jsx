import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import {
    Bot, Send, AlertTriangle, AlertCircle, Info,
    CheckCircle2, Copy, Loader2,
    ChevronDown, ChevronRight, Sparkles, Zap, Code2,
    Bug, Lightbulb, Trash2, FileCode, Wand
} from 'lucide-react';

const QUICK_ACTIONS = [
    { icon: Zap, label: 'Explain Code', prompt: 'Explain this code in simple terms:' },
    { icon: Bug, label: 'Find Bugs', prompt: 'Find potential bugs or issues in:' },
    { icon: Code2, label: 'Refactor', prompt: 'Refactor this code for better performance:' },
    { icon: Lightbulb, label: 'Suggest Improvements', prompt: 'Suggest improvements for:' },
];

function TypingIndicator() {
    return (
        <div className="flex items-center gap-2 animate-fade-in">
            <div className="p-1.5 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg">
                <Bot className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl rounded-tl-sm px-3 py-2">
                <div className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
            </div>
        </div>
    );
}

function CodeBlock({ code, language = 'javascript' }) {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mt-3 rounded-lg border border-studio-border/50 overflow-hidden bg-studio-bg/50">
            <div className="flex items-center justify-between px-3 py-1.5 bg-studio-surface/50 border-b border-studio-border/30">
                <span className="text-[10px] text-studio-text-muted font-mono flex items-center gap-1">
                    <FileCode className="w-3 h-3" />
                    {language}
                </span>
                <button
                    onClick={handleCopy}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Copy code"
                >
                    {copied ? <CheckCircle2 className="w-3 h-3 text-studio-success" /> : <Copy className="w-3 h-3 text-studio-text-muted" />}
                </button>
            </div>
            <pre className="p-3 text-[11px] font-mono text-studio-text overflow-x-auto whitespace-pre-wrap">
                <code>{code}</code>
            </pre>
        </div>
    );
}

function IssueItem({ issue, onGetFix }) {
    const [expanded, setExpanded] = useState(false);
    const severityConfig = {
        error: { icon: AlertCircle, color: 'text-studio-error', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Error' },
        warning: { icon: AlertTriangle, color: 'text-studio-warning', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Warning' },
        info: { icon: Info, color: 'text-studio-info', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Info' },
    };
    const sev = severityConfig[issue.severity] || severityConfig.info;
    const SevIcon = sev.icon;

    return (
        <div className={`${sev.bg} ${sev.border} rounded-lg border overflow-hidden`}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-start gap-2 p-3 text-left hover:bg-white/5 transition-colors"
            >
                <div className={`p-1 ${sev.bg} rounded ${sev.color}`}>
                    <SevIcon className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-studio-text font-medium">{issue.message}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${sev.bg} ${sev.color}`}>
                            {sev.label}
                        </span>
                    </div>
                    <p className="text-[10px] text-studio-text-muted">
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
                        <Wand className="w-3 h-3" />
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

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (message.role === 'system' && message.issues) {
        return (
            <div className="animate-slide-up">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-yellow-500/20 rounded-lg">
                        <AlertTriangle className="w-3.5 h-3.5 text-studio-warning" />
                    </div>
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
                <div className="max-w-[85%]">
                    <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/20 border border-blue-500/20 rounded-xl rounded-tr-sm px-3 py-2">
                        <p className="text-xs text-studio-text leading-relaxed">{message.content}</p>
                    </div>
                    <p className="text-[9px] text-studio-text-muted mt-1 text-right">
                        {formatTime(message.timestamp)}
                    </p>
                </div>
            </div>
        );
    }

    // AI response
    return (
        <div className="animate-slide-up">
            <div className="flex items-start gap-2">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="bg-gradient-to-br from-white/5 to-white/0 border border-white/5 rounded-xl rounded-tl-sm p-3">
                        <p className="text-xs text-studio-text leading-relaxed whitespace-pre-wrap">
                            {message.content}
                        </p>

                        {message.fixedCode && (
                            <div className="mt-3">
                                <CodeBlock code={message.fixedCode} language={message.language || 'javascript'} />

                                {message.fixFile && (
                                    <button
                                        onClick={() => handleApplyFix(message.fixFile, message.fixedCode)}
                                        className="mt-3 flex items-center gap-2 px-4 py-2 bg-studio-success/20 text-studio-success rounded-lg text-xs hover:bg-studio-success/30 transition-colors w-full justify-center"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Apply Fix to {message.fixFile.split(/[\\/]/).pop()}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <p className="text-[9px] text-studio-text-muted mt-1 ml-1">
                        {formatTime(message.timestamp)}
                    </p>
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

    const handleQuickAction = (action) => {
        const activeFile = state.openFiles[state.activeFileIndex];
        if (activeFile) {
            setInput(`${action.prompt}\n\n\`\`\`${activeFile.language}\n${activeFile.content.slice(0, 500)}...\n\`\`\``);
        } else {
            setInput(action.prompt);
        }
    };

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
                    language: activeFile?.language,
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

    const clearChat = () => {
        dispatch({ type: 'ADD_AI_MESSAGE', payload: { role: 'system', content: 'Chat cleared', timestamp: new Date().toISOString() } });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 border-b border-studio-border bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-studio-text">AI Assistant</h3>
                            <p className="text-[10px] text-studio-text-muted">Powered by AI</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {state.issues.length > 0 && (
                            <span className="px-2 py-1 bg-red-500/20 text-studio-error rounded-full text-[10px] font-medium flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {state.issues.length} issues
                            </span>
                        )}
                        <button 
                            onClick={clearChat}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-studio-text-muted hover:text-studio-text transition-colors"
                            title="Clear chat"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="px-3 py-2 border-b border-studio-border bg-studio-surface/50">
                <p className="text-[10px] text-studio-text-muted mb-2">Quick Actions</p>
                <div className="flex flex-wrap gap-1.5">
                    {QUICK_ACTIONS.map((action, i) => (
                        <button
                            key={i}
                            onClick={() => handleQuickAction(action)}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-lg text-[10px] text-studio-text-muted hover:text-studio-text transition-all"
                        >
                            <action.icon className="w-3 h-3" />
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {state.aiMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="relative">
                            <div className="p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl mb-4">
                                <Bot className="w-10 h-10 text-purple-400" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                                <Zap className="w-3 h-3 text-white" />
                            </div>
                        </div>
                        <h4 className="text-sm font-semibold text-studio-text mb-1">AI Assistant</h4>
                        <p className="text-xs text-studio-text-muted/70 leading-relaxed max-w-[200px]">
                            Run analysis to detect issues, or use quick actions to get help with your code.
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-[10px] text-studio-text-muted/50">
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span>
                            AI is ready
                        </div>
                    </div>
                ) : (
                    state.aiMessages.map((msg, i) => (
                        <AIMessage key={i} message={msg} />
                    ))
                )}
                {state.aiLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-3 border-t border-studio-border bg-gradient-to-t from-studio-surface to-transparent">
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask AI about your code..."
                        className="w-full bg-studio-bg/80 backdrop-blur-sm border border-studio-border/50 rounded-xl px-4 py-3 pr-12 text-xs text-studio-text placeholder-studio-text-muted/50 focus:outline-none focus:border-studio-accent/50 focus:ring-1 focus:ring-studio-accent/20 resize-none transition-all"
                        rows={2}
                    />
                    <button
                        onClick={handleSend}
                        disabled={state.aiLoading || !input.trim()}
                        className="absolute right-2 bottom-2 p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                    >
                        {state.aiLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </div>
                <p className="text-[9px] text-studio-text-muted/50 mt-2 text-center">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
