// User management types will be defined here 

export interface UserProfile {
    id: string;
    user_id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    bio?: string;
    created_at: Date;
    updated_at: Date;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    created_at: Date;
}

export interface UserRole {
    id: string;
    user_id: string;
    role_id: string;
    assigned_at: Date;
    assigned_by?: string;
}

export interface UpdateProfileRequest {
    first_name?: string;
    last_name?: string;
    bio?: string;
}

export interface UserWithProfile {
    id: string;
    email: string;
    is_verified: boolean;
    profile?: UserProfile;
    roles: Role[];
}

// API Response wrappers for Encore.ts compatibility
export interface GetProfileResponse {
    profile: UserProfile | null;
}

export interface GetUserRolesResponse {
    roles: Role[];
} 