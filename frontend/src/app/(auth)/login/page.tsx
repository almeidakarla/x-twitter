'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const response = await authApi.login(formData);
      setAuth(response.user, response.token);
      toast.success('Welcome back!');
      router.push('/home');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string; details?: Array<{ field: string; message: string }> } } };
      if (err.response?.data?.details) {
        const newErrors: Record<string, string> = {};
        err.response.data.details.forEach((detail) => {
          newErrors[detail.field] = detail.message;
        });
        setErrors(newErrors);
      } else {
        toast.error(err.response?.data?.error || 'Failed to login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-center">Sign in to X</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          disabled={isLoading}
          required
        />

        <Input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={errors.password}
          disabled={isLoading}
          required
        />

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          disabled={isLoading}
        >
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-center text-gray-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-blue-500 hover:underline">
          Sign up
        </Link>
      </p>

      <div className="mt-4 p-4 bg-gray-900 rounded-lg text-sm text-gray-400">
        <p className="font-medium text-white mb-2">Demo credentials:</p>
        <p>Email: demo@example.com</p>
        <p>Password: demo1234</p>
      </div>
    </div>
  );
}
