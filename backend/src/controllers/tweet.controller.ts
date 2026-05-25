import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import { emitNewTweet, emitTweetDeleted, emitTweetLiked, emitTweetUnliked } from '../services/socket.service.js';
import { createNotification } from './notification.controller.js';

// Helper to format tweet response
const formatTweet = (tweet: any, currentUserId?: string) => ({
  ...tweet,
  isLiked: currentUserId
    ? tweet.likes?.some((like: any) => like.userId === currentUserId)
    : false,
  likesCount: tweet._count?.likes ?? tweet.likes?.length ?? 0,
  repliesCount: tweet._count?.replies ?? 0,
});

// Tweet include for queries
const tweetInclude = (currentUserId?: string) => ({
  author: {
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
    },
  },
  likes: currentUserId
    ? {
        where: { userId: currentUserId },
        select: { userId: true },
      }
    : false,
  _count: {
    select: {
      likes: true,
      replies: true,
    },
  },
  parent: {
    select: {
      id: true,
      author: {
        select: {
          username: true,
        },
      },
    },
  },
});

export const createTweet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, parentId } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // If it's a reply, verify parent exists
    if (parentId) {
      const parentTweet = await prisma.tweet.findUnique({
        where: { id: parentId },
      });

      if (!parentTweet) {
        res.status(404).json({ error: 'Parent tweet not found' });
        return;
      }
    }

    const tweet = await prisma.tweet.create({
      data: {
        content,
        imageUrl,
        authorId: req.user!.userId,
        parentId: parentId || null,
      },
      include: tweetInclude(req.user!.userId),
    });

    const formattedTweet = formatTweet(tweet, req.user!.userId);

    // Emit real-time update
    emitNewTweet(formattedTweet);

    // Create notification for reply
    if (parentId && tweet.parent) {
      const parentTweet = await prisma.tweet.findUnique({
        where: { id: parentId },
        select: { authorId: true },
      });
      if (parentTweet) {
        await createNotification("REPLY", parentTweet.authorId, req.user!.userId, tweet.id);
      }
    }

    res.status(201).json({ tweet: formattedTweet });
  } catch (error) {
    console.error('Create tweet error:', error);
    res.status(500).json({ error: 'Failed to create tweet' });
  }
};

export const getTimeline = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cursor, limit = config.pagination.defaultLimit } = req.query;
    const userId = req.user!.userId;

    // Get users that current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    // Include own tweets in timeline
    followingIds.push(userId);

    const tweets = await prisma.tweet.findMany({
      where: {
        authorId: { in: followingIds },
        parentId: null, // Only top-level tweets in timeline
      },
      include: tweetInclude(userId),
      orderBy: { createdAt: 'desc' },
      take: Number(limit) + 1, // Fetch one extra to determine if there are more
      ...(cursor && {
        cursor: { id: cursor as string },
        skip: 1,
      }),
    });

    const hasMore = tweets.length > Number(limit);
    const timelineTweets = hasMore ? tweets.slice(0, -1) : tweets;
    const nextCursor = hasMore ? timelineTweets[timelineTweets.length - 1]?.id : null;

    res.json({
      tweets: timelineTweets.map((t) => formatTweet(t, userId)),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({ error: 'Failed to get timeline' });
  }
};

export const getUserTweets = async (req: Request, res: Response): Promise<void> => {
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

    const tweets = await prisma.tweet.findMany({
      where: {
        authorId: user.id,
      },
      include: tweetInclude(currentUserId),
      orderBy: { createdAt: 'desc' },
      take: Number(limit) + 1,
      ...(cursor && {
        cursor: { id: cursor as string },
        skip: 1,
      }),
    });

    const hasMore = tweets.length > Number(limit);
    const userTweets = hasMore ? tweets.slice(0, -1) : tweets;
    const nextCursor = hasMore ? userTweets[userTweets.length - 1]?.id : null;

    res.json({
      tweets: userTweets.map((t) => formatTweet(t, currentUserId)),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Get user tweets error:', error);
    res.status(500).json({ error: 'Failed to get user tweets' });
  }
};

export const getTweet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;

    const tweet = await prisma.tweet.findUnique({
      where: { id },
      include: tweetInclude(currentUserId),
    });

    if (!tweet) {
      res.status(404).json({ error: 'Tweet not found' });
      return;
    }

    res.json({ tweet: formatTweet(tweet, currentUserId) });
  } catch (error) {
    console.error('Get tweet error:', error);
    res.status(500).json({ error: 'Failed to get tweet' });
  }
};

export const getTweetReplies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { cursor, limit = config.pagination.defaultLimit } = req.query;
    const currentUserId = req.user?.userId;

    const replies = await prisma.tweet.findMany({
      where: { parentId: id },
      include: tweetInclude(currentUserId),
      orderBy: { createdAt: 'asc' },
      take: Number(limit) + 1,
      ...(cursor && {
        cursor: { id: cursor as string },
        skip: 1,
      }),
    });

    const hasMore = replies.length > Number(limit);
    const replyList = hasMore ? replies.slice(0, -1) : replies;
    const nextCursor = hasMore ? replyList[replyList.length - 1]?.id : null;

    res.json({
      replies: replyList.map((t) => formatTweet(t, currentUserId)),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Get tweet replies error:', error);
    res.status(500).json({ error: 'Failed to get replies' });
  }
};

export const deleteTweet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const tweet = await prisma.tweet.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!tweet) {
      res.status(404).json({ error: 'Tweet not found' });
      return;
    }

    if (tweet.authorId !== userId) {
      res.status(403).json({ error: 'You can only delete your own tweets' });
      return;
    }

    await prisma.tweet.delete({
      where: { id },
    });

    // Emit real-time update
    emitTweetDeleted(id);

    res.json({ message: 'Tweet deleted successfully' });
  } catch (error) {
    console.error('Delete tweet error:', error);
    res.status(500).json({ error: 'Failed to delete tweet' });
  }
};

export const likeTweet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Check if tweet exists
    const tweet = await prisma.tweet.findUnique({
      where: { id },
    });

    if (!tweet) {
      res.status(404).json({ error: 'Tweet not found' });
      return;
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_tweetId: {
          userId,
          tweetId: id,
        },
      },
    });

    if (existingLike) {
      res.status(400).json({ error: 'Tweet already liked' });
      return;
    }

    await prisma.like.create({
      data: {
        userId,
        tweetId: id,
      },
    });

    const likesCount = await prisma.like.count({
      where: { tweetId: id },
    });

    // Emit real-time update
    emitTweetLiked(id, userId, likesCount);

    // Create notification for like
    await createNotification("LIKE", tweet.authorId, userId, id);

    res.json({ message: 'Tweet liked', likesCount });
  } catch (error) {
    console.error('Like tweet error:', error);
    res.status(500).json({ error: 'Failed to like tweet' });
  }
};

export const unlikeTweet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_tweetId: {
          userId,
          tweetId: id,
        },
      },
    });

    if (!existingLike) {
      res.status(400).json({ error: 'Tweet not liked' });
      return;
    }

    await prisma.like.delete({
      where: {
        userId_tweetId: {
          userId,
          tweetId: id,
        },
      },
    });

    const likesCount = await prisma.like.count({
      where: { tweetId: id },
    });

    // Emit real-time update
    emitTweetUnliked(id, userId, likesCount);

    res.json({ message: 'Tweet unliked', likesCount });
  } catch (error) {
    console.error('Unlike tweet error:', error);
    res.status(500).json({ error: 'Failed to unlike tweet' });
  }
};
