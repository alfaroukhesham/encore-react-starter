import { describe, it, expect } from "vitest";
import { 
    UserProfile, 
    Role, 
    UserRole, 
    UpdateProfileRequest, 
    UserWithProfile 
} from "./types";

describe("User Management Types", () => {
    describe("UserProfile", () => {
        it("should have correct structure with required fields", () => {
            const profile: UserProfile = {
                id: "profile-id",
                user_id: "user-id",
                created_at: new Date(),
                updated_at: new Date()
            };

            expect(profile.id).toBeDefined();
            expect(profile.user_id).toBeDefined();
            expect(profile.created_at).toBeInstanceOf(Date);
            expect(profile.updated_at).toBeInstanceOf(Date);
        });

        it("should allow optional fields to be undefined", () => {
            const profile: UserProfile = {
                id: "profile-id",
                user_id: "user-id",
                created_at: new Date(),
                updated_at: new Date()
                // Optional fields not provided
            };

            expect(profile.first_name).toBeUndefined();
            expect(profile.last_name).toBeUndefined();
            expect(profile.avatar_url).toBeUndefined();
            expect(profile.bio).toBeUndefined();
        });

        it("should allow optional fields to be defined", () => {
            const profile: UserProfile = {
                id: "profile-id",
                user_id: "user-id",
                first_name: "John",
                last_name: "Doe",
                avatar_url: "https://example.com/avatar.jpg",
                bio: "Software developer",
                created_at: new Date(),
                updated_at: new Date()
            };

            expect(profile.first_name).toBe("John");
            expect(profile.last_name).toBe("Doe");
            expect(profile.avatar_url).toBe("https://example.com/avatar.jpg");
            expect(profile.bio).toBe("Software developer");
        });
    });

    describe("Role", () => {
        it("should have correct structure with required fields", () => {
            const role: Role = {
                id: "role-id",
                name: "admin",
                created_at: new Date()
            };

            expect(role.id).toBeDefined();
            expect(role.name).toBeDefined();
            expect(role.created_at).toBeInstanceOf(Date);
        });

        it("should allow description to be optional", () => {
            const roleWithoutDescription: Role = {
                id: "role-id",
                name: "admin",
                created_at: new Date()
            };

            const roleWithDescription: Role = {
                id: "role-id",
                name: "admin",
                description: "Full system access",
                created_at: new Date()
            };

            expect(roleWithoutDescription.description).toBeUndefined();
            expect(roleWithDescription.description).toBe("Full system access");
        });

        it("should work with predefined role names", () => {
            const roles: Role[] = [
                { id: "1", name: "admin", description: "Full system access", created_at: new Date() },
                { id: "2", name: "editor", description: "Content creation and editing", created_at: new Date() },
                { id: "3", name: "contributor", description: "Content creation only", created_at: new Date() },
                { id: "4", name: "viewer", description: "Read-only access", created_at: new Date() }
            ];

            expect(roles).toHaveLength(4);
            expect(roles.map(r => r.name)).toEqual(["admin", "editor", "contributor", "viewer"]);
        });
    });

    describe("UserRole", () => {
        it("should have correct structure with required fields", () => {
            const userRole: UserRole = {
                id: "user-role-id",
                user_id: "user-id",
                role_id: "role-id",
                assigned_at: new Date()
            };

            expect(userRole.id).toBeDefined();
            expect(userRole.user_id).toBeDefined();
            expect(userRole.role_id).toBeDefined();
            expect(userRole.assigned_at).toBeInstanceOf(Date);
        });

        it("should allow assigned_by to be optional", () => {
            const userRoleWithoutAssignedBy: UserRole = {
                id: "user-role-id",
                user_id: "user-id",
                role_id: "role-id",
                assigned_at: new Date()
            };

            const userRoleWithAssignedBy: UserRole = {
                id: "user-role-id",
                user_id: "user-id",
                role_id: "role-id",
                assigned_at: new Date(),
                assigned_by: "admin-user-id"
            };

            expect(userRoleWithoutAssignedBy.assigned_by).toBeUndefined();
            expect(userRoleWithAssignedBy.assigned_by).toBe("admin-user-id");
        });
    });

    describe("UpdateProfileRequest", () => {
        it("should allow all fields to be optional", () => {
            const emptyUpdate: UpdateProfileRequest = {};
            const partialUpdate: UpdateProfileRequest = {
                first_name: "John"
            };
            const fullUpdate: UpdateProfileRequest = {
                first_name: "John",
                last_name: "Doe",
                bio: "Software developer"
            };

            expect(emptyUpdate).toEqual({});
            expect(partialUpdate.first_name).toBe("John");
            expect(partialUpdate.last_name).toBeUndefined();
            expect(fullUpdate.first_name).toBe("John");
            expect(fullUpdate.last_name).toBe("Doe");
            expect(fullUpdate.bio).toBe("Software developer");
        });

        it("should not include fields not in the interface", () => {
            const update: UpdateProfileRequest = {
                first_name: "John",
                last_name: "Doe",
                bio: "Software developer"
                // id, user_id, avatar_url, created_at, updated_at should not be allowed
            };

            // TypeScript should prevent these fields from being added
            expect(update).not.toHaveProperty("id");
            expect(update).not.toHaveProperty("user_id");
            expect(update).not.toHaveProperty("avatar_url");
            expect(update).not.toHaveProperty("created_at");
            expect(update).not.toHaveProperty("updated_at");
        });
    });

    describe("UserWithProfile", () => {
        it("should combine user data with profile and roles", () => {
            const userWithProfile: UserWithProfile = {
                id: "user-id",
                email: "user@example.com",
                is_verified: true,
                profile: {
                    id: "profile-id",
                    user_id: "user-id",
                    first_name: "John",
                    last_name: "Doe",
                    bio: "Software developer",
                    created_at: new Date(),
                    updated_at: new Date()
                },
                roles: [
                    {
                        id: "role-1",
                        name: "admin",
                        description: "Full system access",
                        created_at: new Date()
                    },
                    {
                        id: "role-2",
                        name: "editor",
                        description: "Content creation and editing",
                        created_at: new Date()
                    }
                ]
            };

            expect(userWithProfile.id).toBe("user-id");
            expect(userWithProfile.email).toBe("user@example.com");
            expect(userWithProfile.is_verified).toBe(true);
            expect(userWithProfile.profile?.first_name).toBe("John");
            expect(userWithProfile.roles).toHaveLength(2);
            expect(userWithProfile.roles[0].name).toBe("admin");
        });

        it("should allow profile to be optional", () => {
            const userWithoutProfile: UserWithProfile = {
                id: "user-id",
                email: "user@example.com",
                is_verified: false,
                roles: []
            };

            expect(userWithoutProfile.profile).toBeUndefined();
            expect(userWithoutProfile.roles).toEqual([]);
        });

        it("should handle user with empty roles array", () => {
            const userWithNoRoles: UserWithProfile = {
                id: "user-id",
                email: "user@example.com",
                is_verified: true,
                profile: {
                    id: "profile-id",
                    user_id: "user-id",
                    first_name: "Jane",
                    created_at: new Date(),
                    updated_at: new Date()
                },
                roles: []
            };

            expect(userWithNoRoles.roles).toEqual([]);
            expect(userWithNoRoles.profile?.first_name).toBe("Jane");
        });
    });

    describe("Type Compatibility", () => {
        it("should ensure UserProfile is compatible with database structure", () => {
            // This test ensures our TypeScript types match what we expect from the database
            const dbRow = {
                id: "uuid-string",
                user_id: "uuid-string",
                first_name: "John",
                last_name: "Doe",
                avatar_url: "https://example.com/avatar.jpg",
                bio: "Software developer",
                created_at: new Date(),
                updated_at: new Date()
            };

            // Should be assignable to UserProfile
            const profile: UserProfile = dbRow;
            expect(profile).toEqual(dbRow);
        });

        it("should ensure Role is compatible with database structure", () => {
            const dbRow = {
                id: "uuid-string",
                name: "admin",
                description: "Full system access",
                created_at: new Date()
            };

            const role: Role = dbRow;
            expect(role).toEqual(dbRow);
        });

        it("should ensure UpdateProfileRequest only contains updatable fields", () => {
            const updateRequest: UpdateProfileRequest = {
                first_name: "Updated Name",
                last_name: "Updated Last",
                bio: "Updated bio"
            };

            // Should only contain the fields that can be updated
            const allowedFields = ["first_name", "last_name", "bio"];
            const requestFields = Object.keys(updateRequest);
            
            requestFields.forEach(field => {
                expect(allowedFields).toContain(field);
            });
        });
    });
}); 