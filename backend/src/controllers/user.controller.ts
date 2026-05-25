import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const currentUserId = req.user?.userId;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        location: true,
        website: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            tweets: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if current user follows this user
    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    res.json({
      user: {
        ...user,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        tweetsCount: user._count.tweets,
        isFollowing,
        isOwnProfile: currentUserId === user.id,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

export const getFollowers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const { cursor, limit = config.pagination.defaultLimit } = req.query;
    const currentUserId = req.user?.userId;

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const followers = await prisma.follow.findMany({
      where: { followingId: user.id },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            name: true,
            bio: true,
            avatar: true,
        location: true,
        website: true,
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

    const hasMore = followers.length > Number(limit);
    const followerList = hasMore ? followers.slice(0, -1) : followers;
    const nextCursor = hasMore ? followerList[followerList.length - 1]?.id : null;

    // Check which followers the current user follows
    let followingIds: string[] = [];
    if (currentUserId) {
      const currentUserFollowing = await prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: followerList.map((f) => f.follower.id) },
        },
        select: { followingId: true },
      });
      followingIds = currentUserFollowing.map((f) => f.followingId);
    }

    res.json({
      users: followerList.map((f) => ({
        ...f.follower,
        isFollowing: followingIds.includes(f.follower.id),
        isOwnProfile: currentUserId === f.follower.id,
      })),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Failed to get followers' });
  }
};

export const getFollowing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const { cursor, limit = config.pagination.defaultLimit } = req.query;
    const currentUserId = req.user?.userId;

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            name: true,
            bio: true,
            avatar: true,
        location: true,
        website: true,
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

    const hasMore = following.length > Number(limit);
    const followingList = hasMore ? following.slice(0, -1) : following;
    const nextCursor = hasMore ? followingList[followingList.length - 1]?.id : null;

    // Check which users the current user follows
    let currentFollowingIds: string[] = [];
    if (currentUserId) {
      const currentUserFollowing = await prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: followingList.map((f) => f.following.id) },
        },
        select: { followingId: true },
      });
      currentFollowingIds = currentUserFollowing.map((f) => f.followingId);
    }

    res.json({
      users: followingList.map((f) => ({
        ...f.following,
        isFollowing: currentFollowingIds.includes(f.following.id),
        isOwnProfile: currentUserId === f.following.id,
      })),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Failed to get following' });
  }
};
