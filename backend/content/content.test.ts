import { describe, it, expect, beforeEach } from "vitest";
import { createContent, getContent, listContent, db } from "./content";
import { ContentType } from "./types";
import { randomUUID } from "crypto";

describe("Content Service", () => {
    beforeEach(async () => {
        // Clean up content_tags first (foreign key constraint)
        await db.exec`DELETE FROM content_tags`;
        // Clean up content_items
        await db.exec`DELETE FROM content_items`;
        // Clean up categories and tags
        await db.exec`DELETE FROM categories`;
        await db.exec`DELETE FROM tags`;
    });

    describe("createContent", () => {
        it("should create a new content item", async () => {
            const authorId = randomUUID();
            const request = {
                title: "Test Article",
                content: "This is test content",
                excerpt: "Test excerpt",
                type: "article" as ContentType,
                author_id: authorId
            };

            const result = await createContent(request);

            expect(result).toBeDefined();
            expect(result.title).toBe("Test Article");
            expect(result.slug).toBe("test-article");
            expect(result.content).toBe("This is test content");
            expect(result.excerpt).toBe("Test excerpt");
            expect(result.type).toBe("article");
            expect(result.author_id).toBe(authorId);
            expect(result.status).toBe("draft"); // Default status
            expect(result.id).toBeDefined();
            expect(result.created_at).toBeDefined();
            expect(result.updated_at).toBeDefined();
        });

        it("should generate proper slug from title", async () => {
            const authorId = randomUUID();
            const request = {
                title: "This Is A Complex Title With Spaces & Special Characters!",
                type: "article" as ContentType,
                author_id: authorId
            };

            const result = await createContent(request);

            expect(result.slug).toBe("this-is-a-complex-title-with-spaces-special-characters");
        });

        it("should handle special characters in slug generation", async () => {
            const authorId = randomUUID();
            const request = {
                title: "C++ Programming & Node.js Development",
                type: "article" as ContentType,
                author_id: authorId
            };

            const result = await createContent(request);

            expect(result.slug).toBe("c-programming-node-js-development");
        });

        it("should handle empty content and excerpt", async () => {
            const authorId = randomUUID();
            const request = {
                title: "Minimal Article",
                type: "page" as ContentType,
                author_id: authorId
            };

            const result = await createContent(request);

            expect(result.title).toBe("Minimal Article");
            expect(result.content).toBe("");
            expect(result.excerpt).toBe("");
            expect(result.type).toBe("page");
        });

        it("should create content with category", async () => {
            const authorId = randomUUID();
            
            // First create a category
            await db.exec`
                INSERT INTO categories (name, slug, description)
                VALUES ('Technology', 'technology', 'Tech articles')
            `;

            const category = await db.queryRow<{ id: string }>`
                SELECT id FROM categories WHERE slug = 'technology'
            `;

            const request = {
                title: "Tech Article",
                type: "article" as ContentType,
                author_id: authorId,
                category_id: category!.id
            };

            const result = await createContent(request);

            expect(result.category_id).toBe(category!.id);
        });

        it("should handle multiple slug generation edge cases", async () => {
            const authorId = randomUUID();
            const testCases = [
                { title: "Hello World!", expected: "hello-world" },
                { title: "C++ Programming", expected: "c-programming" },
                { title: "React.js & Node.js", expected: "react-js-node-js" },
                { title: "   Trimmed   Spaces   ", expected: "trimmed-spaces" },
                { title: "Multiple---Dashes", expected: "multiple-dashes" }
            ];

            for (const testCase of testCases) {
                const result = await createContent({
                    title: testCase.title,
                    type: "article" as ContentType,
                    author_id: authorId
                });

                expect(result.slug).toBe(testCase.expected);
                
                // Cleanup for next iteration
                await db.exec`DELETE FROM content_items WHERE id = ${result.id}`;
            }
        });
    });

    describe("getContent", () => {
        it("should return null for non-existent content", async () => {
            const nonExistentId = randomUUID();
            const result = await getContent({ id: nonExistentId });
            expect(result.content).toBeNull();
        });

        it("should get content item without category or tags", async () => {
            const authorId = randomUUID();
            
            // Create content first
            const created = await createContent({
                title: "Test Content",
                content: "Test body",
                type: "article" as ContentType,
                author_id: authorId
            });

            const result = await getContent({ id: created.id.toString() });

            expect(result.content).toBeDefined();
            expect(result.content!.title).toBe("Test Content");
            expect(result.content!.content).toBe("Test body");
            expect(result.content!.category).toBeUndefined();
            expect(result.content!.tags).toEqual([]);
        });

        it("should get content item with category", async () => {
            const authorId = randomUUID();
            
            // Create category
            await db.exec`
                INSERT INTO categories (name, slug, description)
                VALUES ('News', 'news', 'News articles')
            `;

            const category = await db.queryRow<{ id: string }>`
                SELECT id FROM categories WHERE slug = 'news'
            `;

            // Create content with category
            const created = await createContent({
                title: "News Article",
                type: "article" as ContentType,
                author_id: authorId,
                category_id: category!.id
            });

            const result = await getContent({ id: created.id.toString() });

            expect(result.content).toBeDefined();
            expect(result.content!.category).toBeDefined();
            expect(result.content!.category!.name).toBe("News");
            expect(result.content!.category!.slug).toBe("news");
        });

        it("should get content item with tags", async () => {
            const authorId = randomUUID();
            
            // Create content first
            const created = await createContent({
                title: "Tagged Article",
                type: "article" as ContentType,
                author_id: authorId
            });

            // Create tags
            await db.exec`
                INSERT INTO tags (name) VALUES ('javascript'), ('typescript')
            `;

            // Link tags to content
            await db.exec`
                INSERT INTO content_tags (content_id, tag_id)
                SELECT ${created.id}, id FROM tags WHERE name IN ('javascript', 'typescript')
            `;

            const result = await getContent({ id: created.id.toString() });

            expect(result.content).toBeDefined();
            expect(result.content!.tags).toHaveLength(2);
            expect(result.content!.tags.map(t => t.name).sort()).toEqual(['javascript', 'typescript']);
        });

        it("should get content with both category and tags", async () => {
            const authorId = randomUUID();
            
            // Create category
            await db.exec`
                INSERT INTO categories (name, slug) VALUES ('Programming', 'programming')
            `;

            const category = await db.queryRow<{ id: string }>`
                SELECT id FROM categories WHERE slug = 'programming'
            `;

            // Create content with category
            const created = await createContent({
                title: "Full Article",
                type: "article" as ContentType,
                author_id: authorId,
                category_id: category!.id
            });

            // Create and link tags
            await db.exec`INSERT INTO tags (name) VALUES ('react')`;
            await db.exec`
                INSERT INTO content_tags (content_id, tag_id)
                SELECT ${created.id}, id FROM tags WHERE name = 'react'
            `;

            const result = await getContent({ id: created.id.toString() });

            expect(result.content).toBeDefined();
            expect(result.content!.category).toBeDefined();
            expect(result.content!.category!.name).toBe("Programming");
            expect(result.content!.tags).toHaveLength(1);
            expect(result.content!.tags[0].name).toBe("react");
        });
    });

    describe("listContent", () => {
        beforeEach(async () => {
            const authorId1 = randomUUID();
            const authorId2 = randomUUID();
            
            // Create test content items
            await createContent({
                title: "Published Article",
                type: "article" as ContentType,
                author_id: authorId1
            });

            // Update one to published status
            await db.exec`
                UPDATE content_items 
                SET status = 'published' 
                WHERE title = 'Published Article'
            `;

            await createContent({
                title: "Draft Page",
                type: "page" as ContentType,
                author_id: authorId2
            });

            await createContent({
                title: "Another Article",
                type: "article" as ContentType,
                author_id: authorId1
            });
        });

        it("should list all content with default pagination", async () => {
            const result = await listContent({});

            expect(result.items).toHaveLength(3);
            expect(result.total).toBe(3);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.items[0].title).toBe("Another Article"); // Most recent first
        });

        it("should handle pagination", async () => {
            const result = await listContent({ page: 1, limit: 2 });

            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(3);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(2);
        });

        it("should filter by status", async () => {
            const result = await listContent({ status: "published" });

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.items[0].title).toBe("Published Article");
            expect(result.items[0].status).toBe("published");
        });

        it("should filter by type", async () => {
            const result = await listContent({ type: "article" });

            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.items.every(item => item.type === "article")).toBe(true);
        });

        it("should filter by both status and type", async () => {
            const result = await listContent({ status: "published", type: "article" });

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.items[0].title).toBe("Published Article");
            expect(result.items[0].status).toBe("published");
            expect(result.items[0].type).toBe("article");
        });

        it("should limit maximum items per page", async () => {
            const result = await listContent({ limit: 100 });

            expect(result.limit).toBe(50); // Should be capped at 50
        });

        it("should handle empty results", async () => {
            const result = await listContent({ status: "archived" });

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });

        it("should return items in correct order (newest first)", async () => {
            const result = await listContent({});

            expect(result.items).toHaveLength(3);
            // Should be ordered by created_at DESC
            const timestamps = result.items.map(item => new Date(item.created_at).getTime());
            for (let i = 1; i < timestamps.length; i++) {
                expect(timestamps[i-1]).toBeGreaterThanOrEqual(timestamps[i]);
            }
        });
    });

    describe("Database Schema Validation", () => {
        it("should enforce content type enum", async () => {
            const authorId = randomUUID();
            
            // This should work
            await expect(createContent({
                title: "Valid Type",
                type: "article" as ContentType,
                author_id: authorId
            })).resolves.toBeDefined();

            // Invalid type should be caught by TypeScript, but let's test DB constraint
            await expect(db.exec`
                INSERT INTO content_items (title, slug, type, author_id)
                VALUES ('Invalid', 'invalid', 'invalid_type', ${authorId})
            `).rejects.toThrow();
        });

        it("should enforce content status enum", async () => {
            const authorId = randomUUID();
            
            // Valid status should work
            await db.exec`
                INSERT INTO content_items (title, slug, type, status, author_id)
                VALUES ('Valid Status', 'valid', 'article', 'published', ${authorId})
            `;

            // Invalid status should fail
            await expect(db.exec`
                INSERT INTO content_items (title, slug, type, status, author_id)
                VALUES ('Invalid Status', 'invalid', 'article', 'invalid_status', ${authorId})
            `).rejects.toThrow();
        });

        it("should enforce required fields", async () => {
            const authorId = randomUUID();
            
            // Missing title should fail
            await expect(db.exec`
                INSERT INTO content_items (slug, type, author_id)
                VALUES ('no-title', 'article', ${authorId})
            `).rejects.toThrow();

            // Missing author_id should fail
            await expect(db.exec`
                INSERT INTO content_items (title, slug, type)
                VALUES ('No Author', 'no-author', 'article')
            `).rejects.toThrow();
        });

        it("should enforce unique slug constraint", async () => {
            const authorId = randomUUID();
            
            await createContent({
                title: "First Article",
                type: "article" as ContentType,
                author_id: authorId
            });

            // Same slug should fail
            await expect(db.exec`
                INSERT INTO content_items (title, slug, type, author_id)
                VALUES ('Different Title', 'first-article', 'article', ${authorId})
            `).rejects.toThrow();
        });
    });

    describe("Integration Tests", () => {
        it("should create, retrieve, and list content in a complete workflow", async () => {
            const authorId = randomUUID();
            
            // Create category
            await db.exec`
                INSERT INTO categories (name, slug, description)
                VALUES ('Tutorial', 'tutorial', 'How-to guides')
            `;

            const category = await db.queryRow<{ id: string }>`
                SELECT id FROM categories WHERE slug = 'tutorial'
            `;

            // Create content
            const created = await createContent({
                title: "Complete Tutorial",
                content: "This is a complete tutorial",
                excerpt: "Learn everything",
                type: "article" as ContentType,
                author_id: authorId,
                category_id: category!.id
            });

            // Add tags
            await db.exec`INSERT INTO tags (name) VALUES ('tutorial'), ('beginner')`;
            await db.exec`
                INSERT INTO content_tags (content_id, tag_id)
                SELECT ${created.id}, id FROM tags WHERE name IN ('tutorial', 'beginner')
            `;

            // Retrieve with full details
            const retrieved = await getContent({ id: created.id.toString() });

            expect(retrieved.content).toBeDefined();
            expect(retrieved.content!.title).toBe("Complete Tutorial");
            expect(retrieved.content!.category!.name).toBe("Tutorial");
            expect(retrieved.content!.tags).toHaveLength(2);

            // List and find our content
            const listed = await listContent({});

            expect(listed.items).toHaveLength(1);
            expect(listed.items[0].title).toBe("Complete Tutorial");
        });

        it("should handle content publishing workflow", async () => {
            const authorId = randomUUID();
            
            // Create draft content
            const created = await createContent({
                title: "Draft Article",
                type: "article" as ContentType,
                author_id: authorId
            });

            expect(created.status).toBe("draft");

            // Publish the content
            await db.exec`
                UPDATE content_items 
                SET status = 'published', published_at = NOW()
                WHERE id = ${created.id}
            `;

            // Verify published content appears in published filter
            const publishedList = await listContent({ status: "published" });
            expect(publishedList.items).toHaveLength(1);
            expect(publishedList.items[0].title).toBe("Draft Article");

            // Verify draft filter is now empty
            const draftList = await listContent({ status: "draft" });
            expect(draftList.items).toHaveLength(0);
        });

        it("should handle content with multiple tags", async () => {
            const authorId = randomUUID();
            
            // Create content
            const created = await createContent({
                title: "Multi-Tagged Article",
                type: "article" as ContentType,
                author_id: authorId
            });

            // Create multiple tags
            await db.exec`
                INSERT INTO tags (name) VALUES 
                ('javascript'), ('typescript'), ('react'), ('node'), ('web-development')
            `;

            // Link all tags to content
            await db.exec`
                INSERT INTO content_tags (content_id, tag_id)
                SELECT ${created.id}, id FROM tags
            `;

            // Retrieve and verify
            const retrieved = await getContent({ id: created.id.toString() });

            expect(retrieved.content).toBeDefined();
            expect(retrieved.content!.tags).toHaveLength(5);
            expect(retrieved.content!.tags.map(t => t.name).sort()).toEqual([
                'javascript', 'node', 'react', 'typescript', 'web-development'
            ]);
        });
    });
}); 