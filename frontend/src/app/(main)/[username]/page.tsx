'use client';

import { useEffect, useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, tweetApi, followApi } from '@/lib/api';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TweetCard } from '@/components/tweet/tweet-card';
import { Spinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/store/auth';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { Tweet } from '@/types';
import { EditProfileModal } from '@/components/profile/edit-profile-modal';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'tweets' | 'replies'>('tweets');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => userApi.getProfile(username),
  });

  const profile = profileData?.user;

  const {
    data: tweetsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingTweets,
  } = useInfiniteQuery({
    queryKey: ['tweets', username],
    queryFn: ({ pageParam }) => tweetApi.getUserTweets(username, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!profile,
  });

  const followMutation = useMutation({
    mutationFn: () =>
      profile?.isFollowing
        ? followApi.unfollow(username)
        : followApi.follow(username),
    onSuccess: () => {
      toast.success(
        profile?.isFollowing
          ? `Unfollowed @${username}`
          : `Following @${username}`
      );
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
    },
    onError: () => {
      toast.error('Failed to update follow status');
    },
  });

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

  const tweets = tweetsData?.pages.flatMap((page) => page.tweets ?? []) ?? [];
  const isOwnProfile = currentUser?.username === username;

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">User not found</h2>
        <p className="text-gray-500 mt-2">@{username}</p>
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
          <div>
            <h1 className="text-xl font-bold">{profile.name}</h1>
            <p className="text-sm text-gray-500">
              {profile.tweetsCount} posts
            </p>
          </div>
        </div>
      </header>

      {/* Banner */}
      <div className="h-32 sm:h-48 bg-gray-800" />

      {/* Profile info */}
      <div className="px-4 pb-4 border-b border-gray-800">
        <div className="flex justify-between items-start -mt-16 sm:-mt-20">
          <Avatar
            src={profile.avatar}
            name={profile.name}
            size="xl"
            className="border-4 border-black"
          />

          {isOwnProfile ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-20"
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit profile
            </Button>
          ) : (
            <Button
              variant={profile.isFollowing ? 'outline' : 'primary'}
              size="sm"
              className="mt-20"
              onClick={() => followMutation.mutate()}
              disabled={followMutation.isPending}
            >
              {profile.isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>

        <div className="mt-4">
          <h2 className="text-xl font-bold">{profile.name}</h2>
          <p className="text-gray-500">@{profile.username}</p>

          {profile.bio && <p className="mt-3">{profile.bio}</p>}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-500 mt-3">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profile.location}
              </span>
            )}
            {profile.website && (
              <a
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-400 hover:underline"
              >
                <LinkIcon className="w-4 h-4" />
                {profile.website.replace(/^https?:///, '')}
              </a>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Joined {format(new Date(profile.createdAt), 'MMMM yyyy')}
            </span>
          </div>

          <div className="flex gap-4 mt-3">
            <Link
              href={`/${username}/following`}
              className="hover:underline"
            >
              <span className="font-bold">{profile.followingCount}</span>{' '}
              <span className="text-gray-500">Following</span>
            </Link>
            <Link
              href={`/${username}/followers`}
              className="hover:underline"
            >
              <span className="font-bold">{profile.followersCount}</span>{' '}
              <span className="text-gray-500">Followers</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          className={`flex-1 py-4 font-medium hover:bg-gray-900 transition-colors relative ${
            activeTab === 'tweets' ? 'text-white' : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('tweets')}
        >
          Posts
          {activeTab === 'tweets' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-blue-500 rounded-full" />
          )}
        </button>
        <button
          className={`flex-1 py-4 font-medium hover:bg-gray-900 transition-colors relative ${
            activeTab === 'replies' ? 'text-white' : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('replies')}
        >
          Replies
          {activeTab === 'replies' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-blue-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Tweets */}
      {isLoadingTweets ? (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      ) : tweets.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>No posts yet</p>
        </div>
      ) : (
        <div>
          {tweets
            .filter((tweet: Tweet) =>
              activeTab === 'tweets' ? !tweet.parentId : tweet.parentId
            )
            .map((tweet: Tweet) => (
              <TweetCard key={tweet.id} tweet={tweet} />
            ))}

          {isFetchingNextPage && (
            <div className="flex justify-center p-4">
              <Spinner />
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {profile && isOwnProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={profile}
        />
      )}
    </div>
  );
}
