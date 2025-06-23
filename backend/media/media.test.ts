import { describe, it, expect, beforeEach } from "vitest";
import { uploadMedia, getMedia, listMedia, db } from "./media";
import { MediaType } from "./types";
import { randomUUID } from "crypto";

describe("Media Service", () => {
    beforeEach(async () => {
        // Clean up media_folder_items first (foreign key constraint)
        await db.exec`DELETE FROM media_folder_items`;
        // Clean up media_items
        await db.exec`DELETE FROM media_items`;
        // Clean up media_folders
        await db.exec`DELETE FROM media_folders`;
    });

    describe("uploadMedia", () => {
        it("should upload a new media item", async () => {
            const uploadedBy = randomUUID();
            const request = {
                filename: "test-image.jpg",
                mime_type: "image/jpeg",
                file_size: 1024000,
                alt_text: "Test image",
                caption: "A test image for testing",
                uploaded_by: uploadedBy
            };

            const result = await uploadMedia(request);

            expect(result).toBeDefined();
            expect(result.original_filename).toBe("test-image.jpg");
            expect(result.mime_type).toBe("image/jpeg");
            expect(result.file_size).toBe(1024000);
            expect(result.type).toBe("image");
            expect(result.alt_text).toBe("Test image");
            expect(result.caption).toBe("A test image for testing");
            expect(result.uploaded_by).toBe(uploadedBy);
            expect(result.filename).toContain("test-image.jpg");
            expect(result.file_path).toContain("/uploads/");
            expect(result.id).toBeDefined();
            expect(result.created_at).toBeDefined();
        });

        it("should detect media type from MIME type", async () => {
            const uploadedBy = randomUUID();
            
            const testCases = [
                { mime_type: "image/png", expected_type: "image" },
                { mime_type: "video/mp4", expected_type: "video" },
                { mime_type: "audio/mp3", expected_type: "audio" },
                { mime_type: "application/pdf", expected_type: "document" }
            ];

            for (const testCase of testCases) {
                const result = await uploadMedia({
                    filename: "test-file",
                    mime_type: testCase.mime_type,
                    file_size: 1000,
                    uploaded_by: uploadedBy
                });

                expect(result.type).toBe(testCase.expected_type);
                
                // Cleanup for next iteration
                await db.exec`DELETE FROM media_items WHERE id = ${result.id}`;
            }
        });

        it("should handle optional fields", async () => {
            const uploadedBy = randomUUID();
            const request = {
                filename: "minimal-file.txt",
                mime_type: "text/plain",
                file_size: 500,
                uploaded_by: uploadedBy
            };

            const result = await uploadMedia(request);

            expect(result.original_filename).toBe("minimal-file.txt");
            expect(result.alt_text).toBeNull();
            expect(result.caption).toBeNull();
            expect(result.width).toBeNull();
            expect(result.height).toBeNull();
            expect(result.duration).toBeNull();
        });

        it("should generate unique filenames", async () => {
            const uploadedBy = randomUUID();
            const baseRequest = {
                filename: "duplicate.jpg",
                mime_type: "image/jpeg",
                file_size: 1000,
                uploaded_by: uploadedBy
            };

            const result1 = await uploadMedia(baseRequest);
            const result2 = await uploadMedia(baseRequest);

            expect(result1.filename).not.toBe(result2.filename);
            expect(result1.filename).toContain("duplicate.jpg");
            expect(result2.filename).toContain("duplicate.jpg");
        });
    });

    describe("getMedia", () => {
        it("should return null for non-existent media", async () => {
            const nonExistentId = randomUUID();
            const result = await getMedia({ id: nonExistentId });
            expect(result.media).toBeNull();
        });

        it("should get media item by ID", async () => {
            const uploadedBy = randomUUID();
            
            // Create media first
            const created = await uploadMedia({
                filename: "test-get.jpg",
                mime_type: "image/jpeg",
                file_size: 2048000,
                alt_text: "Get test image",
                uploaded_by: uploadedBy
            });

            const result = await getMedia({ id: created.id });

            expect(result.media).toBeDefined();
            expect(result.media!.id).toBe(created.id);
            expect(result.media!.original_filename).toBe("test-get.jpg");
            expect(result.media!.mime_type).toBe("image/jpeg");
            expect(result.media!.file_size).toBe(2048000);
            expect(result.media!.alt_text).toBe("Get test image");
            expect(result.media!.uploaded_by).toBe(uploadedBy);
        });

        it("should return all media fields", async () => {
            const uploadedBy = randomUUID();
            
            const created = await uploadMedia({
                filename: "complete-test.mp4",
                mime_type: "video/mp4",
                file_size: 5000000,
                alt_text: "Complete test video",
                caption: "A complete test",
                uploaded_by: uploadedBy
            });

            const result = await getMedia({ id: created.id });

            expect(result.media).toBeDefined();
            expect(result.media!).toHaveProperty('id');
            expect(result.media!).toHaveProperty('filename');
            expect(result.media!).toHaveProperty('original_filename');
            expect(result.media!).toHaveProperty('file_path');
            expect(result.media!).toHaveProperty('file_size');
            expect(result.media!).toHaveProperty('mime_type');
            expect(result.media!).toHaveProperty('type');
            expect(result.media!).toHaveProperty('width');
            expect(result.media!).toHaveProperty('height');
            expect(result.media!).toHaveProperty('duration');
            expect(result.media!).toHaveProperty('alt_text');
            expect(result.media!).toHaveProperty('caption');
            expect(result.media!).toHaveProperty('uploaded_by');
            expect(result.media!).toHaveProperty('created_at');
        });
    });

    describe("listMedia", () => {
        beforeEach(async () => {
            const uploadedBy1 = randomUUID();
            const uploadedBy2 = randomUUID();
            
            // Create test media items
            await uploadMedia({
                filename: "image1.jpg",
                mime_type: "image/jpeg",
                file_size: 1000,
                uploaded_by: uploadedBy1
            });

            await uploadMedia({
                filename: "video1.mp4",
                mime_type: "video/mp4",
                file_size: 5000,
                uploaded_by: uploadedBy2
            });

            await uploadMedia({
                filename: "document1.pdf",
                mime_type: "application/pdf",
                file_size: 2000,
                uploaded_by: uploadedBy1
            });
        });

        it("should list all media with default pagination", async () => {
            const result = await listMedia({});

            expect(result.items).toHaveLength(3);
            expect(result.total).toBe(3);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(20);
            // Should be ordered by created_at DESC (newest first)
            expect(result.items[0].original_filename).toBe("document1.pdf");
        });

        it("should handle pagination", async () => {
            const result = await listMedia({ page: 1, limit: 2 });

            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(3);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(2);
        });

        it("should filter by media type", async () => {
            const result = await listMedia({ type: "image" });

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.items[0].type).toBe("image");
            expect(result.items[0].original_filename).toBe("image1.jpg");
        });

        it("should filter by video type", async () => {
            const result = await listMedia({ type: "video" });

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.items[0].type).toBe("video");
            expect(result.items[0].original_filename).toBe("video1.mp4");
        });

        it("should filter by document type", async () => {
            const result = await listMedia({ type: "document" });

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.items[0].type).toBe("document");
            expect(result.items[0].original_filename).toBe("document1.pdf");
        });

        it("should limit maximum items per page", async () => {
            const result = await listMedia({ limit: 100 });

            expect(result.limit).toBe(50); // Should be capped at 50
        });

        it("should handle empty results", async () => {
            const result = await listMedia({ type: "audio" });

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(20);
        });

        it("should return items in correct order (newest first)", async () => {
            const result = await listMedia({});

            expect(result.items).toHaveLength(3);
            // Should be ordered by created_at DESC
            const timestamps = result.items.map(item => new Date(item.created_at).getTime());
            for (let i = 1; i < timestamps.length; i++) {
                expect(timestamps[i-1]).toBeGreaterThanOrEqual(timestamps[i]);
            }
        });
    });

    describe("Database Schema Validation", () => {
        it("should enforce media type enum", async () => {
            const uploadedBy = randomUUID();
            
            // Valid types should work
            const validTypes = ['image', 'video', 'document', 'audio'];
            for (const type of validTypes) {
                await db.exec`
                    INSERT INTO media_items (filename, original_filename, file_path, file_size, mime_type, type, uploaded_by)
                    VALUES ('test.file', 'test.file', '/test', 1000, 'test/type', ${type}, ${uploadedBy})
                `;
                
                // Cleanup
                await db.exec`DELETE FROM media_items WHERE filename = 'test.file'`;
            }

            // Invalid type should fail
            await expect(db.exec`
                INSERT INTO media_items (filename, original_filename, file_path, file_size, mime_type, type, uploaded_by)
                VALUES ('invalid.file', 'invalid.file', '/invalid', 1000, 'invalid/type', 'invalid_type', ${uploadedBy})
            `).rejects.toThrow();
        });

        it("should enforce required fields", async () => {
            const uploadedBy = randomUUID();
            
            // Missing filename should fail
            await expect(db.exec`
                INSERT INTO media_items (original_filename, file_path, file_size, mime_type, type, uploaded_by)
                VALUES ('test.file', '/test', 1000, 'test/type', 'image', ${uploadedBy})
            `).rejects.toThrow();

            // Missing uploaded_by should fail
            await expect(db.exec`
                INSERT INTO media_items (filename, original_filename, file_path, file_size, mime_type, type)
                VALUES ('test.file', 'test.file', '/test', 1000, 'test/type', 'image')
            `).rejects.toThrow();
        });

        it("should handle optional fields correctly", async () => {
            const uploadedBy = randomUUID();
            
            // Should work without optional fields
            await db.exec`
                INSERT INTO media_items (filename, original_filename, file_path, file_size, mime_type, type, uploaded_by)
                VALUES ('optional.file', 'optional.file', '/optional', 1000, 'image/jpeg', 'image', ${uploadedBy})
            `;

            const result = await db.queryRow`
                SELECT width, height, duration, alt_text, caption
                FROM media_items 
                WHERE filename = 'optional.file'
            `;

            expect(result?.width).toBeNull();
            expect(result?.height).toBeNull();
            expect(result?.duration).toBeNull();
            expect(result?.alt_text).toBeNull();
            expect(result?.caption).toBeNull();
        });
    });

    describe("Media Folder Integration", () => {
        it("should create media folders", async () => {
            const createdBy = randomUUID();
            
            await db.exec`
                INSERT INTO media_folders (name, created_by)
                VALUES ('Test Folder', ${createdBy})
            `;

            const folder = await db.queryRow`
                SELECT id, name, parent_id, created_by, created_at
                FROM media_folders 
                WHERE name = 'Test Folder'
            `;

            expect(folder).toBeDefined();
            expect(folder!.name).toBe('Test Folder');
            expect(folder!.created_by).toBe(createdBy);
            expect(folder!.parent_id).toBeNull();
        });

        it("should support hierarchical folders", async () => {
            const createdBy = randomUUID();
            
            // Create parent folder
            await db.exec`
                INSERT INTO media_folders (name, created_by)
                VALUES ('Parent Folder', ${createdBy})
            `;

            const parent = await db.queryRow<{ id: string }>`
                SELECT id FROM media_folders WHERE name = 'Parent Folder'
            `;

            // Create child folder
            await db.exec`
                INSERT INTO media_folders (name, parent_id, created_by)
                VALUES ('Child Folder', ${parent!.id}, ${createdBy})
            `;

            const child = await db.queryRow`
                SELECT name, parent_id FROM media_folders WHERE name = 'Child Folder'
            `;

            expect(child).toBeDefined();
            expect(child!.parent_id).toBe(parent!.id);
        });

        it("should link media to folders", async () => {
            const uploadedBy = randomUUID();
            const createdBy = randomUUID();
            
            // Create folder
            await db.exec`
                INSERT INTO media_folders (name, created_by)
                VALUES ('Media Folder', ${createdBy})
            `;

            const folder = await db.queryRow<{ id: string }>`
                SELECT id FROM media_folders WHERE name = 'Media Folder'
            `;

            // Create media
            const media = await uploadMedia({
                filename: "folder-test.jpg",
                mime_type: "image/jpeg",
                file_size: 1000,
                uploaded_by: uploadedBy
            });

            // Link media to folder
            await db.exec`
                INSERT INTO media_folder_items (media_id, folder_id)
                VALUES (${media.id}, ${folder!.id})
            `;

            // Verify link
            const link = await db.queryRow`
                SELECT media_id, folder_id
                FROM media_folder_items 
                WHERE media_id = ${media.id} AND folder_id = ${folder!.id}
            `;

            expect(link).toBeDefined();
            expect(link!.media_id).toBe(media.id);
            expect(link!.folder_id).toBe(folder!.id);
        });
    });

    describe("Integration Tests", () => {
        it("should handle complete media upload and retrieval workflow", async () => {
            const uploadedBy = randomUUID();
            
            // Upload media
            const uploaded = await uploadMedia({
                filename: "workflow-test.png",
                mime_type: "image/png",
                file_size: 1500000,
                alt_text: "Workflow test image",
                caption: "Testing complete workflow",
                uploaded_by: uploadedBy
            });

            expect(uploaded.type).toBe("image");
            expect(uploaded.original_filename).toBe("workflow-test.png");

            // Retrieve by ID
            const retrieved = await getMedia({ id: uploaded.id });

            expect(retrieved.media).toBeDefined();
            expect(retrieved.media!.id).toBe(uploaded.id);
            expect(retrieved.media!.alt_text).toBe("Workflow test image");
            expect(retrieved.media!.caption).toBe("Testing complete workflow");

            // Find in list
            const listed = await listMedia({ type: "image" });

            expect(listed.items).toHaveLength(1);
            expect(listed.items[0].id).toBe(uploaded.id);
            expect(listed.items[0].original_filename).toBe("workflow-test.png");
        });

        it("should handle multiple media types in listing", async () => {
            const uploadedBy = randomUUID();
            
            // Upload different media types
            await uploadMedia({
                filename: "test.jpg",
                mime_type: "image/jpeg",
                file_size: 1000,
                uploaded_by: uploadedBy
            });

            await uploadMedia({
                filename: "test.mp4",
                mime_type: "video/mp4",
                file_size: 5000,
                uploaded_by: uploadedBy
            });

            await uploadMedia({
                filename: "test.mp3",
                mime_type: "audio/mpeg",
                file_size: 3000,
                uploaded_by: uploadedBy
            });

            // List all media
            const allMedia = await listMedia({});
            expect(allMedia.items).toHaveLength(3);

            // List by type
            const images = await listMedia({ type: "image" });
            expect(images.items).toHaveLength(1);
            expect(images.items[0].type).toBe("image");

            const videos = await listMedia({ type: "video" });
            expect(videos.items).toHaveLength(1);
            expect(videos.items[0].type).toBe("video");

            const audio = await listMedia({ type: "audio" });
            expect(audio.items).toHaveLength(1);
            expect(audio.items[0].type).toBe("audio");
        });
    });
}); 