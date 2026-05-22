'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/home');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Logo */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-black">
        <svg viewBox="0 0 24 24" className="w-96 h-96 text-white fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>

      {/* Right side - CTA */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16">
        <svg viewBox="0 0 24 24" className="w-12 h-12 text-white fill-current lg:hidden mb-8">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>

        <h1 className="text-4xl sm:text-6xl font-bold mb-8">
          Happening now
        </h1>

        <h2 className="text-2xl sm:text-3xl font-bold mb-8">
          Join today.
        </h2>

        <div className="space-y-4 max-w-sm">
          <Link href="/register">
            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
              Create account
            </Button>
          </Link>

          <p className="text-xs text-gray-500 px-4">
            By signing up, you agree to the Terms of Service and Privacy Policy,
            including Cookie Use.
          </p>

          <div className="pt-8">
            <p className="font-bold mb-4">Already have an account?</p>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
