import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getSocket, reconnectSocket, onReconnect } from '../socket';
import { Send, Camera, Users, Activity, Link as LinkIcon, Wifi, Globe, Copy, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';

// Get local LAN IPs (only works in Electron/Node context, returns empty in browser)
function getLocalIPs() {
    try {
        if (typeof window !== 'undefined' && window.require) {
            const os = window.require('os');
            const interfaces = os.networkInterfaces();
            const ips = [];
            for (const name of Object.keys(interfaces)) {
                for (const iface of interfaces[name]) {
                    if (iface.family === 'IPv4' && !iface.internal) {
                        ips.push(iface.address);
                    }
                }
            }
            return ips;
        }
    } catch (e) { /* not in electron */ }
    return [];
}

export default function CollaborationPanel() {
    const { state, dispatch } = useApp();
    const [message, setMessage] = useState('');
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [serverAddress, setServerAddress] = useState('');
    const [connectionMode, setConnectionMode] = useState('local'); // 'local' or 'remote'
    const [copied, setCopied] = useState(false);
    // Use a counter to force re-render when socket changes
    const [socketVersion, setSocketVersion] = useState(0);
    const chatEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Get LAN IP for sharing
    const lanIPs = getLocalIPs();
    const myLanAddress = lanIPs.length > 0 ? `${lanIPs[0]}:3001` : null;

    // Listen for socket reconnections to force re-render
    useEffect(() => {
        const unsubscribe = onReconnect(() => {
            setSocketVersion(v => v + 1);
        });
        return unsubscribe;
    }, []);

    // Set up socket event listeners
    useEffect(() => {
        if (!state.collabRoomId) return;
        const sock = getSocket();

        console.log('[Collab] Setting up listeners on socket:', sock.id, 'connected:', sock.connected);

        const handleChatMessage = (msg) => {
            console.log('[Collab] Received chat message:', msg);
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

        sock.on('chat-message', handleChatMessage);
        sock.on('user-joined', handleUserJoined);
        sock.on('user-left', handleUserLeft);
        sock.on('typing', handleTyping);

        return () => {
            sock.off('chat-message', handleChatMessage);
            sock.off('user-joined', handleUserJoined);
            sock.off('user-left', handleUserLeft);
            sock.off('typing', handleTyping);
        };
    }, [state.collabRoomId, dispatch, socketVersion]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [state.collabMessages]);

    const connectAndJoinRoom = (roomId, targetUrl = null) => {
        let sock;
        if (targetUrl) {
            // Connect to a remote server
            const fullUrl = targetUrl.startsWith('http') ? targetUrl : `http://${targetUrl}`;
            sock = reconnectSocket(fullUrl);
        } else {
            sock = getSocket();
        }

        console.log('[Collab] Connecting socket to:', targetUrl || 'localhost', 'for room:', roomId);

        if (!sock.connected) sock.connect();
        
        // Wait for connection before joining room
        const doJoin = () => {
            console.log('[Collab] Socket connected, joining room:', roomId, 'socket.id:', sock.id);
            sock.emit('join-room', roomId);
            dispatch({ type: 'SET_COLLAB_ROOM', payload: roomId });
            dispatch({ type: 'SET_STATUS', payload: `Joined Room: ${roomId}${targetUrl ? ` on ${targetUrl}` : ''}` });
        };

        if (sock.connected) {
            doJoin();
        } else {
            sock.once('connect', doJoin);
            sock.once('connect_error', (err) => {
                console.error('[Collab] Connection error:', err);
                dispatch({ type: 'SET_STATUS', payload: `Connection failed: ${err.message}` });
            });
        }
    };

    const handleSendMessage = () => {
        if (!message.trim() || !state.collabRoomId) return;
        const sock = getSocket();
        console.log('[Collab] Sending message, socket connected:', sock.connected, 'room:', state.collabRoomId);
        sock.emit('chat-message', {
            roomId: state.collabRoomId,
            message: message.trim(),
            type: 'text'
        });
        sock.emit('typing', { roomId: state.collabRoomId, isTyping: false });
        setMessage('');
    };

    const handleShareScreenshot = async () => {
        if (!state.collabRoomId) return;
        const sock = getSocket();
        try {
            dispatch({ type: 'SET_STATUS', payload: 'Capturing internal screenshot...' });
            const element = document.getElementById('ide-root') || document.body;
            const canvas = await html2canvas(element, { scale: 0.8 });
            const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
            
            sock.emit('chat-message', {
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

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!state.collabRoomId) {
        return (
            <div className="flex-1 flex flex-col p-5" style={{ background: '#252526' }}>
                <div className="flex flex-col items-center justify-center text-center mb-6 mt-4">
                    <Users className="w-12 h-12 mb-4" style={{ color: '#858585' }} />
                    <h3 className="text-[14px] font-semibold mb-2" style={{ color: '#cccccc' }}>Live Share Session</h3>
                    <p className="text-[12px]" style={{ color: '#858585' }}>Collaborate in real-time with your team.</p>
                </div>
                
                {/* Connection Mode Toggle */}
                <div className="flex gap-1 mb-4 p-1 rounded" style={{ background: '#1e1e1e' }}>
                    <button
                        onClick={() => setConnectionMode('local')}
                        className={`flex-1 py-1.5 rounded text-[11px] flex items-center justify-center gap-1.5 transition-colors ${
                            connectionMode === 'local' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                        }`}
                        style={{ background: connectionMode === 'local' ? '#0e639c' : 'transparent' }}
                    >
                        <Wifi className="w-3 h-3" />
                        Local Host
                    </button>
                    <button
                        onClick={() => setConnectionMode('remote')}
                        className={`flex-1 py-1.5 rounded text-[11px] flex items-center justify-center gap-1.5 transition-colors ${
                            connectionMode === 'remote' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                        }`}
                        style={{ background: connectionMode === 'remote' ? '#0e639c' : 'transparent' }}
                    >
                        <Globe className="w-3 h-3" />
                        Join Remote
                    </button>
                </div>

                <div className="space-y-4">
                    {connectionMode === 'local' ? (
                        <>
                            {/* Show LAN IP for sharing */}
                            {myLanAddress && (
                                <div className="p-3 rounded border" style={{ background: '#1e1e1e', borderColor: '#3c3c3c' }}>
                                    <p className="text-[10px] mb-1.5 font-medium" style={{ color: '#858585' }}>Your LAN Address (share with teammates):</p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-[12px] font-mono px-2 py-1 rounded" style={{ background: '#2d2d2d', color: '#4ec9b0' }}>
                                            {myLanAddress}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard(myLanAddress)}
                                            className="p-1 hover:bg-white/10 rounded transition-colors"
                                            title="Copy address"
                                        >
                                            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" style={{ color: '#858585' }} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[12px] mb-1.5 font-medium" style={{ color: '#cccccc' }}>Start a New Session</label>
                                <p className="text-[11px] mb-2" style={{ color: '#858585' }}>Host a new collaboration room and invite others.</p>
                                <button 
                                    onClick={() => {
                                        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
                                        connectAndJoinRoom(roomId);
                                    }}
                                    className="w-full py-1.5 rounded-sm text-[12px]"
                                    style={{ background: '#0e639c', color: '#ffffff' }}
                                >
                                    Create Room
                                </button>
                            </div>

                            <div className="h-px w-full my-4" style={{ background: '#3c3c3c' }}></div>

                            <div>
                                <label className="block text-[12px] mb-1.5 font-medium" style={{ color: '#cccccc' }}>Join Local Room</label>
                                <p className="text-[11px] mb-2" style={{ color: '#858585' }}>Enter a Room ID (on your own backend).</p>
                                <input 
                                    type="text" 
                                    id="join-room-input"
                                    placeholder="e.g. G7T2X"
                                    className="vscode-input w-full rounded-sm mb-2 font-mono text-[12px]"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.target.value.trim().toUpperCase();
                                            if (val) connectAndJoinRoom(val);
                                        }
                                    }}
                                />
                                <button 
                                    onClick={() => {
                                        const val = document.getElementById('join-room-input').value.trim().toUpperCase();
                                        if (val) connectAndJoinRoom(val);
                                    }}
                                    className="w-full py-1.5 rounded-sm text-[12px]"
                                    style={{ background: '#3c3c3c', color: '#cccccc' }}
                                    onMouseOver={e => e.currentTarget.style.background = '#454545'}
                                    onMouseOut={e => e.currentTarget.style.background = '#3c3c3c'}
                                >
                                    Join Room
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Remote connection mode */}
                            <div>
                                <label className="block text-[12px] mb-1.5 font-medium" style={{ color: '#cccccc' }}>Server Address</label>
                                <p className="text-[11px] mb-2" style={{ color: '#858585' }}>Enter the host's LAN IP address (e.g., 192.168.1.5:3001)</p>
                                <input 
                                    type="text" 
                                    value={serverAddress}
                                    onChange={(e) => setServerAddress(e.target.value)}
                                    placeholder="e.g. 192.168.1.5:3001"
                                    className="vscode-input w-full rounded-sm mb-3 font-mono text-[12px]"
                                />
                            </div>

                            <div>
                                <label className="block text-[12px] mb-1.5 font-medium" style={{ color: '#cccccc' }}>Room ID</label>
                                <p className="text-[11px] mb-2" style={{ color: '#858585' }}>Enter the Room ID shared by the host.</p>
                                <input 
                                    type="text" 
                                    id="remote-room-input"
                                    placeholder="e.g. G7T2X"
                                    className="vscode-input w-full rounded-sm mb-2 font-mono text-[12px]"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const roomVal = e.target.value.trim().toUpperCase();
                                            const addrVal = serverAddress.trim();
                                            if (roomVal && addrVal) {
                                                connectAndJoinRoom(roomVal, addrVal);
                                            }
                                        }
                                    }}
                                />
                                <button 
                                    onClick={() => {
                                        const roomVal = document.getElementById('remote-room-input').value.trim().toUpperCase();
                                        const addrVal = serverAddress.trim();
                                        if (roomVal && addrVal) {
                                            connectAndJoinRoom(roomVal, addrVal);
                                        } else {
                                            dispatch({ type: 'SET_STATUS', payload: 'Please enter both server address and room ID' });
                                        }
                                    }}
                                    className="w-full py-1.5 rounded-sm text-[12px]"
                                    style={{ background: '#0e639c', color: '#ffffff' }}
                                    disabled={!serverAddress.trim()}
                                >
                                    Connect & Join
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    const sock = getSocket();

    return (
        <div className="flex-1 flex flex-col bg-studio-surface border-l border-studio-border">
            {/* Header */}
            <div className="p-3 border-b border-studio-border bg-studio-surface-hover flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-studio-accent" />
                    <span className="text-sm font-medium">Room: {state.collabRoomId}</span>
                    <span className={`w-2 h-2 rounded-full ${sock.connected ? 'bg-green-400' : 'bg-red-400'}`} title={sock.connected ? 'Connected' : 'Disconnected'} />
                </div>
                <button 
                    onClick={() => {
                        const sock = getSocket();
                        sock.emit('leave-room', state.collabRoomId);
                        sock.disconnect();
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
                        const isMe = msg.userId === sock.id;

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
                            const sock = getSocket();
                            const stats = `Project: ${state.projectName || 'None'}\nOpen Files: ${state.openFiles.length}\nIssues: ${state.issues.length}`;
                            sock.emit('chat-message', {
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
                    {myLanAddress && (
                        <button 
                            onClick={() => {
                                if (!state.collabRoomId) return;
                                const sock = getSocket();
                                sock.emit('chat-message', {
                                    roomId: state.collabRoomId,
                                    message: `Join my session!\nServer: ${myLanAddress}\nRoom: ${state.collabRoomId}`,
                                    type: 'text'
                                });
                            }}
                            className="px-2 py-1 flex items-center gap-1.5 text-xs bg-studio-bg hover:bg-white/5 border border-studio-border rounded text-studio-text-muted hover:text-studio-text transition-colors"
                            title="Share Host Details"
                        >
                            <LinkIcon className="w-3.5 h-3.5 text-green-400" />
                            Host Details
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            const sock = getSocket();
                            sock.emit('typing', { roomId: state.collabRoomId, isTyping: e.target.value.length > 0 });
                            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                            typingTimeoutRef.current = setTimeout(() => {
                                const s = getSocket();
                                s.emit('typing', { roomId: state.collabRoomId, isTyping: false });
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
