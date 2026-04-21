import { io } from 'socket.io-client';

// Default to localhost backend; can be overridden for LAN collaboration
let currentUrl = 'http://localhost:3001';
let socketInstance = io(currentUrl, { autoConnect: false });

// Event listeners that need to be re-attached after reconnect
let reconnectCallbacks = [];

export function onReconnect(callback) {
    reconnectCallbacks.push(callback);
    return () => {
        reconnectCallbacks = reconnectCallbacks.filter(cb => cb !== callback);
    };
}

// Reconnect to a different server (for cross-laptop LAN collaboration)
export function reconnectSocket(newUrl) {
    if (newUrl === currentUrl && socketInstance.connected) return socketInstance;
    
    // Disconnect existing socket
    if (socketInstance.connected) {
        socketInstance.disconnect();
    }
    
    currentUrl = newUrl;
    socketInstance = io(currentUrl, { autoConnect: false });
    
    // Notify all listeners about the new socket
    reconnectCallbacks.forEach(cb => cb(socketInstance));
    
    return socketInstance;
}

// Always returns the CURRENT socket instance (not a stale reference)
export function getSocket() {
    return socketInstance;
}

export function getServerUrl() {
    return currentUrl;
}
