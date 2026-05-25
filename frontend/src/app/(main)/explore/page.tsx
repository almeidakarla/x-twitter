'use client';

import { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/lib/api';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { followApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user: currentUser } = useAuthStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['explore-users', searchQuery],
    queryFn: () => searchApi.users(searchQuery),
  });

  const handleFollow = async (username: string, isFollowing: boolean) => {
    try {
      if (isFollowing) {
        await followApi.unfollow(username);
        toast.success(`Unfollowed @${username}`);
      } else {
        await followApi.follow(username);
        toast.success(`Followed @${username}`);
      }
      refetch();
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border-gray-800 rounded-full pl-12 py-3 focus:border-blue-500 focus:bg-black"
          />
        </div>
      </header>

      <div>
        <h2 className="text-xl font-bold p-4 border-b border-gray-800">
          {searchQuery ? 'Search Results' : 'People to follow'}
        </h2>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : data?.users && data.users.length > 0 ? (
          <div className="divide-y divide-gray-800">
            {data.users.map((user) => (
              <div key={user.id} className="p-4 hover:bg-gray-900/50 transition-colors">
                <div className="flex items-start justify-between">
                  <Link href={`/${user.username}`} className="flex items-start gap-3">
                    <Avatar
                      src={user.avatar || undefined}
                      name={user.name}
                      size="md"
                    />
                    <div>
                      <p className="font-bold hover:underline">{user.name}</p>
                      <p className="text-gray-500">@{user.username}</p>
                      {user.bio && (
                        <p className="text-sm mt-1">{user.bio}</p>
                      )}
                    </div>
                  </Link>
                  {currentUser?.id !== user.id && (
                    <Button
                      variant={user.isFollowing ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => handleFollow(user.username, user.isFollowing || false)}
                      className={user.isFollowing
                        ? 'border-gray-600 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 rounded-full'
                        : 'bg-white text-black hover:bg-gray-200 rounded-full'
                      }
                    >
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <SearchIcon className="w-16 h-16 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              {searchQuery ? 'No results found' : 'No users yet'}
            </h2>
            <p className="text-center max-w-sm">
              {searchQuery
                ? 'Try searching for something else'
                : 'Be the first to invite friends to X!'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
