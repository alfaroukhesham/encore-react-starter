export interface User {
    id: string;
    email: string;
    password_hash: string;
    is_verified: boolean;
    verification_token?: string;
    reset_token?: string;
    reset_token_expires?: Date;
    created_at: Date;
    updated_at: Date;
}

export interface RegisterRequest {
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: {
        id: string;
        email: string;
        is_verified: boolean;
    };
    token: string;
} 