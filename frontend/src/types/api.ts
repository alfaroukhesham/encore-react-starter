// User types
export interface User {
    id: string;
    email: string;
    is_verified: boolean;
}

export interface UserProfile {
    id: string;
    user_id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    bio?: string;
    created_at: string;
    updated_at: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    token: string;
}

// Content types
export type ContentStatus = 'draft' | 'review' | 'published' | 'archived';
export type ContentType = 'article' | 'page' | 'blog_post';

export interface ContentItem {
    id: string;
    title: string;
    slug: string;
    content?: string;
    excerpt?: string;
    status: ContentStatus;
    type: ContentType;
    author_id: string;
    category_id?: string;
    published_at?: string;
    created_at: string;
    updated_at: string;
}

// Media types
export type MediaType = 'image' | 'video' | 'document' | 'audio';

export interface MediaItem {
    id: string;
    filename: string;
    original_filename: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    type: MediaType;
    width?: number;
    height?: number;
    duration?: number;
    alt_text?: string;
    caption?: string;
    uploaded_by: string;
    created_at: string;
}