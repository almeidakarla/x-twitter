'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Bell,
  User,
  LogOut,
  Feather,
  MessageCircle,
  MoreHorizontal,
  Settings,
  HelpCircle,
  Bookmark,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const navItems = [
    { href: '/home', icon: Home, label: 'Home' },
    { href: '/search', icon: Search, label: 'Explore' },
    { href: '/notifications', icon: Bell, label: 'Notifications' },
    { href: '/messages', icon: MessageCircle, label: 'Messages' },
    { href: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
    { href: user ? `/${user.username}` : '/login', icon: User, label: 'Profile' },
  ];

  if (!isAuthenticated) {
    return (
      <aside className="hidden sm:flex flex-col w-20 xl:w-64 h-screen sticky top-0 border-r border-gray-800 p-2">
        <Link href="/" className="p-3 mb-2 hover:bg-gray-900 rounded-full w-fit transition-colors">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </Link>
        <div className="flex-1" />
        <Link href="/login">
          <Button className="w-full bg-white text-black hover:bg-gray-200 font-bold rounded-full">
            Log in
          </Button>
        </Link>
      </aside>
    );
  }

  return (
    <aside className="hidden sm:flex flex-col w-20 xl:w-64 h-screen sticky top-0 border-r border-gray-800 p-2">
      {/* Logo */}
      <Link href="/home" className="p-3 mb-2 hover:bg-gray-900 rounded-full w-fit transition-colors">
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.label === 'Profile' && pathname.startsWith(`/${user?.username}`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-4 p-3 rounded-full hover:bg-gray-900 transition-colors w-fit xl:w-auto',
                isActive && 'font-bold'
              )}
            >
              <item.icon
                className={cn('w-7 h-7', isActive ? 'stroke-[2.5]' : 'stroke-[1.5]')}
              />
              <span className="hidden xl:block text-xl">{item.label}</span>
            </Link>
          );
        })}

        {/* More Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="flex items-center gap-4 p-3 rounded-full hover:bg-gray-900 transition-colors w-fit xl:w-auto"
          >
            <MoreHorizontal className="w-7 h-7 stroke-[1.5]" />
            <span className="hidden xl:block text-xl">More</span>
          </button>

          {showMoreMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMoreMenu(false)}
              />
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-black border border-gray-800 rounded-xl shadow-lg z-50 overflow-hidden">
                <Link
                  href="/settings"
                  className="flex items-center gap-4 p-4 hover:bg-gray-900 transition-colors"
                  onClick={() => setShowMoreMenu(false)}
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings and privacy</span>
                </Link>
                <Link
                  href="/help"
                  className="flex items-center gap-4 p-4 hover:bg-gray-900 transition-colors"
                  onClick={() => setShowMoreMenu(false)}
                >
                  <HelpCircle className="w-5 h-5" />
                  <span>Help Center</span>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Post Button */}
        <Link
          href="/compose"
          className="mt-4 flex items-center justify-center xl:w-full"
        >
          <Button className="w-12 h-12 xl:w-full xl:h-auto xl:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full">
            <Feather className="w-6 h-6 xl:hidden" />
            <span className="hidden xl:block text-lg font-bold">Post</span>
          </Button>
        </Link>
      </nav>

      {/* User Menu */}
      <div className="mt-auto relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-3 p-3 w-full rounded-full hover:bg-gray-900 transition-colors"
        >
          <Avatar src={user?.avatar} name={user?.name || ''} size="md" />
          <div className="hidden xl:block flex-1 text-left min-w-0">
            <p className="font-bold text-sm truncate">{user?.name}</p>
            <p className="text-gray-500 text-sm truncate">@{user?.username}</p>
          </div>
          <MoreHorizontal className="hidden xl:block w-5 h-5 text-gray-500" />
        </button>

        {showUserMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowUserMenu(false)}
            />
            <div className="absolute bottom-full left-0 mb-2 w-72 bg-black border border-gray-800 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <Avatar src={user?.avatar} name={user?.name || ''} size="md" />
                  <div className="min-w-0">
                    <p className="font-bold truncate">{user?.name}</p>
                    <p className="text-gray-500 text-sm truncate">@{user?.username}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  handleLogout();
                }}
                className="flex items-center gap-4 p-4 w-full hover:bg-gray-900 transition-colors text-left"
              >
                <LogOut className="w-5 h-5" />
                <span>Log out @{user?.username}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
