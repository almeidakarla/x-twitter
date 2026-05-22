'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ComposeTweet } from '@/components/tweet/compose-tweet';

export default function ComposePage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/home');
  };

  return (
    <div>
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center gap-6 p-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-900 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Compose</h1>
        </div>
      </header>

      <ComposeTweet onSuccess={handleSuccess} />
    </div>
  );
}
