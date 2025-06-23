// Content Types will be defined here

export type ContentStatus = 'draft' | 'review' | 'published' | 'archived';
export type ContentType = 'article' | 'page' | 'blog_post';

export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    parent_id?: string;
    created_at: Date;
}

export interface Tag {
    id: string;
    name: string;
    created_at: Date;
}

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
    published_at?: Date;
    created_at: Date;
    updated_at: Date;
}

export interface CreateContentRequest {
    title: string;
    content?: string;
    excerpt?: string;
    type: ContentType;
    category_id?: string;
    tag_ids?: string[];
}

export interface UpdateContentRequest {
    title?: string;
    content?: string;
    excerpt?: string;
    status?: ContentStatus;
    category_id?: string;
    tag_ids?: string[];
}

export interface ContentWithDetails extends ContentItem {
    category?: Category;
    tags: Tag[];
}