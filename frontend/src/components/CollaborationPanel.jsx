import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { socket } from '../socket';
import { Send, Camera, UserPlus, Users, Image as ImageIcon, Activity, Link as LinkIcon } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function CollaborationPanel() {
    const { state, dispatch } = useApp();
    const [message, setMessage] = useState('');
    const [typingUsers, setTypingUsers] = useState(new Set());
    const chatEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        if (!state.collabRoomId) return;

        const handleChatMessage = (msg) => {
            dispatch({ type: 'ADD_COLLAB_MESSAGE', payload: msg });
        };

        const handleUserJoined = ({ userId }) => {
            dispatch({
                type: 'ADD_COLLAB_MESSAGE',
                payload: {
                    id: Date.now().toString(),
                    userId: 'System',
                    message: `User ${userId.substring(0, 4)} joined the room.`,
                    type: 'system',
                    timestamp: new Date().toISOString()
                }
            });
        };

        const handleUserLeft = ({ userId }) => {
            dispatch({
                type: 'ADD_COLLAB_MESSAGE',
                payload: {
                    id: Date.now().toString(),
                    userId: 'System',
                    message: `User ${userId.substring(0, 4)} left the room.`,
                    type: 'system',
                    timestamp: new Date().toISOString()
                }
            });
            setTypingUsers(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        };

        const handleTyping = ({ userId, isTyping }) => {
            setTypingUsers(prev => {
                const next = new Set(prev);
                if (isTyping) next.add(userId);
                else next.delete(userId);
                return next;
            });
        };

        socket.on('chat-message', handleChatMessage);
        socket.on('user-joined', handleUserJoined);
        socket.on('user-left', handleUserLeft);
        socket.on('typing', handleTyping);

        return () => {
            socket.off('chat-message', handleChatMessage);
            socket.off('user-joined', handleUserJoined);
            socket.off('user-left', handleUserLeft);
            socket.off('typing', handleTyping);
        };
    }, [state.collabRoomId, dispatch]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [state.collabMessages]);

    const handleSendMessage = () => {
        if (!message.trim() || !state.collabRoomId) return;
        socket.emit('chat-message', {
            roomId: state.collabRoomId,
            message: message.trim(),
            type: 'text'
        });
        socket.emit('typing', { roomId: state.collabRoomId, isTyping: false });
        setMessage('');
    };

    const handleShareScreenshot = async () => {
        if (!state.collabRoomId) return;
        try {
            dispatch({ type: 'SET_STATUS', payload: 'Capturing internal screenshot...' });
            // Capture the main IDE body using html2canvas
            const element = document.getElementById('ide-root') || document.body;
            const canvas = await html2canvas(element, { scale: 0.8 });
            const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
            
            socket.emit('chat-message', {
                roomId: state.collabRoomId,
                message: 'Shared a screenshot',
                type: 'image',
                screenshot: dataUrl
            });
            dispatch({ type: 'SET_STATUS', payload: 'Screenshot shared' });
        } catch (err) {
            console.error('Screenshot error', err);
            dispatch({ type: 'SET_STATUS', payload: 'Failed to share screenshot' });
        }
    };

    if (!state.collabRoomId) {
        return (
            <div className="flex-1 flex flex-col p-5" style={{ background: '#252526' }}>
                <div className="flex flex-col items-center justify-center text-center mb-6 mt-4">
                    <Users className="w-12 h-12 mb-4" style={{ color: '#858585' }} />
                    <h3 className="text-[14px] font-semibold mb-2" style={{ color: '#cccccc' }}>Live Share Session</h3>
                    <p className="text-[12px]" style={{ color: '#858585' }}>Collaborate in real-time with your team.</p>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-[12px] mb-1.5 font-medium" style={{ color: '#cccccc' }}>Start a New Session</label>
                        <p className="text-[11px] mb-2" style={{ color: '#858585' }}>Host a new collaboration room and invite others.</p>
                        <button 
                            onClick={() => {
                                const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
                                if (!socket.connected) socket.connect();
                                socket.emit('join-room', roomId);
                                dispatch({ type: 'SET_COLLAB_ROOM', payload: roomId });
                                dispatch({ type: 'SET_STATUS', payload: `Joined Room: ${roomId}` });
                            }}
                            className="w-full py-1.5 rounded-sm text-[12px]"
                            style={{ background: '#0e639c', color: '#ffffff' }}
                        >
                            Create Room
                        </button>
                    </div>

                    <div className="h-px w-full my-4" style={{ background: '#3c3c3c' }}></div>

                    <div>
                        <label className="block text-[12px] mb-1.5 font-medium" style={{ color: '#cccccc' }}>Join Existing Session</label>
                        <p className="text-[11px] mb-2" style={{ color: '#858585' }}>Enter a Room ID shared by your teammate.</p>
                        <input 
                            type="text" 
                            id="join-room-input"
                            placeholder="e.g. G7T2X"
                            className="vscode-input w-full rounded-sm mb-2 font-mono text-[12px]"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = e.target.value.trim().toUpperCase();
                                    if (val) {
                                        if (!socket.connected) socket.connect();
                                        socket.emit('join-room', val);
                                        dispatch({ type: 'SET_COLLAB_ROOM', payload: val });
                                        dispatch({ type: 'SET_STATUS', payload: `Joined Room: ${val}` });
                                    }
                                }
                            }}
                        />
                        <button 
                            onClick={() => {
                                const val = document.getElementById('join-room-input').value.trim().toUpperCase();
                                if (val) {
                                    if (!socket.connected) socket.connect();
                                    socket.emit('join-room', val);
                                    dispatch({ type: 'SET_COLLAB_ROOM', payload: val });
                                    dispatch({ type: 'SET_STATUS', payload: `Joined Room: ${val}` });
                                }
                            }}
                            className="w-full py-1.5 rounded-sm text-[12px]"
                            style={{ background: '#3c3c3c', color: '#cccccc' }}
                            onMouseOver={e => e.currentTarget.style.background = '#454545'}
                            onMouseOut={e => e.currentTarget.style.background = '#3c3c3c'}
                        >
                            Join Room
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-studio-surface border-l border-studio-border">
            {/* Header */}
            <div className="p-3 border-b border-studio-border bg-studio-surface-hover flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-studio-accent" />
                    <span className="text-sm font-medium">Room: {state.collabRoomId}</span>
                </div>
                <button 
                    onClick={() => {
                        socket.disconnect();
                        dispatch({ type: 'LEAVE_COLLAB_ROOM' });
                    }}
                    className="text-xs text-red-400 hover:bg-red-400/10 px-2 py-1 rounded"
                >
                    Leave
                </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {state.collabMessages.length === 0 ? (
                    <div className="text-center text-studio-text-muted text-sm mt-10">
                        Room started. Chat and screenshots will appear here.
                    </div>
                ) : (
                    state.collabMessages.map((msg, i) => {
                        const isSystem = msg.type === 'system';
                        const isMe = msg.userId === socket.id;

                        if (isSystem) {
                            return (
                                <div key={msg.id || i} className="text-center text-xs text-studio-text-muted italic">
                                    {msg.message}
                                </div>
                            );
                        }

                        return (
                            <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <span className="text-[10px] text-studio-text-muted mb-1 opacity-75">
                                    {isMe ? 'You' : `User ${msg.userId?.substring(0,4)}`} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <div className={`max-w-[85%] rounded-lg p-2.5 ${isMe ? 'bg-studio-accent/20 text-blue-100' : 'bg-studio-surface-hover text-white'}`}>
                                    {msg.type === 'image' && msg.screenshot ? (
                                        <div className="flex flex-col gap-2">
                                            <p className="text-sm">{msg.message}</p>
                                            <img src={msg.screenshot} alt="Shared Screen" className="rounded border border-studio-border max-w-full cursor-pointer hover:opacity-90" onClick={() => window.open(msg.screenshot)} />
                                        </div>
                                    ) : msg.type === 'snippet' && msg.snippetData ? (
                                        <div className="flex flex-col gap-2 w-full">
                                            <p className="text-sm font-medium">{msg.message}</p>
                                            <div className="bg-studio-bg border border-studio-border rounded p-2 text-[10px] font-mono overflow-x-auto overflow-y-auto max-h-48 text-studio-text-muted">
                                                <pre><code>{msg.snippetData.code}</code></pre>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const existingIndex = state.openFiles.findIndex(f => f.path === msg.snippetData.path);
                                                    if (existingIndex !== -1) {
                                                        dispatch({ type: 'SET_ACTIVE_FILE', payload: existingIndex });
                                                        setTimeout(() => {
                                                            dispatch({ type: 'SET_SCROLL_TARGET', payload: { path: msg.snippetData.path, line: msg.snippetData.startLine, random: Math.random() } });
                                                        }, 50);
                                                    } else {
                                                        dispatch({ type: 'SET_STATUS', payload: 'File not locally open. Open it first to jump.' });
                                                    }
                                                }}
                                                className="text-[11px] bg-studio-accent/20 px-2 py-1 rounded text-studio-accent hover:bg-studio-accent/40 self-end mt-1 transition-colors"
                                            >
                                                Jump to Code
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-sm break-words">{msg.message}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={chatEndRef} />
                {typingUsers.size > 0 && (
                    <div className="text-xs text-studio-text-muted italic flex items-center gap-2 pb-2">
                        <div className="flex gap-1 items-center justify-center">
                            <span className="w-1.5 h-1.5 bg-studio-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-studio-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-studio-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        {Array.from(typingUsers).map(u => `User ${u.substring(0,4)}`).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-studio-surface border-t border-studio-border">
                <div className="flex items-center gap-2 mb-2">
                    <button 
                        onClick={handleShareScreenshot}
                        className="px-2 py-1 flex items-center gap-1.5 text-xs bg-studio-bg hover:bg-white/5 border border-studio-border rounded text-studio-text-muted hover:text-studio-text transition-colors"
                        title="Share IDE Screenshot"
                    >
                        <Camera className="w-3.5 h-3.5" />
                        Screenshot
                    </button>
                    <button 
                        onClick={() => {
                            if (!state.collabRoomId) return;
                            const stats = `Project: ${state.projectName || 'None'}\nOpen Files: ${state.openFiles.length}\nIssues: ${state.issues.length}`;
                            socket.emit('chat-message', {
                                roomId: state.collabRoomId,
                                message: `Session Analytics:\n${stats}`,
                                type: 'text'
                            });
                        }}
                        className="px-2 py-1 flex items-center gap-1.5 text-xs bg-studio-bg hover:bg-white/5 border border-studio-border rounded text-studio-text-muted hover:text-studio-text transition-colors"
                        title="Share Analytics"
                    >
                        <Activity className="w-3.5 h-3.5 text-studio-info" />
                        Analytics
                    </button>
                    <button 
                        onClick={() => {
                            if (!state.collabRoomId) return;
                            socket.emit('chat-message', {
                                roomId: state.collabRoomId,
                                message: `Join me on my local server! http://localhost:5173`,
                                type: 'text'
                            });
                        }}
                        className="px-2 py-1 flex items-center gap-1.5 text-xs bg-studio-bg hover:bg-white/5 border border-studio-border rounded text-studio-text-muted hover:text-studio-text transition-colors"
                        title="Share Host Link"
                    >
                        <LinkIcon className="w-3.5 h-3.5 text-green-400" />
                        Host Details
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            socket.emit('typing', { roomId: state.collabRoomId, isTyping: e.target.value.length > 0 });
                            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                            typingTimeoutRef.current = setTimeout(() => {
                                socket.emit('typing', { roomId: state.collabRoomId, isTyping: false });
                            }, 2000);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 bg-studio-bg border border-studio-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-studio-accent focus:ring-1 focus:ring-studio-accent/30"
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                        className="p-2 bg-studio-accent text-white rounded-lg hover:bg-studio-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
