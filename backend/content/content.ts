import { SQLDatabase } from "encore.dev/storage/sqldb";
import { api } from "encore.dev/api";
import { CreateContentRequest, ContentItem, ContentWithDetails, Category, Tag } from "./types";

interface GetContentResponse {
    content: ContentWithDetails | null;
}

const db = new SQLDatabase("content", {
    migrations: "./migrations",
});

export { db };

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export const createContent = api(
    { method: "POST", path: "/content", auth: true },
    async (req: CreateContentRequest & { author_id: string }): Promise<ContentItem> => {
        const slug = generateSlug(req.title);
        
        // Insert content item
        await db.exec`
            INSERT INTO content_items (title, slug, content, excerpt, type, author_id, category_id)
            VALUES (${req.title}, ${slug}, ${req.content || ''}, ${req.excerpt || ''}, ${req.type}, ${req.author_id}, ${req.category_id || null})
        `;
        
        // Get created content
        const content = await db.queryRow<ContentItem>`
            SELECT id, title, slug, content, excerpt, status, type, author_id, category_id, published_at, created_at, updated_at
            FROM content_items 
            WHERE slug = ${slug}
        `;
        
        if (!content) {
            throw new Error("Failed to create content");
        }
        
        return content;
    }
);

export const getContent = api(
    { method: "GET", path: "/content/:id" },
    async ({ id }: { id: string }): Promise<GetContentResponse> => {
        // Get content item
        const content = await db.queryRow<ContentItem>`
            SELECT id, title, slug, content, excerpt, status, type, author_id, category_id, published_at, created_at, updated_at
            FROM content_items 
            WHERE id = ${id}
        `;
        
        if (!content) {
            return { content: null };
        }
        
        // Get category if exists
        let category: Category | undefined = undefined;
        if (content.category_id) {
            const categoryResult = await db.queryRow<Category>`
                SELECT id, name, slug, description, parent_id, created_at
                FROM categories 
                WHERE id = ${content.category_id}
            `;
            category = categoryResult || undefined;
        }
        
        // Get tags
        const tagQuery = await db.query<Tag>`
            SELECT t.id, t.name, t.created_at
            FROM tags t
            JOIN content_tags ct ON t.id = ct.tag_id
            WHERE ct.content_id = ${id}
        `;
        
        const tags: Tag[] = [];
        for await (const tag of tagQuery) {
            tags.push(tag);
        }
        
        return {
            content: {
                ...content,
                category,
                tags
            }
        };
    }
);

interface ListContentRequest {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
}

interface ListContentResponse {
    items: ContentItem[];
    total: number;
    page: number;
    limit: number;
}

export const listContent = api(
    { method: "GET", path: "/content" },
    async (req: ListContentRequest): Promise<ListContentResponse> => {
        const page = req.page || 1;
        const limit = Math.min(req.limit || 10, 50); // Max 50 items per page
        const offset = (page - 1) * limit;
        
        // Build base query conditions
        let countQuery, itemsQuery;
        
        if (req.status && req.type) {
            // Both filters
            countQuery = db.queryRow<{ total: number }>`
                SELECT COUNT(*) as total FROM content_items 
                WHERE status = ${req.status} AND type = ${req.type}
            `;
            itemsQuery = db.query<ContentItem>`
                SELECT id, title, slug, content, excerpt, status, type, author_id, category_id, published_at, created_at, updated_at
                FROM content_items 
                WHERE status = ${req.status} AND type = ${req.type}
                ORDER BY created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
        } else if (req.status) {
            // Status filter only
            countQuery = db.queryRow<{ total: number }>`
                SELECT COUNT(*) as total FROM content_items 
                WHERE status = ${req.status}
            `;
            itemsQuery = db.query<ContentItem>`
                SELECT id, title, slug, content, excerpt, status, type, author_id, category_id, published_at, created_at, updated_at
                FROM content_items 
                WHERE status = ${req.status}
                ORDER BY created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
        } else if (req.type) {
            // Type filter only
            countQuery = db.queryRow<{ total: number }>`
                SELECT COUNT(*) as total FROM content_items 
                WHERE type = ${req.type}
            `;
            itemsQuery = db.query<ContentItem>`
                SELECT id, title, slug, content, excerpt, status, type, author_id, category_id, published_at, created_at, updated_at
                FROM content_items 
                WHERE type = ${req.type}
                ORDER BY created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
        } else {
            // No filters
            countQuery = db.queryRow<{ total: number }>`
                SELECT COUNT(*) as total FROM content_items
            `;
            itemsQuery = db.query<ContentItem>`
                SELECT id, title, slug, content, excerpt, status, type, author_id, category_id, published_at, created_at, updated_at
                FROM content_items 
                ORDER BY created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
        }
        
        // Execute queries
        const countResult = await countQuery;
        const total = countResult?.total || 0;
        
        const items: ContentItem[] = [];
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