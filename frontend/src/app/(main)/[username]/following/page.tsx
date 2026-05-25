'use client';

import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { UserCard } from '@/components/user/user-card';
import { Spinner } from '@/components/ui/spinner';
import type { User } from '@/types';

export default function FollowingPage() {
  const params = useParams();
  const username = params.username as string;

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['following', username],
    queryFn: ({ pageParam }) => userApi.getFollowing(username, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  });

  const following = data?.pages.flatMap((page) => page.users) ?? [];

  return (
    <div>
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center gap-6 p-4">
          <Link href={`/${username}`} className="p-2 hover:bg-gray-900 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Following</h1>
            <p className="text-sm text-gray-500">@{username}</p>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      ) : following.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-gray-500">
          <h2 className="text-xl font-bold text-white mb-2">Not following anyone</h2>
          <p className="text-center max-w-sm">
            When @{username} follows someone, they will show up here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {following.map((user: User) => (
            <UserCard key={user.id} user={user} />
          ))}

          {isFetchingNextPage && (
            <div className="flex justify-center p-4">
              <Spinner />
            </div>
          )}

          {hasNextPage && !isFetchingNextPage && (
            <button
              onClick={() => fetchNextPage()}
              className="w-full p-4 text-blue-500 hover:bg-gray-900/50"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
