import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from './test-utils';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/(auth)/login/page';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

// Mock the API
vi.mock('@/lib/api', () => ({
  authApi: {
    login: vi.fn(),
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth store
    useAuthStore.getState().logout();
  });

  it('renders login form with all required fields', () => {
    render(<LoginPage />);

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders link to registration page', () => {
    render(<LoginPage />);

    const signUpLink = screen.getByRole('link', { name: /sign up/i });
    expect(signUpLink).toHaveAttribute('href', '/register');
  });

  it('allows user to type in email and password fields', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('successfully logs in with valid credentials', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      user: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        bio: null,
        avatar: null,
        banner: null,
        location: null,
        website: null,
        createdAt: new Date().toISOString(),
      },
      token: 'mock-token',
    };

    vi.mocked(authApi.login).mockResolvedValueOnce(mockResponse);

    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Check that auth store was updated
    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('test@example.com');
    });
  });

  it('shows loading state while submitting', async () => {
    const user = userEvent.setup();
    
    // Create a promise that we can control
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    vi.mocked(authApi.login).mockImplementation(() => loginPromise as any);

    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Button should be disabled while loading
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Resolve the login
    resolveLogin!({
      user: { id: '1', email: 'test@example.com', username: 'test', name: 'Test', bio: null, avatar: null, banner: null, location: null, website: null, createdAt: new Date().toISOString() },
      token: 'token',
    });
  });

  it('handles login error', async () => {
    const user = userEvent.setup();
    const toast = await import('react-hot-toast');
    
    vi.mocked(authApi.login).mockRejectedValueOnce({
      response: {
        data: {
          error: 'Invalid email or password',
        },
      },
    });

    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Invalid email or password');
    });
  });
});
