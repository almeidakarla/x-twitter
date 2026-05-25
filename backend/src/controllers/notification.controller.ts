import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { cursor, limit = config.pagination.defaultLimit } = req.query;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        tweet: {
          select: {
            id: true,
            content: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit) + 1,
      ...(cursor && {
        cursor: { id: cursor as string },
        skip: 1,
      }),
    });

    const hasMore = notifications.length > Number(limit);
    const notificationList = hasMore ? notifications.slice(0, -1) : notifications;
    const nextCursor = hasMore ? notificationList[notificationList.length - 1]?.id : null;

    res.json({
      notifications: notificationList,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    if (id) {
      // Mark single notification as read
      await prisma.notification.updateMany({
        where: { id, userId },
        data: { read: true },
      });
    } else {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: { userId },
        data: { read: true },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const count = await prisma.notification.count({
      where: { userId, read: false },
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

// Helper function to create notifications (used by other controllers)
export const createNotification = async (
  type: 'LIKE' | 'REPLY' | 'FOLLOW' | 'MENTION',
  userId: string,
  actorId: string,
  tweetId?: string
): Promise<void> => {
  // Don't create notification if user is the actor (self-notification)
  if (userId === actorId) return;

  try {
    await prisma.notification.create({
      data: {
        type,
        userId,
        actorId,
        ...(tweetId && { tweetId }),
      },
    });
  } catch (error) {
    console.error('Create notification error:', error);
  }
};
