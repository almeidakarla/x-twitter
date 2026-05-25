'use client';

import { useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api';
import { Avatar } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Heart, MessageCircle, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }) => notificationApi.getNotifications(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  });

  const markAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  useEffect(() => {
    markAsReadMutation.mutate();
  }, []);

  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LIKE':
        return <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />;
      case 'REPLY':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'FOLLOW':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getNotificationText = (notification: any) => {
    switch (notification.type) {
      case 'LIKE':
        return 'liked your post';
      case 'REPLY':
        return 'replied to your post';
      case 'FOLLOW':
        return 'followed you';
      case 'MENTION':
        return 'mentioned you';
      default:
        return '';
    }
  };

  const getNotificationLink = (notification: any) => {
    if (notification.tweet) {
      return '/tweet/' + notification.tweet.id;
    }
    return '/' + notification.actor.username;
  };

  return (
    <div>
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4">
        <h1 className="text-xl font-bold">Notifications</h1>
      </header>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-gray-500">
          <h2 className="text-xl font-bold text-white mb-2">No notifications yet</h2>
          <p className="text-center max-w-sm">
            When someone likes, replies to, or follows you, you will see it here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {notifications.map((notification: any) => (
            <Link
              key={notification.id}
              href={getNotificationLink(notification)}
              className={'block p-4 hover:bg-gray-900/50 transition-colors ' + (!notification.read ? 'bg-blue-500/5' : '')}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 flex justify-center">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={notification.actor.avatar}
                      name={notification.actor.name}
                      size="sm"
                    />
                  </div>
                  <p className="mt-1">
                    <span className="font-bold">{notification.actor.name}</span>{' '}
                    <span className="text-gray-500">{getNotificationText(notification)}</span>
                  </p>
                  {notification.tweet && (
                    <p className="text-gray-500 mt-1 line-clamp-2">
                      {notification.tweet.content}
                    </p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </Link>
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
