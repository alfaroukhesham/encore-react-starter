import { describe, it, expect } from "vitest";
import { 
    ContentStatus, 
    ContentType, 
    Category, 
    Tag, 
    ContentItem, 
    CreateContentRequest, 
    UpdateContentRequest, 
    ContentWithDetails 
} from "./types";

describe("Content Types", () => {
    describe("ContentStatus", () => {
        it("should have all expected status values", () => {
            const validStatuses: ContentStatus[] = ['draft', 'review', 'published', 'archived'];
            
            validStatuses.forEach(status => {
                const testStatus: ContentStatus = status;
                expect(testStatus).toBe(status);
            });
        });

        it("should be assignable to string", () => {
            const status: ContentStatus = 'draft';
            const statusString: string = status;
            expect(statusString).toBe('draft');
        });
    });

    describe("ContentType", () => {
        it("should have all expected type values", () => {
            const validTypes: ContentType[] = ['article', 'page', 'blog_post'];
            
            validTypes.forEach(type => {
                const testType: ContentType = type;
                expect(testType).toBe(type);
            });
        });

        it("should be assignable to string", () => {
            const type: ContentType = 'article';
            const typeString: string = type;
            expect(typeString).toBe('article');
        });
    });

    describe("Category interface", () => {
        it("should accept valid category object", () => {
            const category: Category = {
                id: "1",
                name: "Technology",
                slug: "technology",
                description: "Tech articles",
                parent_id: "2",
                created_at: new Date()
            };

            expect(category.id).toBe("1");
            expect(category.name).toBe("Technology");
            expect(category.slug).toBe("technology");
            expect(category.description).toBe("Tech articles");
            expect(category.parent_id).toBe("2");
            expect(category.created_at).toBeInstanceOf(Date);
        });

        it("should accept category without optional fields", () => {
            const category: Category = {
                id: "1",
                name: "Technology",
                slug: "technology",
                created_at: new Date()
            };

            expect(category.description).toBeUndefined();
            expect(category.parent_id).toBeUndefined();
        });

        it("should handle hierarchical categories", () => {
            const parent: Category = {
                id: "1",
                name: "Technology",
                slug: "technology",
                created_at: new Date()
            };

            const child: Category = {
                id: "2",
                name: "JavaScript",
                slug: "javascript",
                parent_id: parent.id,
                created_at: new Date()
            };

            expect(child.parent_id).toBe(parent.id);
        });
    });

    describe("Tag interface", () => {
        it("should accept valid tag object", () => {
            const tag: Tag = {
                id: "1",
                name: "javascript",
                created_at: new Date()
            };

            expect(tag.id).toBe("1");
            expect(tag.name).toBe("javascript");
            expect(tag.created_at).toBeInstanceOf(Date);
        });

        it("should handle tag arrays", () => {
            const tags: Tag[] = [
                { id: "1", name: "javascript", created_at: new Date() },
                { id: "2", name: "typescript", created_at: new Date() },
                { id: "3", name: "react", created_at: new Date() }
            ];

            expect(tags).toHaveLength(3);
            expect(tags.map(t => t.name)).toEqual(['javascript', 'typescript', 'react']);
        });
    });

    describe("ContentItem interface", () => {
        it("should accept valid content item", () => {
            const contentItem: ContentItem = {
                id: "1",
                title: "Test Article",
                slug: "test-article",
                content: "This is test content",
                excerpt: "Test excerpt",
                status: "draft",
                type: "article",
                author_id: "user123",
                category_id: "cat1",
                published_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            };

            expect(contentItem.id).toBe("1");
            expect(contentItem.title).toBe("Test Article");
            expect(contentItem.slug).toBe("test-article");
            expect(contentItem.status).toBe("draft");
            expect(contentItem.type).toBe("article");
        });

        it("should accept content item without optional fields", () => {
            const contentItem: ContentItem = {
                id: "1",
                title: "Minimal Article",
                slug: "minimal-article",
                status: "draft",
                type: "page",
                author_id: "user123",
                created_at: new Date(),
                updated_at: new Date()
            };

            expect(contentItem.content).toBeUndefined();
            expect(contentItem.excerpt).toBeUndefined();
            expect(contentItem.category_id).toBeUndefined();
            expect(contentItem.published_at).toBeUndefined();
        });

        it("should enforce type constraints", () => {
            const contentItem: ContentItem = {
                id: "1",
                title: "Type Test",
                slug: "type-test",
                status: "published",
                type: "blog_post",
                author_id: "user123",
                created_at: new Date(),
                updated_at: new Date()
            };

            // TypeScript should enforce these are valid enum values
            expect(['draft', 'review', 'published', 'archived']).toContain(contentItem.status);
            expect(['article', 'page', 'blog_post']).toContain(contentItem.type);
        });
    });

    describe("CreateContentRequest interface", () => {
        it("should accept minimal create request", () => {
            const request: CreateContentRequest = {
                title: "New Article",
                type: "article"
            };

            expect(request.title).toBe("New Article");
            expect(request.type).toBe("article");
            expect(request.content).toBeUndefined();
            expect(request.excerpt).toBeUndefined();
            expect(request.category_id).toBeUndefined();
            expect(request.tag_ids).toBeUndefined();
        });

        it("should accept full create request", () => {
            const request: CreateContentRequest = {
                title: "Complete Article",
                content: "Full content here",
                excerpt: "Brief excerpt",
                type: "article",
                category_id: "cat1",
                tag_ids: ["tag1", "tag2", "tag3"]
            };

            expect(request.title).toBe("Complete Article");
            expect(request.content).toBe("Full content here");
            expect(request.excerpt).toBe("Brief excerpt");
            expect(request.type).toBe("article");
            expect(request.category_id).toBe("cat1");
            expect(request.tag_ids).toEqual(["tag1", "tag2", "tag3"]);
        });

        it("should handle different content types", () => {
            const articleRequest: CreateContentRequest = {
                title: "Article",
                type: "article"
            };

            const pageRequest: CreateContentRequest = {
                title: "Page",
                type: "page"
            };

            const blogRequest: CreateContentRequest = {
                title: "Blog Post",
                type: "blog_post"
            };

            expect(articleRequest.type).toBe("article");
            expect(pageRequest.type).toBe("page");
            expect(blogRequest.type).toBe("blog_post");
        });
    });

    describe("UpdateContentRequest interface", () => {
        it("should accept empty update request", () => {
            const request: UpdateContentRequest = {};

            expect(Object.keys(request)).toHaveLength(0);
        });

        it("should accept partial update request", () => {
            const request: UpdateContentRequest = {
                title: "Updated Title",
                status: "published"
            };

            expect(request.title).toBe("Updated Title");
            expect(request.status).toBe("published");
            expect(request.content).toBeUndefined();
            expect(request.excerpt).toBeUndefined();
        });

        it("should accept full update request", () => {
            const request: UpdateContentRequest = {
                title: "Updated Article",
                content: "Updated content",
                excerpt: "Updated excerpt",
                status: "published",
                category_id: "newcat",
                tag_ids: ["newtag1", "newtag2"]
            };

            expect(request.title).toBe("Updated Article");
            expect(request.content).toBe("Updated content");
            expect(request.status).toBe("published");
            expect(request.category_id).toBe("newcat");
            expect(request.tag_ids).toEqual(["newtag1", "newtag2"]);
        });

        it("should handle status changes", () => {
            const statusUpdates: UpdateContentRequest[] = [
                { status: "draft" },
                { status: "review" },
                { status: "published" },
                { status: "archived" }
            ];

            statusUpdates.forEach(update => {
                expect(['draft', 'review', 'published', 'archived']).toContain(update.status);
            });
        });
    });

    describe("ContentWithDetails interface", () => {
        it("should extend ContentItem with additional fields", () => {
            const baseContent: ContentItem = {
                id: "1",
                title: "Test Article",
                slug: "test-article",
                status: "draft",
                type: "article",
                author_id: "user123",
                created_at: new Date(),
                updated_at: new Date()
            };

            const contentWithDetails: ContentWithDetails = {
                ...baseContent,
                category: {
                    id: "cat1",
                    name: "Technology",
                    slug: "technology",
                    created_at: new Date()
                },
                tags: [
                    { id: "tag1", name: "javascript", created_at: new Date() },
                    { id: "tag2", name: "typescript", created_at: new Date() }
                ]
            };

            expect(contentWithDetails.id).toBe("1");
            expect(contentWithDetails.title).toBe("Test Article");
            expect(contentWithDetails.category).toBeDefined();
            expect(contentWithDetails.category!.name).toBe("Technology");
            expect(contentWithDetails.tags).toHaveLength(2);
            expect(contentWithDetails.tags[0].name).toBe("javascript");
        });

        it("should handle content without category", () => {
            const contentWithDetails: ContentWithDetails = {
                id: "1",
                title: "Uncategorized Article",
                slug: "uncategorized-article",
                status: "draft",
                type: "article",
                author_id: "user123",
                created_at: new Date(),
                updated_at: new Date(),
                tags: []
            };

            expect(contentWithDetails.category).toBeUndefined();
            expect(contentWithDetails.tags).toEqual([]);
        });

        it("should handle content with category but no tags", () => {
            const contentWithDetails: ContentWithDetails = {
                id: "1",
                title: "Categorized Article",
                slug: "categorized-article",
                status: "draft",
                type: "article",
                author_id: "user123",
                created_at: new Date(),
                updated_at: new Date(),
                category: {
                    id: "cat1",
                    name: "News",
                    slug: "news",
                    created_at: new Date()
                },
                tags: []
            };

            expect(contentWithDetails.category).toBeDefined();
            expect(contentWithDetails.category!.name).toBe("News");
            expect(contentWithDetails.tags).toEqual([]);
        });
    });

    describe("Type Compatibility", () => {
        it("should allow ContentItem to be used where ContentWithDetails is expected (with proper transformation)", () => {
            const contentItem: ContentItem = {
                id: "1",
                title: "Test",
                slug: "test",
                status: "draft",
                type: "article",
                author_id: "user123",
                created_at: new Date(),
                updated_at: new Date()
            };

            // Transform ContentItem to ContentWithDetails
            const contentWithDetails: ContentWithDetails = {
                ...contentItem,
                tags: []
            };

            expect(contentWithDetails.id).toBe(contentItem.id);
            expect(contentWithDetails.title).toBe(contentItem.title);
            expect(contentWithDetails.tags).toEqual([]);
        });

        it("should handle date serialization compatibility", () => {
            const now = new Date();
            const content: ContentItem = {
                id: "1",
                title: "Date Test",
                slug: "date-test",
                status: "published",
                type: "article",
                author_id: "user123",
                published_at: now,
                created_at: now,
                updated_at: now
            };

            // Dates should be serializable to JSON
            const serialized = JSON.stringify(content);
            const parsed = JSON.parse(serialized);

            expect(parsed.published_at).toBe(now.toISOString());
            expect(parsed.created_at).toBe(now.toISOString());
            expect(parsed.updated_at).toBe(now.toISOString());
        });
    });
}); 