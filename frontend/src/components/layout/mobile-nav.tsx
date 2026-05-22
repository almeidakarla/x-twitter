'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Bell, User, Feather } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

export function MobileNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { href: '/home', icon: Home, label: 'Home' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/notifications', icon: Bell, label: 'Notifications' },
    {
      href: user ? `/${user.username}` : '/login',
      icon: User,
      label: 'Profile',
    },
  ];

  return (
    <>
      {/* Floating compose button */}
      <Link
        href="/compose"
        className="sm:hidden fixed bottom-20 right-4 z-50 w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
      >
        <Feather className="w-6 h-6 text-white" />
      </Link>

      {/* Bottom navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-40">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full',
                  isActive && 'text-white'
                )}
              >
                <item.icon
                  className={cn(
                    'w-6 h-6',
                    isActive ? 'stroke-[2.5]' : 'text-gray-400'
                  )}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
