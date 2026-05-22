'use client';

import { useState, useEffect } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/lib/api';
import { UserCard } from '@/components/user/user-card';
import { Spinner } from '@/components/ui/spinner';
import { useDebounce } from '@/hooks/use-debounce';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', 'users', debouncedQuery],
    queryFn: () => searchApi.users(debouncedQuery),
    enabled: debouncedQuery.length >= 1,
  });

  const users = data?.users ?? [];

  return (
    <div>
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search users"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-gray-900 rounded-full py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </header>

      <div>
        {isLoading || isFetching ? (
          <div className="flex justify-center p-8">
            <Spinner />
          </div>
        ) : query.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Try searching for users</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No users found for &quot;{query}&quot;</p>
          </div>
        ) : (
          <div>
            {users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
