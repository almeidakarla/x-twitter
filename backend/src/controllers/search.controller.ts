import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, limit = 20 } = req.query;
    const currentUserId = req.user?.userId;
    const searchQuery = String(q).trim();

    if (!searchQuery) {
      res.json({ users: [] });
      return;
    }

    // Search users by name or username
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: searchQuery, mode: 'insensitive' } },
          { name: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      orderBy: {
        followers: { _count: 'desc' },
      },
      take: Number(limit),
    });

    // Check which users the current user follows
    let followingIds: string[] = [];
    if (currentUserId) {
      const currentUserFollowing = await prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: users.map((u) => u.id) },
        },
        select: { followingId: true },
      });
      followingIds = currentUserFollowing.map((f) => f.followingId);
    }

    res.json({
      users: users.map((user) => ({
        ...user,
        followersCount: user._count.followers,
        isFollowing: followingIds.includes(user.id),
        isOwnProfile: currentUserId === user.id,
      })),
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};
