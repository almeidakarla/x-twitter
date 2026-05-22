import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/auth.utils.js';

let io: Server | null = null;

// Map of userId to socket ids (a user can have multiple connections)
const userSockets = new Map<string, Set<string>>();

export const setupSocketHandlers = (socketServer: Server): void => {
  io = socketServer;

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Authenticate socket connection
    socket.on('authenticate', (token: string) => {
      try {
        const payload = verifyToken(token);
        const userId = payload.userId;

        // Store socket connection for user
        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId)!.add(socket.id);

        // Join user's personal room
        socket.join(`user:${userId}`);

        socket.data.userId = userId;
        socket.emit('authenticated', { userId });
        console.log(`User ${userId} authenticated on socket ${socket.id}`);
      } catch (error) {
        socket.emit('auth_error', { error: 'Invalid token' });
      }
    });

    // Subscribe to specific user's tweets (for profile pages)
    socket.on('subscribe:user', (username: string) => {
      socket.join(`profile:${username}`);
    });

    socket.on('unsubscribe:user', (username: string) => {
      socket.leave(`profile:${username}`);
    });

    // Subscribe to a tweet's updates (for real-time likes/replies)
    socket.on('subscribe:tweet', (tweetId: string) => {
      socket.join(`tweet:${tweetId}`);
    });

    socket.on('unsubscribe:tweet', (tweetId: string) => {
      socket.leave(`tweet:${tweetId}`);
    });

    socket.on('disconnect', () => {
      const userId = socket.data.userId;
      if (userId && userSockets.has(userId)) {
        userSockets.get(userId)!.delete(socket.id);
        if (userSockets.get(userId)!.size === 0) {
          userSockets.delete(userId);
        }
      }
      console.log('Client disconnected:', socket.id);
    });
  });
};

// Emit events
export const emitNewTweet = (tweet: any): void => {
  if (!io) return;

  // Emit to timeline (everyone following this user)
  io.emit('tweet:new', tweet);

  // Emit to user's profile page
  io.to(`profile:${tweet.author.username}`).emit('tweet:new', tweet);
};

export const emitTweetDeleted = (tweetId: string): void => {
  if (!io) return;
  io.emit('tweet:deleted', { tweetId });
};

export const emitTweetLiked = (tweetId: string, userId: string, likesCount: number): void => {
  if (!io) return;
  io.to(`tweet:${tweetId}`).emit('tweet:liked', { tweetId, userId, likesCount });
  io.emit('tweet:liked', { tweetId, userId, likesCount });
};

export const emitTweetUnliked = (tweetId: string, userId: string, likesCount: number): void => {
  if (!io) return;
  io.to(`tweet:${tweetId}`).emit('tweet:unliked', { tweetId, userId, likesCount });
  io.emit('tweet:unliked', { tweetId, userId, likesCount });
};

export const emitNewReply = (parentTweetId: string, reply: any): void => {
  if (!io) return;
  io.to(`tweet:${parentTweetId}`).emit('tweet:reply', { parentTweetId, reply });
};

export const emitNewFollower = (userId: string, follower: any): void => {
  if (!io) return;
  io.to(`user:${userId}`).emit('follow:new', { follower });
};
