import { describe, it, expect } from "vitest";
import type { 
    MediaType, 
    MediaItem, 
    MediaFolder, 
    UploadMediaRequest, 
    UpdateMediaRequest, 
    ListMediaRequest, 
    ListMediaResponse 
} from "./types";

describe("Media Types", () => {
    describe("MediaType", () => {
        it("should have all expected media type values", () => {
            const validTypes: MediaType[] = ['image', 'video', 'document', 'audio'];
            
            validTypes.forEach(type => {
                expect(['image', 'video', 'document', 'audio']).toContain(type);
            });
        });

        it("should be assignable to string", () => {
            const mediaType: MediaType = 'image';
            const asString: string = mediaType;
            expect(asString).toBe('image');
        });
    });

    describe("MediaItem interface", () => {
        it("should accept valid media item object", () => {
            const mediaItem: MediaItem = {
                id: "123e4567-e89b-12d3-a456-426614174000",
                filename: "uuid_test-image.jpg",
                original_filename: "test-image.jpg",
                file_path: "/uploads/uuid_test-image.jpg",
                file_size: 1024000,
                mime_type: "image/jpeg",
                type: "image",
                width: 1920,
                height: 1080,
                duration: undefined,
                alt_text: "Test image",
                caption: "A test image for testing",
                uploaded_by: "user123",
                created_at: new Date()
            };

            expect(mediaItem.id).toBeDefined();
            expect(mediaItem.filename).toBe("uuid_test-image.jpg");
            expect(mediaItem.type).toBe("image");
            expect(mediaItem.file_size).toBe(1024000);
        });

        it("should accept media item without optional fields", () => {
            const mediaItem: MediaItem = {
                id: "123e4567-e89b-12d3-a456-426614174001",
                filename: "minimal.txt",
                original_filename: "minimal.txt",
                file_path: "/uploads/minimal.txt",
                file_size: 500,
                mime_type: "text/plain",
                type: "document",
                uploaded_by: "user456",
                created_at: new Date()
            };

            expect(mediaItem.width).toBeUndefined();
            expect(mediaItem.height).toBeUndefined();
            expect(mediaItem.duration).toBeUndefined();
            expect(mediaItem.alt_text).toBeUndefined();
            expect(mediaItem.caption).toBeUndefined();
        });

        it("should handle different media types", () => {
            const imageItem: MediaItem = {
                id: "img-id",
                filename: "image.jpg",
                original_filename: "image.jpg",
                file_path: "/uploads/image.jpg",
                file_size: 2000000,
                mime_type: "image/jpeg",
                type: "image",
                width: 1920,
                height: 1080,
                uploaded_by: "user1",
                created_at: new Date()
            };

            const videoItem: MediaItem = {
                id: "vid-id",
                filename: "video.mp4",
                original_filename: "video.mp4",
                file_path: "/uploads/video.mp4",
                file_size: 50000000,
                mime_type: "video/mp4",
                type: "video",
                width: 1920,
                height: 1080,
                duration: 120,
                uploaded_by: "user2",
                created_at: new Date()
            };

            const audioItem: MediaItem = {
                id: "aud-id",
                filename: "audio.mp3",
                original_filename: "audio.mp3",
                file_path: "/uploads/audio.mp3",
                file_size: 5000000,
                mime_type: "audio/mpeg",
                type: "audio",
                duration: 180,
                uploaded_by: "user3",
                created_at: new Date()
            };

            expect(imageItem.type).toBe("image");
            expect(videoItem.type).toBe("video");
            expect(audioItem.type).toBe("audio");
            expect(videoItem.duration).toBe(120);
            expect(audioItem.duration).toBe(180);
        });
    });

    describe("MediaFolder interface", () => {
        it("should accept valid folder object", () => {
            const folder: MediaFolder = {
                id: "folder-123",
                name: "Images",
                parent_id: "parent-folder-456",
                created_by: "user789",
                created_at: new Date()
            };

            expect(folder.name).toBe("Images");
            expect(folder.parent_id).toBe("parent-folder-456");
            expect(folder.created_by).toBe("user789");
        });

        it("should accept folder without parent", () => {
            const rootFolder: MediaFolder = {
                id: "root-folder",
                name: "Root Folder",
                created_by: "admin",
                created_at: new Date()
            };

            expect(rootFolder.parent_id).toBeUndefined();
            expect(rootFolder.name).toBe("Root Folder");
        });

        it("should handle hierarchical folder structure", () => {
            const parentFolder: MediaFolder = {
                id: "parent-1",
                name: "Documents",
                created_by: "user1",
                created_at: new Date()
            };

            const childFolder: MediaFolder = {
                id: "child-1",
                name: "PDFs",
                parent_id: "parent-1",
                created_by: "user1",
                created_at: new Date()
            };

            expect(parentFolder.parent_id).toBeUndefined();
            expect(childFolder.parent_id).toBe("parent-1");
        });
    });

    describe("UploadMediaRequest interface", () => {
        it("should accept minimal upload request", () => {
            const request: UploadMediaRequest = {
                file: Buffer.from("test file content"),
                filename: "test.txt",
                mime_type: "text/plain"
            };

            expect(request.file).toBeInstanceOf(Buffer);
            expect(request.filename).toBe("test.txt");
            expect(request.mime_type).toBe("text/plain");
        });

        it("should accept full upload request", () => {
            const request: UploadMediaRequest = {
                file: Buffer.from("image data"),
                filename: "photo.jpg",
                mime_type: "image/jpeg",
                alt_text: "Beautiful photo",
                caption: "A photo taken during vacation",
                folder_id: "vacation-folder"
            };

            expect(request.alt_text).toBe("Beautiful photo");
            expect(request.caption).toBe("A photo taken during vacation");
            expect(request.folder_id).toBe("vacation-folder");
        });

        it("should handle different file types", () => {
            const imageUpload: UploadMediaRequest = {
                file: Buffer.from("image"),
                filename: "image.png",
                mime_type: "image/png",
                alt_text: "PNG image"
            };

            const videoUpload: UploadMediaRequest = {
                file: Buffer.from("video"),
                filename: "video.mp4",
                mime_type: "video/mp4"
            };

            const documentUpload: UploadMediaRequest = {
                file: Buffer.from("document"),
                filename: "document.pdf",
                mime_type: "application/pdf"
            };

            expect(imageUpload.mime_type).toBe("image/png");
            expect(videoUpload.mime_type).toBe("video/mp4");
            expect(documentUpload.mime_type).toBe("application/pdf");
        });
    });

    describe("UpdateMediaRequest interface", () => {
        it("should accept empty update request", () => {
            const request: UpdateMediaRequest = {};
            
            expect(request.alt_text).toBeUndefined();
            expect(request.caption).toBeUndefined();
            expect(request.folder_id).toBeUndefined();
        });

        it("should accept partial update request", () => {
            const request: UpdateMediaRequest = {
                alt_text: "Updated alt text"
            };

            expect(request.alt_text).toBe("Updated alt text");
            expect(request.caption).toBeUndefined();
            expect(request.folder_id).toBeUndefined();
        });

        it("should accept full update request", () => {
            const request: UpdateMediaRequest = {
                alt_text: "New alt text",
                caption: "New caption",
                folder_id: "new-folder-id"
            };

            expect(request.alt_text).toBe("New alt text");
            expect(request.caption).toBe("New caption");
            expect(request.folder_id).toBe("new-folder-id");
        });

        it("should handle metadata updates", () => {
            const metadataUpdate: UpdateMediaRequest = {
                alt_text: "Accessibility description",
                caption: "Detailed caption for the media"
            };

            const folderUpdate: UpdateMediaRequest = {
                folder_id: "organized-folder"
            };

            expect(metadataUpdate.alt_text).toBeDefined();
            expect(metadataUpdate.caption).toBeDefined();
            expect(folderUpdate.folder_id).toBe("organized-folder");
        });
    });

    describe("ListMediaRequest interface", () => {
        it("should accept empty list request", () => {
            const request: ListMediaRequest = {};

            expect(request.folder_id).toBeUndefined();
            expect(request.type).toBeUndefined();
            expect(request.page).toBeUndefined();
            expect(request.limit).toBeUndefined();
        });

        it("should accept filtered list request", () => {
            const request: ListMediaRequest = {
                type: "image",
                folder_id: "image-folder"
            };

            expect(request.type).toBe("image");
            expect(request.folder_id).toBe("image-folder");
        });

        it("should accept paginated list request", () => {
            const request: ListMediaRequest = {
                page: 2,
                limit: 10
            };

            expect(request.page).toBe(2);
            expect(request.limit).toBe(10);
        });

        it("should accept complete list request", () => {
            const request: ListMediaRequest = {
                folder_id: "documents",
                type: "document",
                page: 1,
                limit: 20
            };

            expect(request.folder_id).toBe("documents");
            expect(request.type).toBe("document");
            expect(request.page).toBe(1);
            expect(request.limit).toBe(20);
        });
    });

    describe("ListMediaResponse interface", () => {
        it("should accept valid list response", () => {
            const mediaItems: MediaItem[] = [
                {
                    id: "item1",
                    filename: "file1.jpg",
                    original_filename: "file1.jpg",
                    file_path: "/uploads/file1.jpg",
                    file_size: 1000,
                    mime_type: "image/jpeg",
                    type: "image",
                    uploaded_by: "user1",
                    created_at: new Date()
                }
            ];

            const response: ListMediaResponse = {
                items: mediaItems,
                total: 1,
                page: 1,
                limit: 20
            };

            expect(response.items).toHaveLength(1);
            expect(response.total).toBe(1);
            expect(response.page).toBe(1);
            expect(response.limit).toBe(20);
        });

        it("should handle empty results", () => {
            const response: ListMediaResponse = {
                items: [],
                total: 0,
                page: 1,
                limit: 20
            };

            expect(response.items).toHaveLength(0);
            expect(response.total).toBe(0);
        });

        it("should handle pagination metadata", () => {
            const response: ListMediaResponse = {
                items: [],
                total: 100,
                page: 3,
                limit: 25
            };

            expect(response.total).toBe(100);
            expect(response.page).toBe(3);
            expect(response.limit).toBe(25);
            // This would represent items 51-75 of 100 total items
        });
    });

    describe("Type Compatibility", () => {
        it("should allow MediaItem arrays in ListMediaResponse", () => {
            const items: MediaItem[] = [
                {
                    id: "test1",
                    filename: "test1.jpg",
                    original_filename: "test1.jpg",
                    file_path: "/test1.jpg",
                    file_size: 1000,
                    mime_type: "image/jpeg",
                    type: "image",
                    uploaded_by: "user1",
                    created_at: new Date()
                },
                {
                    id: "test2",
                    filename: "test2.mp4",
                    original_filename: "test2.mp4",
                    file_path: "/test2.mp4",
                    file_size: 5000,
                    mime_type: "video/mp4",
                    type: "video",
                    uploaded_by: "user2",
                    created_at: new Date()
                }
            ];

            const response: ListMediaResponse = {
                items,
                total: 2,
                page: 1,
                limit: 20
            };

            expect(response.items).toHaveLength(2);
            expect(response.items[0].type).toBe("image");
            expect(response.items[1].type).toBe("video");
        });

        it("should handle date serialization compatibility", () => {
            const now = new Date();
            const mediaItem: MediaItem = {
                id: "date-test",
                filename: "date-test.jpg",
                original_filename: "date-test.jpg",
                file_path: "/date-test.jpg",
                file_size: 1000,
                mime_type: "image/jpeg",
                type: "image",
                uploaded_by: "user1",
                created_at: now
            };

            // Should be able to serialize/deserialize dates
            const serialized = JSON.stringify(mediaItem);
            const parsed = JSON.parse(serialized);
            
            expect(typeof parsed.created_at).toBe("string");
            expect(new Date(parsed.created_at).getTime()).toBe(now.getTime());
        });

        it("should maintain type safety across operations", () => {
            const uploadRequest: UploadMediaRequest = {
                file: Buffer.from("test"),
                filename: "test.jpg",
                mime_type: "image/jpeg",
                alt_text: "Test image"
            };

            const updateRequest: UpdateMediaRequest = {
                alt_text: "Updated alt text",
                caption: "New caption"
            };

            const listRequest: ListMediaRequest = {
                type: "image",
                page: 1,
                limit: 10
            };

            // All should maintain proper typing
            expect(uploadRequest.mime_type).toBe("image/jpeg");
            expect(updateRequest.alt_text).toBe("Updated alt text");
            expect(listRequest.type).toBe("image");
        });
    });
}); 