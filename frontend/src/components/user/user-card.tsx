'use client';

import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { followApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { User } from '@/types';

interface UserCardProps {
  user: User;
}

export function UserCard({ user: profile }: UserCardProps) {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const isOwnProfile = currentUser?.id === profile.id;

  const followMutation = useMutation({
    mutationFn: () =>
      profile.isFollowing
        ? followApi.unfollow(profile.username)
        : followApi.follow(profile.username),
    onSuccess: () => {
      toast.success(
        profile.isFollowing
          ? `Unfollowed @${profile.username}`
          : `Following @${profile.username}`
      );
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
    onError: () => {
      toast.error('Failed to update follow status');
    },
  });

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      toast.error('Please log in to follow users');
      return;
    }
    followMutation.mutate();
  };

  return (
    <Link href={`/${profile.username}`}>
      <div className="flex items-center gap-3 p-4 hover:bg-gray-900/50 transition-colors cursor-pointer">
        <Avatar src={profile.avatar} name={profile.name} size="lg" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold truncate hover:underline">
                {profile.name}
              </p>
              <p className="text-gray-500 truncate">@{profile.username}</p>
            </div>

            {!isOwnProfile && currentUser && (
              <Button
                variant={profile.isFollowing ? 'outline' : 'primary'}
                size="sm"
                onClick={handleFollow}
                disabled={followMutation.isPending}
              >
                {profile.isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>

          {profile.bio && (
            <p className="mt-1 text-sm text-gray-300 line-clamp-2">
              {profile.bio}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
