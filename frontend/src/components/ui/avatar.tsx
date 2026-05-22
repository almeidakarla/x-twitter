'use client';

import { cn, getAvatarUrl } from '@/lib/utils';
import Image from 'next/image';
import { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const [error, setError] = useState(false);

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-32 h-32',
  };

  const avatarUrl = error ? getAvatarUrl(null, name) : getAvatarUrl(src ?? null, name);

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-gray-700 flex-shrink-0',
        sizes[size],
        className
      )}
    >
      <Image
        src={avatarUrl}
        alt={name}
        fill
        className="object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}
