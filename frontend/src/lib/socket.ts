import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const connectSocket = (token: string): void => {
  const s = getSocket();

  if (!s.connected) {
    s.connect();
    s.emit('authenticate', token);
  }
};

export const disconnectSocket = (): void => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

export const subscribeToUser = (username: string): void => {
  getSocket().emit('subscribe:user', username);
};

export const unsubscribeFromUser = (username: string): void => {
  getSocket().emit('unsubscribe:user', username);
};

export const subscribeToTweet = (tweetId: string): void => {
  getSocket().emit('subscribe:tweet', tweetId);
};

export const unsubscribeFromTweet = (tweetId: string): void => {
  getSocket().emit('unsubscribe:tweet', tweetId);
};
