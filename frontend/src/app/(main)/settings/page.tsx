'use client';

import { Settings, User, Lock, Bell, Palette, HelpCircle } from 'lucide-react';
import Link from 'next/link';

const settingsItems = [
  {
    icon: User,
    title: 'Your account',
    description: 'See information about your account, download an archive of your data, or learn about your account deactivation options.',
  },
  {
    icon: Lock,
    title: 'Security and account access',
    description: 'Manage your account\'s security and keep track of your account\'s usage.',
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Select the kinds of notifications you get about your activities, interests, and recommendations.',
  },
  {
    icon: Palette,
    title: 'Accessibility, display, and languages',
    description: 'Manage how X content is displayed to you.',
  },
  {
    icon: HelpCircle,
    title: 'Help Center',
    description: 'Get help with your X experience.',
  },
];

export default function SettingsPage() {
  return (
    <div>
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <h1 className="text-xl font-bold p-4">Settings</h1>
      </header>

      <div className="divide-y divide-gray-800">
        {settingsItems.map((item) => (
          <button
            key={item.title}
            className="w-full p-4 flex items-start gap-4 hover:bg-gray-900/50 transition-colors text-left"
          >
            <item.icon className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
