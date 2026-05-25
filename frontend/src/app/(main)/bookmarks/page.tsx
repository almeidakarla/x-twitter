'use client';

import { Bookmark } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export default function BookmarksPage() {
  const { user } = useAuthStore();

  return (
    <div>
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="p-4">
          <h1 className="text-xl font-bold">Bookmarks</h1>
          <p className="text-sm text-gray-500">@{user?.username}</p>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <Bookmark className="w-16 h-16 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">
          Save posts for later
        </h2>
        <p className="text-center max-w-sm">
          Bookmark posts to easily find them again in the future.
        </p>
      </div>
    </div>
  );
}
