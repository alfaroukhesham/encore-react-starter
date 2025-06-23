// Media management types will be defined here 

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
    created_at: Date;
}

export interface MediaFolder {
    id: string;
    name: string;
    parent_id?: string;
    created_by: string;
    created_at: Date;
}

export interface UploadMediaRequest {
    file: Buffer;
    filename: string;
    mime_type: string;
    alt_text?: string;
    caption?: string;
    folder_id?: string;
}

export interface UpdateMediaRequest {
    alt_text?: string;
    caption?: string;
    folder_id?: string;
}

export interface ListMediaRequest {
    folder_id?: string;
    type?: MediaType;
    page?: number;
    limit?: number;
}

export interface ListMediaResponse {
    items: MediaItem[];
    total: number;
    page: number;
    limit: number;
}

// Response wrapper interfaces for Encore.ts compatibility
export interface GetMediaResponse {
    media: MediaItem | null;
} 