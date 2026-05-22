'use client';

import { useState, useRef } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { tweetApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface ComposeTweetProps {
  parentId?: string;
  placeholder?: string;
  onSuccess?: () => void;
}

const MAX_CHARS = 280;

export function ComposeTweet({
  parentId,
  placeholder = "What's happening?",
  onSuccess,
}: ComposeTweetProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('content', content);
      if (parentId) {
        formData.append('parentId', parentId);
      }
      if (image) {
        formData.append('image', image);
      }
      return tweetApi.create(formData);
    },
    onSuccess: () => {
      setContent('');
      setImage(null);
      setImagePreview(null);
      toast.success(parentId ? 'Reply posted!' : 'Tweet posted!');
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ['replies', parentId] });
      }
      onSuccess?.();
    },
    onError: () => {
      toast.error('Failed to post tweet');
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !image) return;
    if (content.length > MAX_CHARS) return;
    mutation.mutate();
  };

  const charsRemaining = MAX_CHARS - content.length;
  const isOverLimit = charsRemaining < 0;

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b border-gray-800">
      <div className="flex gap-3">
        <Avatar src={user.avatar} name={user.name} size="md" />

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-xl placeholder-gray-500 resize-none focus:outline-none min-h-[80px]"
            rows={2}
          />

          {imagePreview && (
            <div className="relative mt-2 inline-block">
              <Image
                src={imagePreview}
                alt="Preview"
                width={200}
                height={200}
                className="rounded-2xl max-h-[200px] object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 left-2 p-1 bg-black/70 rounded-full hover:bg-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              {content.length > 0 && (
                <div
                  className={`text-sm ${
                    isOverLimit
                      ? 'text-red-500'
                      : charsRemaining <= 20
                      ? 'text-yellow-500'
                      : 'text-gray-500'
                  }`}
                >
                  {charsRemaining}
                </div>
              )}

              <Button
                type="submit"
                disabled={
                  mutation.isPending ||
                  (!content.trim() && !image) ||
                  isOverLimit
                }
                isLoading={mutation.isPending}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {parentId ? 'Reply' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
