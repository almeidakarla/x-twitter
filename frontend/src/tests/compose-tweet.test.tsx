import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from './test-utils';
import userEvent from '@testing-library/user-event';
import { ComposeTweet } from '@/components/tweet/compose-tweet';
import { tweetApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

// Mock the API
vi.mock('@/lib/api', () => ({
  tweetApi: {
    create: vi.fn(),
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

describe('ComposeTweet', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test User',
    bio: null,
    avatar: null,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set authenticated user
    useAuthStore.getState().setAuth(mockUser, 'mock-token');
  });

  it('renders compose tweet form when user is authenticated', () => {
    render(<ComposeTweet />);

    expect(screen.getByPlaceholderText(/what's happening/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post/i })).toBeInTheDocument();
  });

  it('does not render when user is not authenticated', () => {
    useAuthStore.getState().logout();
    
    const { container } = render(<ComposeTweet />);
    expect(container.firstChild).toBeNull();
  });

  it('allows user to type tweet content', async () => {
    const user = userEvent.setup();
    render(<ComposeTweet />);

    const textarea = screen.getByPlaceholderText(/what's happening/i);
    await user.type(textarea, 'Hello, world!');

    expect(textarea).toHaveValue('Hello, world!');
  });

  it('shows character count when typing', async () => {
    const user = userEvent.setup();
    render(<ComposeTweet />);

    const textarea = screen.getByPlaceholderText(/what's happening/i);
    await user.type(textarea, 'Hello');

    // 280 - 5 = 275 characters remaining
    expect(screen.getByText('275')).toBeInTheDocument();
  });

  it('disables post button when content is empty', () => {
    render(<ComposeTweet />);

    const postButton = screen.getByRole('button', { name: /post/i });
    expect(postButton).toBeDisabled();
  });

  it('enables post button when content is entered', async () => {
    const user = userEvent.setup();
    render(<ComposeTweet />);

    const textarea = screen.getByPlaceholderText(/what's happening/i);
    const postButton = screen.getByRole('button', { name: /post/i });

    await user.type(textarea, 'Hello, world!');

    expect(postButton).not.toBeDisabled();
  });

  it('shows warning color when approaching character limit', async () => {
    const user = userEvent.setup();
    render(<ComposeTweet />);

    const textarea = screen.getByPlaceholderText(/what's happening/i);
    
    // Type 265 characters (15 remaining)
    const longText = 'a'.repeat(265);
    await user.type(textarea, longText);

    // Character count should show 15 with warning color
    const charCount = screen.getByText('15');
    expect(charCount).toHaveClass('text-yellow-500');
  });

  it('shows error color when over character limit', async () => {
    render(<ComposeTweet />);

    const textarea = screen.getByPlaceholderText(/what's happening/i);

    // Use fireEvent for faster input of long text
    const longText = 'a'.repeat(285);
    fireEvent.change(textarea, { target: { value: longText } });

    // Character count should show -5 with error color
    const charCount = screen.getByText('-5');
    expect(charCount).toHaveClass('text-red-500');
  });

  it('disables post button when over character limit', async () => {
    render(<ComposeTweet />);

    const textarea = screen.getByPlaceholderText(/what's happening/i);
    const postButton = screen.getByRole('button', { name: /post/i });

    // Use fireEvent for faster input of long text
    const longText = 'a'.repeat(285);
    fireEvent.change(textarea, { target: { value: longText } });

    expect(postButton).toBeDisabled();
  });

  it('successfully posts a tweet', async () => {
    const user = userEvent.setup();
    const toast = await import('react-hot-toast');
    
    vi.mocked(tweetApi.create).mockResolvedValueOnce({
      tweet: {
        id: '1',
        content: 'Hello, world!',
        imageUrl: null,
        createdAt: new Date().toISOString(),
        authorId: '1',
        parentId: null,
        author: mockUser,
        isLiked: false,
        likesCount: 0,
        repliesCount: 0,
      },
    });

    render(<ComposeTweet />);

    const textarea = screen.getByPlaceholderText(/what's happening/i);
    const postButton = screen.getByRole('button', { name: /post/i });

    await user.type(textarea, 'Hello, world!');
    await user.click(postButton);

    await waitFor(() => {
      expect(tweetApi.create).toHaveBeenCalled();
    });

    // Check that success toast was shown
    await waitFor(() => {
      expect(toast.default.success).toHaveBeenCalledWith('Tweet posted!');
    });

    // Check that textarea was cleared
    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });

  it('shows Reply button when parentId is provided', () => {
    render(<ComposeTweet parentId="parent-tweet-id" />);

    expect(screen.getByRole('button', { name: /reply/i })).toBeInTheDocument();
  });

  it('shows custom placeholder when provided', () => {
    render(<ComposeTweet placeholder="Post your reply" />);

    expect(screen.getByPlaceholderText(/post your reply/i)).toBeInTheDocument();
  });

  it('calls onSuccess callback after successful post', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    
    vi.mocked(tweetApi.create).mockResolvedValueOnce({
      tweet: {
        id: '1',
        content: 'Hello!',
        imageUrl: null,
        createdAt: new Date().toISOString(),
        authorId: '1',
        parentId: null,
        author: mockUser,
        isLiked: false,
        likesCount: 0,
        repliesCount: 0,
      },
    });

    render(<ComposeTweet onSuccess={onSuccess} />);

    const textarea = screen.getByPlaceholderText(/what's happening/i);
    const postButton = screen.getByRole('button', { name: /post/i });

    await user.type(textarea, 'Hello!');
    await user.click(postButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('handles post error gracefully', async () => {
    const user = userEvent.setup();
    const toast = await import('react-hot-toast');
    
    vi.mocked(tweetApi.create).mockRejectedValueOnce(new Error('Network error'));

    render(<ComposeTweet />);

    const textarea = screen.getByPlaceholderText(/what's happening/i);
    const postButton = screen.getByRole('button', { name: /post/i });

    await user.type(textarea, 'Hello, world!');
    await user.click(postButton);

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Failed to post tweet');
    });
  });
});
