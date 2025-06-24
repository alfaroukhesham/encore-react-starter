import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthGuard from './AuthGuard';
import Layout from './Layout';

export function MainLayout() {
    return (
        <AuthGuard fallback={<Navigate to="/login" replace />}>
            <Layout />
        </AuthGuard>
    );
} 