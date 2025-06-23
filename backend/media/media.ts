import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("media", {
    migrations: "./migrations",
});

export { db };

import { api } from "encore.dev/api";
import { MediaItem, MediaType, ListMediaRequest, ListMediaResponse, GetMediaResponse } from "./types";
import { v4 as uuidv4 } from "uuid";

function getMediaTypeFromMime(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
}

interface UploadRequest {
    filename: string;
    mime_type: string;
    file_size: number;
    alt_text?: string;
    caption?: string;
    uploaded_by: string;
}

export const uploadMedia = api(
    { method: "POST", path: "/upload", auth: true },
    async (req: UploadRequest): Promise<MediaItem> => {
        const id = uuidv4();
        const type = getMediaTypeFromMime(req.mime_type);
        const filename = `${id}_${req.filename}`;
        const file_path = `/uploads/${filename}`;
        
        // Insert media item
        await db.exec`
            INSERT INTO media_items (
                id, filename, original_filename, file_path, file_size, 
                mime_type, type, alt_text, caption, uploaded_by
            )
            VALUES (
                ${id}, ${filename}, ${req.filename}, ${file_path}, ${req.file_size},
                ${req.mime_type}, ${type}, ${req.alt_text || null}, ${req.caption || null}, ${req.uploaded_by}
            )
        `;
        
        // Get created media item
        const media = await db.queryRow<MediaItem>`
            SELECT id, filename, original_filename, file_path, file_size, mime_type, type, 
                   width, height, duration, alt_text, caption, uploaded_by, created_at
            FROM media_items 
            WHERE id = ${id}
        `;
        
        if (!media) {
            throw new Error("Failed to create media item");
        }
        
        return media;
    }
);

export const getMedia = api(
    { method: "GET", path: "/media/:id" },
    async ({ id }: { id: string }): Promise<GetMediaResponse> => {
        const media = await db.queryRow<MediaItem>`
            SELECT id, filename, original_filename, file_path, file_size, mime_type, type, 
                   width, height, duration, alt_text, caption, uploaded_by, created_at
            FROM media_items 
            WHERE id = ${id}
        `;
        
        return { media: media || null };
    }
);

export const listMedia = api(
    { method: "GET", path: "/media" },
    async (req: ListMediaRequest): Promise<ListMediaResponse> => {
        const page = req.page || 1;
        const limit = Math.min(req.limit || 20, 50);
        const offset = (page - 1) * limit;
        
        let countResult: { total: number } | null;
        let itemsQuery: AsyncIterable<MediaItem>;
        
        // Handle different filtering cases
        if (req.type && req.folder_id) {
            // Filter by both type and folder
            countResult = await db.queryRow<{ total: number }>`
                SELECT COUNT(*) as total
                FROM media_items
                WHERE type = ${req.type}
                AND id IN (SELECT media_id FROM media_folder_items WHERE folder_id = ${req.folder_id})
            `;
            
            itemsQuery = await db.query<MediaItem>`
                SELECT id, filename, original_filename, file_path, file_size, mime_type, type, 
                       width, height, duration, alt_text, caption, uploaded_by, created_at
                FROM media_items
                WHERE type = ${req.type}
                AND id IN (SELECT media_id FROM media_folder_items WHERE folder_id = ${req.folder_id})
                ORDER BY created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
        } else if (req.type) {
            // Filter by type only
            countResult = await db.queryRow<{ total: number }>`
                SELECT COUNT(*) as total
                FROM media_items
                WHERE type = ${req.type}
            `;
            
            itemsQuery = await db.query<MediaItem>`
                SELECT id, filename, original_filename, file_path, file_size, mime_type, type, 
                       width, height, duration, alt_text, caption, uploaded_by, created_at
                FROM media_items
                WHERE type = ${req.type}
                ORDER BY created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
        } else if (req.folder_id) {
            // Filter by folder only
            countResult = await db.queryRow<{ total: number }>`
                SELECT COUNT(*) as total
                FROM media_items
                WHERE id IN (SELECT media_id FROM media_folder_items WHERE folder_id = ${req.folder_id})
            `;
            
            itemsQuery = await db.query<MediaItem>`
                SELECT id, filename, original_filename, file_path, file_size, mime_type, type, 
                       width, height, duration, alt_text, caption, uploaded_by, created_at
                FROM media_items
                WHERE id IN (SELECT media_id FROM media_folder_items WHERE folder_id = ${req.folder_id})
                ORDER BY created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
        } else {
            // No filters - get all media
            countResult = await db.queryRow<{ total: number }>`
                SELECT COUNT(*) as total
                FROM media_items
            `;
            
            itemsQuery = await db.query<MediaItem>`
                SELECT id, filename, original_filename, file_path, file_size, mime_type, type, 
                       width, height, duration, alt_text, caption, uploaded_by, created_at
                FROM media_items
                ORDER BY created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
        }
        
        const total = countResult?.total || 0;
        
        const items = [];
        for await (const item of itemsQuery) {
            items.push(item);
        }
        
        return {
            items,
            total,
            page,
            limit
        };
    }
); 