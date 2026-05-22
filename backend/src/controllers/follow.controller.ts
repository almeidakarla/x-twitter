import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { emitNewFollower } from '../services/socket.service.js';

export const followUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const followerId = req.user!.userId;

    // Find user to follow
    const userToFollow = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true },
    });

    if (!userToFollow) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Can't follow yourself
    if (userToFollow.id === followerId) {
      res.status(400).json({ error: "You can't follow yourself" });
      return;
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userToFollow.id,
        },
      },
    });

    if (existingFollow) {
      res.status(400).json({ error: 'Already following this user' });
      return;
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId,
        followingId: userToFollow.id,
      },
    });

    // Get follower info for real-time notification
    const follower = await prisma.user.findUnique({
      where: { id: followerId },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
      },
    });

    // Emit real-time notification
    emitNewFollower(userToFollow.id, follower);

    // Get updated counts
    const counts = await prisma.follow.count({
      where: { followingId: userToFollow.id },
    });

    res.json({
      message: `Now following @${username}`,
      followersCount: counts,
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
};

export const unfollowUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const followerId = req.user!.userId;

    // Find user to unfollow
    const userToUnfollow = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!userToUnfollow) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userToUnfollow.id,
        },
      },
    });

    if (!existingFollow) {
      res.status(400).json({ error: 'Not following this user' });
      return;
    }

    // Delete follow relationship
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userToUnfollow.id,
        },
      },
    });

    // Get updated counts
    const counts = await prisma.follow.count({
      where: { followingId: userToUnfollow.id },
    });

    res.json({
      message: `Unfollowed @${username}`,
      followersCount: counts,
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
};
