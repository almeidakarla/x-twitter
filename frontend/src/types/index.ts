export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  location: string | null;
  website: string | null;
  createdAt: string;
  followersCount?: number;
  followingCount?: number;
  tweetsCount?: number;
  isFollowing?: boolean;
  isOwnProfile?: boolean;
}

export interface Tweet {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  authorId: string;
  parentId: string | null;
  author: {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
  location: string | null;
  website: string | null;
  };
  isLiked: boolean;
  likesCount: number;
  repliesCount: number;
  parent?: {
    id: string;
    author: {
      username: string;
    };
  } | null;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PaginatedResponse<T> {
  tweets?: T[];
  users?: T[];
  replies?: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

export interface Notification {
  id: string;
  type: 'LIKE' | 'REPLY' | 'FOLLOW' | 'MENTION';
  read: boolean;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
  };
  tweet?: {
    id: string;
    content: string;
  } | null;
}
