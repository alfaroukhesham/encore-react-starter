import { describe, it, expect, beforeEach } from "vitest";
import { db, getProfile, updateProfile, getUserRoles } from "./users";
import { UserProfile, Role } from "./types";

describe("Users Service", () => {
    const testUserId = "550e8400-e29b-41d4-a716-446655440000";
    const testUserId2 = "550e8400-e29b-41d4-a716-446655440001";

    beforeEach(async () => {
        // Clean up test data before each test
        await db.exec`DELETE FROM user_roles WHERE user_id = ${testUserId} OR user_id = ${testUserId2}`;
        await db.exec`DELETE FROM user_profiles WHERE user_id = ${testUserId} OR user_id = ${testUserId2}`;
    });

    describe("getProfile", () => {
        it("should return null for non-existent profile", async () => {
            const result = await getProfile({ userId: testUserId });
            expect(result.profile).toBeNull();
        });

        it("should return profile when it exists", async () => {
            // Create a test profile
            await db.exec`
                INSERT INTO user_profiles (user_id, first_name, last_name, bio)
                VALUES (${testUserId}, 'John', 'Doe', 'Test bio')
            `;

            const result = await getProfile({ userId: testUserId });
            
            expect(result.profile).not.toBeNull();
            expect(result.profile?.user_id).toBe(testUserId);
            expect(result.profile?.first_name).toBe("John");
            expect(result.profile?.last_name).toBe("Doe");
            expect(result.profile?.bio).toBe("Test bio");
            expect(result.profile?.created_at).toBeInstanceOf(Date);
            expect(result.profile?.updated_at).toBeInstanceOf(Date);
        });

        it("should handle profiles with null optional fields", async () => {
            // Create a minimal profile
            await db.exec`
                INSERT INTO user_profiles (user_id)
                VALUES (${testUserId})
            `;

            const result = await getProfile({ userId: testUserId });
            
            expect(result.profile).not.toBeNull();
            expect(result.profile?.user_id).toBe(testUserId);
            expect(result.profile?.first_name).toBeNull();
            expect(result.profile?.last_name).toBeNull();
            expect(result.profile?.bio).toBeNull();
            expect(result.profile?.avatar_url).toBeNull();
        });
    });

    describe("updateProfile", () => {
        it("should create new profile when none exists", async () => {
            const updates = {
                first_name: "Jane",
                last_name: "Smith",
                bio: "New user bio"
            };

            const result = await updateProfile({ userId: testUserId, ...updates });
            
            expect(result.user_id).toBe(testUserId);
            expect(result.first_name).toBe("Jane");
            expect(result.last_name).toBe("Smith");
            expect(result.bio).toBe("New user bio");
            expect(result.created_at).toBeInstanceOf(Date);
            expect(result.updated_at).toBeInstanceOf(Date);
        });

        it("should update existing profile", async () => {
            // Create initial profile
            await db.exec`
                INSERT INTO user_profiles (user_id, first_name, last_name, bio)
                VALUES (${testUserId}, 'John', 'Doe', 'Original bio')
            `;

            const updates = {
                first_name: "Updated John",
                bio: "Updated bio"
            };

            const result = await updateProfile({ userId: testUserId, ...updates });
            
            expect(result.user_id).toBe(testUserId);
            expect(result.first_name).toBe("Updated John");
            expect(result.last_name).toBe("Doe"); // Should remain unchanged
            expect(result.bio).toBe("Updated bio");
        });

        it("should handle partial updates", async () => {
            // Create initial profile
            await db.exec`
                INSERT INTO user_profiles (user_id, first_name, last_name, bio)
                VALUES (${testUserId}, 'John', 'Doe', 'Original bio')
            `;

            const updates = {
                bio: "Only bio updated"
            };

            const result = await updateProfile({ userId: testUserId, ...updates });
            
            expect(result.user_id).toBe(testUserId);
            expect(result.first_name).toBe("John"); // Should remain unchanged
            expect(result.last_name).toBe("Doe"); // Should remain unchanged
            expect(result.bio).toBe("Only bio updated");
        });

        it("should handle empty updates", async () => {
            // Create initial profile
            await db.exec`
                INSERT INTO user_profiles (user_id, first_name, last_name, bio)
                VALUES (${testUserId}, 'John', 'Doe', 'Original bio')
            `;

            const updates = {};

            const result = await updateProfile({ userId: testUserId, ...updates });
            
            // Should preserve existing fields when no updates are provided
            expect(result.user_id).toBe(testUserId);
            expect(result.first_name).toBe("John");
            expect(result.last_name).toBe("Doe");
            expect(result.bio).toBe("Original bio");
        });

        it("should update timestamps correctly", async () => {
            // Create initial profile
            await db.exec`
                INSERT INTO user_profiles (user_id, first_name, created_at, updated_at)
                VALUES (${testUserId}, 'John', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour')
            `;

            // Get initial timestamps
            const initialProfile = await getProfile({ userId: testUserId });
            const initialUpdatedAt = initialProfile.profile?.updated_at;

            // Wait a moment to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));

            const updates = { first_name: "Updated John" };
            const result = await updateProfile({ userId: testUserId, ...updates });
            
            expect(result.created_at).toEqual(initialProfile.profile?.created_at);
            expect(result.updated_at.getTime()).toBeGreaterThan(initialUpdatedAt!.getTime());
        });
    });

    describe("getUserRoles", () => {
        it("should return empty array for user with no roles", async () => {
            const result = await getUserRoles({ userId: testUserId });
            expect(result.roles).toEqual([]);
        });

        it("should return user roles when they exist", async () => {
            // Get role IDs from the database
            const adminRole = await db.queryRow<{ id: string }>`
                SELECT id FROM roles WHERE name = 'admin'
            `;
            const editorRole = await db.queryRow<{ id: string }>`
                SELECT id FROM roles WHERE name = 'editor'
            `;

            expect(adminRole).not.toBeNull();
            expect(editorRole).not.toBeNull();

            // Assign roles to user
            await db.exec`
                INSERT INTO user_roles (user_id, role_id)
                VALUES (${testUserId}, ${adminRole!.id}), (${testUserId}, ${editorRole!.id})
            `;

            const result = await getUserRoles({ userId: testUserId });
            
            expect(result.roles).toHaveLength(2);
            
            const roleNames = result.roles.map(role => role.name).sort();
            expect(roleNames).toEqual(["admin", "editor"]);
            
            // Verify role structure
            result.roles.forEach(role => {
                expect(role.id).toBeDefined();
                expect(role.name).toBeDefined();
                expect(role.created_at).toBeInstanceOf(Date);
                expect(typeof role.description).toBe("string");
            });
        });

        it("should return roles with correct descriptions", async () => {
            // Get admin role
            const adminRole = await db.queryRow<{ id: string }>`
                SELECT id FROM roles WHERE name = 'admin'
            `;

            // Assign admin role to user
            await db.exec`
                INSERT INTO user_roles (user_id, role_id)
                VALUES (${testUserId}, ${adminRole!.id})
            `;

            const result = await getUserRoles({ userId: testUserId });
            
            expect(result.roles).toHaveLength(1);
            expect(result.roles[0].name).toBe("admin");
            expect(result.roles[0].description).toBe("Full system access");
        });

        it("should handle multiple users with different roles", async () => {
            // Get role IDs
            const adminRole = await db.queryRow<{ id: string }>`
                SELECT id FROM roles WHERE name = 'admin'
            `;
            const viewerRole = await db.queryRow<{ id: string }>`
                SELECT id FROM roles WHERE name = 'viewer'
            `;

            // Assign different roles to different users
            await db.exec`
                INSERT INTO user_roles (user_id, role_id)
                VALUES (${testUserId}, ${adminRole!.id}), (${testUserId2}, ${viewerRole!.id})
            `;

            const user1Roles = await getUserRoles({ userId: testUserId });
            const user2Roles = await getUserRoles({ userId: testUserId2 });
            
            expect(user1Roles.roles).toHaveLength(1);
            expect(user1Roles.roles[0].name).toBe("admin");
            
            expect(user2Roles.roles).toHaveLength(1);
            expect(user2Roles.roles[0].name).toBe("viewer");
        });
    });

    describe("Database Schema Validation", () => {
        it("should have all required roles in database", async () => {
            const roles = await db.query<{ name: string, description: string }>`
                SELECT name, description FROM roles ORDER BY name
            `;

            const roleList = [];
            for await (const role of roles) {
                roleList.push(role);
            }

            expect(roleList).toHaveLength(4);
            
            const expectedRoles = [
                { name: "admin", description: "Full system access" },
                { name: "contributor", description: "Content creation only" },
                { name: "editor", description: "Content creation and editing" },
                { name: "viewer", description: "Read-only access" }
            ];

            expect(roleList).toEqual(expectedRoles);
        });

        it("should enforce unique user-role combinations", async () => {
            const adminRole = await db.queryRow<{ id: string }>`
                SELECT id FROM roles WHERE name = 'admin'
            `;

            // First assignment should succeed
            await db.exec`
                INSERT INTO user_roles (user_id, role_id)
                VALUES (${testUserId}, ${adminRole!.id})
            `;

            // Second assignment should fail due to unique constraint
            await expect(async () => {
                await db.exec`
                    INSERT INTO user_roles (user_id, role_id)
                    VALUES (${testUserId}, ${adminRole!.id})
                `;
            }).rejects.toThrow();
        });
    });

    describe("Integration Tests", () => {
        it("should handle complete user profile workflow", async () => {
            // 1. Check initial state - no profile
            let profileResponse = await getProfile({ userId: testUserId });
            expect(profileResponse.profile).toBeNull();

            // 2. Create profile
            const createData = {
                first_name: "Alice",
                last_name: "Johnson",
                bio: "Software developer"
            };
            
            let profile = await updateProfile({ userId: testUserId, ...createData });
            expect(profile.first_name).toBe("Alice");
            expect(profile.last_name).toBe("Johnson");
            expect(profile.bio).toBe("Software developer");

            // 3. Update profile partially
            const updateData = {
                bio: "Senior software developer"
            };
            
            profile = await updateProfile({ userId: testUserId, ...updateData });
            expect(profile.first_name).toBe("Alice"); // Should remain
            expect(profile.last_name).toBe("Johnson"); // Should remain
            expect(profile.bio).toBe("Senior software developer"); // Should update

            // 4. Verify profile retrieval
            const retrievedProfileResponse = await getProfile({ userId: testUserId });
            expect(retrievedProfileResponse.profile).toEqual(profile);
        });

        it("should handle user with profile and roles", async () => {
            // Create profile
            await updateProfile({ 
                userId: testUserId, 
                first_name: "Bob", 
                last_name: "Wilson" 
            });

            // Assign roles
            const adminRole = await db.queryRow<{ id: string }>`
                SELECT id FROM roles WHERE name = 'admin'
            `;
            const editorRole = await db.queryRow<{ id: string }>`
                SELECT id FROM roles WHERE name = 'editor'
            `;

            await db.exec`
                INSERT INTO user_roles (user_id, role_id)
                VALUES (${testUserId}, ${adminRole!.id}), (${testUserId}, ${editorRole!.id})
            `;

            // Verify both profile and roles
            const profileResponse = await getProfile({ userId: testUserId });
            const rolesResponse = await getUserRoles({ userId: testUserId });

            expect(profileResponse.profile?.first_name).toBe("Bob");
            expect(profileResponse.profile?.last_name).toBe("Wilson");
            expect(rolesResponse.roles).toHaveLength(2);
            expect(rolesResponse.roles.map(r => r.name).sort()).toEqual(["admin", "editor"]);
        });
    });
}); 