'use client';

import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MessagesPage() {
  return (
    <div>
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <h1 className="text-xl font-bold p-4">Messages</h1>
      </header>

      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <Mail className="w-16 h-16 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">
          Welcome to your inbox!
        </h2>
        <p className="text-center max-w-sm mb-6">
          Drop a line, share posts and more with private conversations between you
          and others on X.
        </p>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-full">
          Write a message
        </Button>
      </div>
    </div>
  );
}
