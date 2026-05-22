'use client';

import { useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { tweetApi } from '@/lib/api';
import { ComposeTweet } from '@/components/tweet/compose-tweet';
import { TweetCard } from '@/components/tweet/tweet-card';
import { Spinner } from '@/components/ui/spinner';
import { getSocket } from '@/lib/socket';
import type { Tweet } from '@/types';

export default function HomePage() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['timeline'],
    queryFn: ({ pageParam }) => tweetApi.getTimeline(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  });

  // Real-time updates
  useEffect(() => {
    const socket = getSocket();

    const handleNewTweet = () => {
      refetch();
    };

    const handleTweetDeleted = () => {
      refetch();
    };

    socket.on('tweet:new', handleNewTweet);
    socket.on('tweet:deleted', handleTweetDeleted);

    return () => {
      socket.off('tweet:new', handleNewTweet);
      socket.off('tweet:deleted', handleTweetDeleted);
    };
  }, [refetch]);

  // Infinite scroll
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

  const tweets = data?.pages.flatMap((page) => page.tweets ?? []) ?? [];

  return (
    <div>
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <h1 className="text-xl font-bold p-4">Home</h1>
      </header>

      <ComposeTweet />

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      ) : tweets.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p className="text-lg">Welcome to X!</p>
          <p className="mt-2">
            Follow some users to see their tweets in your timeline.
          </p>
        </div>
      ) : (
        <div>
          {tweets.map((tweet: Tweet) => (
            <TweetCard key={tweet.id} tweet={tweet} />
          ))}

          {isFetchingNextPage && (
            <div className="flex justify-center p-4">
              <Spinner />
            </div>
          )}

          {!hasNextPage && tweets.length > 0 && (
            <p className="text-center text-gray-500 p-8">
              You&apos;ve reached the end
            </p>
          )}
        </div>
      )}
    </div>
  );
}
