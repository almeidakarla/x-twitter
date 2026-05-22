import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, isThisYear } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  if (isThisYear(date)) {
    return format(date, 'MMM d');
  }

  return format(date, 'MMM d, yyyy');
}

export function getAvatarUrl(avatar: string | null, name: string): string {
  if (avatar) {
    if (avatar.startsWith('http')) {
      return avatar;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${apiUrl}${avatar}`;
  }

  // Generate initials avatar
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=1d9bf0&color=fff&size=128`;
}

export function getImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;

  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${apiUrl}${imageUrl}`;
}
