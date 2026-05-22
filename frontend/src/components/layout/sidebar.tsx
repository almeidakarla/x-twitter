'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Bell,
  User,
  LogOut,
  Feather,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

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

  if (!isAuthenticated) {
    return (
      <aside className="hidden sm:flex flex-col w-20 xl:w-64 h-screen sticky top-0 border-r border-gray-800 p-2">
        <Link href="/" className="p-3 mb-2">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </Link>
        <div className="flex-1" />
        <Link href="/login">
          <Button className="w-full">Log in</Button>
        </Link>
      </aside>
    );
  }

  return (
    <aside className="hidden sm:flex flex-col w-20 xl:w-64 h-screen sticky top-0 border-r border-gray-800 p-2">
      <Link href="/home" className="p-3 mb-2">
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </Link>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-4 p-3 rounded-full hover:bg-gray-900 transition-colors',
                isActive && 'font-bold'
              )}
            >
              <item.icon
                className={cn('w-7 h-7', isActive && 'stroke-[2.5]')}
              />
              <span className="hidden xl:block text-xl">{item.label}</span>
            </Link>
          );
        })}

        <Link
          href="/compose"
          className="mt-4 flex items-center justify-center xl:w-full"
        >
          <Button className="w-12 h-12 xl:w-full xl:h-auto p-3 bg-blue-500 hover:bg-blue-600 text-white">
            <Feather className="w-6 h-6 xl:hidden" />
            <span className="hidden xl:block text-lg font-bold">Post</span>
          </Button>
        </Link>
      </nav>

      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 w-full rounded-full hover:bg-gray-900 transition-colors"
        >
          <Avatar src={user?.avatar} name={user?.name || ''} size="md" />
          <div className="hidden xl:block flex-1 text-left">
            <p className="font-bold text-sm truncate">{user?.name}</p>
            <p className="text-gray-500 text-sm truncate">@{user?.username}</p>
          </div>
          <LogOut className="hidden xl:block w-5 h-5 text-gray-500" />
        </button>
      </div>
    </aside>
  );
}
