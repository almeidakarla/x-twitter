import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from './test-utils';
import userEvent from '@testing-library/user-event';
import { UserCard } from '@/components/user/user-card';
import { followApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { User } from '@/types';

// Mock the API
vi.mock('@/lib/api', () => ({
  followApi: {
    follow: vi.fn(),
    unfollow: vi.fn(),
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('UserCard - Follow Functionality', () => {
  const currentUser: User = {
    id: '1',
    email: 'current@example.com',
    username: 'currentuser',
    name: 'Current User',
    bio: null,
    avatar: null,
    banner: null,
    location: null,
    website: null,
    createdAt: new Date().toISOString(),
  };

  const otherUser: User = {
    id: '2',
    email: 'other@example.com',
    username: 'otheruser',
    name: 'Other User',
    bio: 'Hello, I am another user',
    avatar: null,
    banner: null,
    location: null,
    website: null,
    createdAt: new Date().toISOString(),
    isFollowing: false,
    followersCount: 100,
    followingCount: 50,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set authenticated user
    useAuthStore.getState().setAuth(currentUser, 'mock-token');
  });

  it('renders user information correctly', () => {
    render(<UserCard user={otherUser} />);

    expect(screen.getByText('Other User')).toBeInTheDocument();
    expect(screen.getByText('@otheruser')).toBeInTheDocument();
    expect(screen.getByText('Hello, I am another user')).toBeInTheDocument();
  });

  it('shows Follow button for users not being followed', () => {
    render(<UserCard user={otherUser} />);

    expect(screen.getByRole('button', { name: /follow/i })).toBeInTheDocument();
  });

  it('shows Following button for users being followed', () => {
    const followingUser = { ...otherUser, isFollowing: true };
    render(<UserCard user={followingUser} />);

    expect(screen.getByRole('button', { name: /following/i })).toBeInTheDocument();
  });

  it('does not show follow button for own profile', () => {
    render(<UserCard user={currentUser} />);

    expect(screen.queryByRole('button', { name: /follow/i })).not.toBeInTheDocument();
  });

  it('does not show follow button when not authenticated', () => {
    useAuthStore.getState().logout();
    render(<UserCard user={otherUser} />);

    expect(screen.queryByRole('button', { name: /follow/i })).not.toBeInTheDocument();
  });

  it('successfully follows a user', async () => {
    const user = userEvent.setup();
    const toast = await import('react-hot-toast');
    
    vi.mocked(followApi.follow).mockResolvedValueOnce({ followersCount: 101 });

    render(<UserCard user={otherUser} />);

    const followButton = screen.getByRole('button', { name: /follow/i });
    await user.click(followButton);

    await waitFor(() => {
      expect(followApi.follow).toHaveBeenCalledWith('otheruser');
    });

    await waitFor(() => {
      expect(toast.default.success).toHaveBeenCalledWith('Following @otheruser');
    });
  });

  it('successfully unfollows a user', async () => {
    const user = userEvent.setup();
    const toast = await import('react-hot-toast');
    
    const followingUser = { ...otherUser, isFollowing: true };
    vi.mocked(followApi.unfollow).mockResolvedValueOnce({ followersCount: 99 });

    render(<UserCard user={followingUser} />);

    const followingButton = screen.getByRole('button', { name: /following/i });
    await user.click(followingButton);

    await waitFor(() => {
      expect(followApi.unfollow).toHaveBeenCalledWith('otheruser');
    });

    await waitFor(() => {
      expect(toast.default.success).toHaveBeenCalledWith('Unfollowed @otheruser');
    });
  });

  it('disables button while follow request is pending', async () => {
    const user = userEvent.setup();
    
    // Create a promise that we can control
    let resolveFollow: (value: any) => void;
    const followPromise = new Promise((resolve) => {
      resolveFollow = resolve;
    });
    vi.mocked(followApi.follow).mockImplementation(() => followPromise as any);

    render(<UserCard user={otherUser} />);

    const followButton = screen.getByRole('button', { name: /follow/i });
    await user.click(followButton);

    await waitFor(() => {
      expect(followButton).toBeDisabled();
    });

    // Resolve the follow request
    resolveFollow!({ followersCount: 101 });
  });

  it('handles follow error gracefully', async () => {
    const user = userEvent.setup();
    const toast = await import('react-hot-toast');
    
    vi.mocked(followApi.follow).mockRejectedValueOnce(new Error('Network error'));

    render(<UserCard user={otherUser} />);

    const followButton = screen.getByRole('button', { name: /follow/i });
    await user.click(followButton);

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Failed to update follow status');
    });
  });

  it('links to user profile page', () => {
    render(<UserCard user={otherUser} />);

    const profileLink = screen.getByRole('link');
    expect(profileLink).toHaveAttribute('href', '/otheruser');
  });
});
