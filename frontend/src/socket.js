import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001'; // Default backend route
export const socket = io(SOCKET_URL, {
    autoConnect: false
});
