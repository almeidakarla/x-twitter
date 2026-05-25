'use client';

import { useState, useRef } from 'react';
import { X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { User } from '@/types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export function EditProfileModal({ isOpen, onClose, user }: EditProfileModalProps) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState<string | null>(user.avatar || null);
  const [banner, setBanner] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const { updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  if (!isOpen) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBanner(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('bio', bio);

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await authApi.updateProfile(formData);

      updateUser(response.user);
      queryClient.invalidateQueries({ queryKey: ['profile', user.username] });
      toast.success('Profile updated!');
      onClose();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-black rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-8">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-900 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold">Edit profile</h2>
          </div>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-white text-black hover:bg-gray-200 font-bold px-4 py-1.5 rounded-full"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Banner */}
          <div className="relative h-32 sm:h-48 bg-gray-800">
            {banner && (
              <img
                src={banner}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-4">
              <button
                onClick={() => bannerInputRef.current?.click()}
                className="p-3 bg-black/60 hover:bg-black/70 rounded-full transition-colors"
              >
                <Camera className="w-5 h-5" />
              </button>
              {banner && (
                <button
                  onClick={() => setBanner(null)}
                  className="p-3 bg-black/60 hover:bg-black/70 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              className="hidden"
            />
          </div>

          {/* Avatar */}
          <div className="px-4 -mt-16 sm:-mt-20">
            <div className="relative inline-block">
              <Avatar
                src={avatar || undefined}
                name={name}
                size="xl"
                className="border-4 border-black"
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/60 hover:bg-black/70 rounded-full transition-colors"
              >
                <Camera className="w-6 h-6" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Form */}
          <div className="p-4 space-y-6">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={50}
                className="bg-transparent border-gray-800 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {name.length}/50
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                maxLength={160}
                rows={3}
                className="w-full bg-transparent border border-gray-800 rounded-lg p-3 focus:border-blue-500 focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {bio.length}/160
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Location</label>
              <Input
                placeholder="Add your location"
                className="bg-transparent border-gray-800 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Website</label>
              <Input
                placeholder="Add your website"
                className="bg-transparent border-gray-800 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
