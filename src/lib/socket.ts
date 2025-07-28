import { io } from 'socket.io-client';

// const SOCKET_URL = ; // Replace with your backend URL

export const socket = io(import.meta.env.VITE_SOCKET_URL, {
  transports: ['websocket'],
  withCredentials: true
});

export const setupSocket = (userId) => {
  if (userId) {
    socket.emit('setup', { _id: userId });
  }
};
