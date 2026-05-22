'use client';

import { useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { tweetApi } from '@/lib/api';
import { TweetCard } from '@/components/tweet/tweet-card';
import { ComposeTweet } from '@/components/tweet/compose-tweet';
import { Spinner } from '@/components/ui/spinner';
import { getSocket, subscribeToTweet, unsubscribeFromTweet } from '@/lib/socket';
import type { Tweet } from '@/types';

export default function TweetPage() {
  const params = useParams();
  const tweetId = params.id as string;

  const { data: tweetData, isLoading: isLoadingTweet, refetch: refetchTweet } = useQuery({
    queryKey: ['tweet', tweetId],
    queryFn: () => tweetApi.getTweet(tweetId),
  });

  const {
    data: repliesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingReplies,
    refetch: refetchReplies,
  } = useInfiniteQuery({
    queryKey: ['replies', tweetId],
    queryFn: ({ pageParam }) => tweetApi.getReplies(tweetId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!tweetData,
  });

  // Real-time updates
  useEffect(() => {
    subscribeToTweet(tweetId);

    const socket = getSocket();

    const handleLikeUpdate = (data: { tweetId: string }) => {
      if (data.tweetId === tweetId) {
        refetchTweet();
      }
    };

    const handleNewReply = () => {
      refetchReplies();
      refetchTweet();
    };

    socket.on('tweet:liked', handleLikeUpdate);
    socket.on('tweet:unliked', handleLikeUpdate);
    socket.on('tweet:reply', handleNewReply);

    return () => {
      unsubscribeFromTweet(tweetId);
      socket.off('tweet:liked', handleLikeUpdate);
      socket.off('tweet:unliked', handleLikeUpdate);
      socket.off('tweet:reply', handleNewReply);
    };
  }, [tweetId, refetchTweet, refetchReplies]);

  // Infinite scroll for replies
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const tweet = tweetData?.tweet;
  const replies = repliesData?.pages.flatMap((page) => page.replies ?? []) ?? [];

  if (isLoadingTweet) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (!tweet) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Tweet not found</h2>
        <p className="text-gray-500 mt-2">
          This tweet may have been deleted.
        </p>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center gap-6 p-4">
          <Link href="/home" className="p-2 hover:bg-gray-900 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Post</h1>
        </div>
      </header>

      {/* Main tweet */}
      <TweetCard tweet={tweet} showReplyTo />

      {/* Reply composer */}
      <div className="border-b border-gray-800">
        <ComposeTweet
          parentId={tweet.id}
          placeholder={`Reply to @${tweet.author.username}`}
        />
      </div>

      {/* Replies */}
      <div>
        {isLoadingReplies ? (
          <div className="flex justify-center p-8">
            <Spinner />
          </div>
        ) : replies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No replies yet</p>
          </div>
        ) : (
          <div>
            {replies.map((reply: Tweet) => (
              <TweetCard key={reply.id} tweet={reply} showReplyTo={false} />
            ))}

            {isFetchingNextPage && (
              <div className="flex justify-center p-4">
                <Spinner />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
