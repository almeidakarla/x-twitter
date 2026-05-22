'use client';

import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div>
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <h1 className="text-xl font-bold p-4">Notifications</h1>
      </header>

      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <Bell className="w-16 h-16 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">
          Nothing to see here — yet
        </h2>
        <p className="text-center max-w-sm">
          From likes to replies and everything in between, this is where all the
          action happens.
        </p>
      </div>
    </div>
  );
}
