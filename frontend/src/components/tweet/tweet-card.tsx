'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { cn, formatRelativeTime, getImageUrl } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth';
import { tweetApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { Tweet } from '@/types';

interface TweetCardProps {
  tweet: Tweet;
  showReplyTo?: boolean;
}

export function TweetCard({ tweet, showReplyTo = true }: TweetCardProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isOwner = user?.id === tweet.authorId;

  const likeMutation = useMutation({
    mutationFn: () =>
      tweet.isLiked ? tweetApi.unlike(tweet.id) : tweetApi.like(tweet.id),
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['timeline'] });
      await queryClient.cancelQueries({ queryKey: ['tweets'] });

      const previousData = queryClient.getQueryData(['timeline']);

      queryClient.setQueriesData({ queryKey: ['timeline'] }, (old: unknown) => {
        if (!old) return old;
        return updateTweetInData(old, tweet.id, {
          isLiked: !tweet.isLiked,
          likesCount: tweet.isLiked ? tweet.likesCount - 1 : tweet.likesCount + 1,
        });
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(['timeline'], context?.previousData);
      toast.error('Failed to update like');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tweetApi.delete(tweet.id),
    onSuccess: () => {
      toast.success('Tweet deleted');
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
    },
    onError: () => {
      toast.error('Failed to delete tweet');
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please log in to like tweets');
      return;
    }
    likeMutation.mutate();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this tweet?')) {
      deleteMutation.mutate();
    }
  };

  const imageUrl = getImageUrl(tweet.imageUrl);

  return (
    <Link href={`/tweet/${tweet.id}`}>
      <article className="p-4 border-b border-gray-800 hover:bg-gray-900/50 transition-colors cursor-pointer">
        {showReplyTo && tweet.parent && (
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2 ml-12">
            <span>Replying to</span>
            <Link
              href={`/${tweet.parent.author.username}`}
              className="text-blue-500 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              @{tweet.parent.author.username}
            </Link>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href={`/${tweet.author.username}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar
              src={tweet.author.avatar}
              name={tweet.author.name}
              size="md"
            />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/${tweet.author.username}`}
                className="font-bold hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {tweet.author.name}
              </Link>
              <Link
                href={`/${tweet.author.username}`}
                className="text-gray-500 truncate"
                onClick={(e) => e.stopPropagation()}
              >
                @{tweet.author.username}
              </Link>
              <span className="text-gray-500">·</span>
              <span className="text-gray-500 text-sm">
                {formatRelativeTime(tweet.createdAt)}
              </span>
            </div>

            <p className="mt-1 whitespace-pre-wrap break-words">
              {tweet.content}
            </p>

            {imageUrl && (
              <div className="mt-3 relative rounded-2xl overflow-hidden border border-gray-800 max-w-[500px]">
                <Image
                  src={imageUrl}
                  alt="Tweet image"
                  width={500}
                  height={300}
                  className="object-cover w-full h-auto max-h-[300px]"
                />
              </div>
            )}

            <div className="flex items-center gap-8 mt-3 -ml-2">
              <button
                className="flex items-center gap-2 text-gray-500 hover:text-blue-500 group p-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2 rounded-full group-hover:bg-blue-500/10">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-sm">{tweet.repliesCount || ''}</span>
              </button>

              <button
                className={cn(
                  'flex items-center gap-2 group p-2',
                  tweet.isLiked
                    ? 'text-pink-600'
                    : 'text-gray-500 hover:text-pink-600'
                )}
                onClick={handleLike}
                disabled={likeMutation.isPending}
              >
                <div className="p-2 rounded-full group-hover:bg-pink-600/10">
                  <Heart
                    className={cn('w-5 h-5', tweet.isLiked && 'fill-current')}
                  />
                </div>
                <span className="text-sm">{tweet.likesCount || ''}</span>
              </button>

              {isOwner && (
                <button
                  className="flex items-center gap-2 text-gray-500 hover:text-red-500 group p-2"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  <div className="p-2 rounded-full group-hover:bg-red-500/10">
                    <Trash2 className="w-5 h-5" />
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

// Helper to update tweet in cached data
function updateTweetInData(
  data: unknown,
  tweetId: string,
  updates: Partial<Tweet>
): unknown {
  if (!data || typeof data !== 'object') return data;

  const typedData = data as { pages?: Array<{ tweets?: Tweet[] }>; tweets?: Tweet[] };

  if ('pages' in typedData && Array.isArray(typedData.pages)) {
    return {
      ...typedData,
      pages: typedData.pages.map((page) => ({
        ...page,
        tweets: page.tweets?.map((t: Tweet) =>
          t.id === tweetId ? { ...t, ...updates } : t
        ),
      })),
    };
  }

  if ('tweets' in typedData && Array.isArray(typedData.tweets)) {
    return {
      ...typedData,
      tweets: typedData.tweets.map((t) =>
        t.id === tweetId ? { ...t, ...updates } : t
      ),
    };
  }

  return data;
}
