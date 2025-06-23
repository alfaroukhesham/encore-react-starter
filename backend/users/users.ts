import { SQLDatabase } from "encore.dev/storage/sqldb";
import { api } from "encore.dev/api";
import { UserProfile, UpdateProfileRequest, Role, GetProfileResponse, GetUserRolesResponse } from "./types";

const db = new SQLDatabase("users", {
    migrations: "./migrations",
});

export { db };

export const getProfile = api(
    { method: "GET", path: "/profile/:userId", auth: true },
    async ({ userId }: { userId: string }): Promise<GetProfileResponse> => {
        const profile = await db.queryRow<UserProfile>`
            SELECT id, user_id, first_name, last_name, avatar_url, bio, created_at, updated_at
            FROM user_profiles 
            WHERE user_id = ${userId}
        `;
        
        return { profile: profile || null };
    }
);

export const updateProfile = api(
    { method: "PUT", path: "/profile/:userId", auth: true },
    async ({ userId, ...updates }: { userId: string } & UpdateProfileRequest): Promise<UserProfile> => {
        // Check if profile exists
        const existingProfile = await db.queryRow`
            SELECT id FROM user_profiles WHERE user_id = ${userId}
        `;
        
        if (existingProfile) {
            // Update existing profile - only update provided fields
            if (updates.first_name !== undefined) {
                await db.exec`
                    UPDATE user_profiles 
                    SET first_name = ${updates.first_name}, updated_at = NOW()
                    WHERE user_id = ${userId}
                `;
            }
            if (updates.last_name !== undefined) {
                await db.exec`
                    UPDATE user_profiles 
                    SET last_name = ${updates.last_name}, updated_at = NOW()
                    WHERE user_id = ${userId}
                `;
            }
            if (updates.bio !== undefined) {
                await db.exec`
                    UPDATE user_profiles 
                    SET bio = ${updates.bio}, updated_at = NOW()
                    WHERE user_id = ${userId}
                `;
            }
        } else {
            // Create new profile
            await db.exec`
                INSERT INTO user_profiles (user_id, first_name, last_name, bio)
                VALUES (${userId}, ${updates.first_name || null}, ${updates.last_name || null}, ${updates.bio || null})
            `;
        }
        
        // Return updated profile
        const profile = await db.queryRow<UserProfile>`
            SELECT id, user_id, first_name, last_name, avatar_url, bio, created_at, updated_at
            FROM user_profiles 
            WHERE user_id = ${userId}
        `;
        
        if (!profile) {
            throw new Error("Failed to update profile");
        }
        
        return profile;
    }
);

export const getUserRoles = api(
    { method: "GET", path: "/roles/:userId", auth: true },
    async ({ userId }: { userId: string }): Promise<GetUserRolesResponse> => {
        const roles = await db.query<Role>`
            SELECT r.id, r.name, r.description, r.created_at
            FROM roles r
            JOIN user_roles ur ON r.id = ur.role_id
            WHERE ur.user_id = ${userId}
        `;
        
        const roleList: Role[] = [];
        for await (const role of roles) {
            roleList.push(role);
        }
        
        return { roles: roleList };
    }
); 