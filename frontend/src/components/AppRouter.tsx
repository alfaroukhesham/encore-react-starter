import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthForm, ForgotPassword, ResetPassword } from './forms';
import { DashboardPage } from '../pages/DashboardPage';
import { MainLayout } from './layout/MainLayout';

const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/dashboard" replace />
    },
    {
        path: '/login',
        element: <AuthForm />
    },
    {
        path: '/register',
        element: <AuthForm />
    },
    {
        path: '/forgot-password',
        element: <ForgotPassword />
    },
    {
        path: '/reset-password',
        element: <ResetPassword />
    },
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                path: 'dashboard',
                element: <DashboardPage />
            },
            {
                path: 'content',
                element: <div>Content Page - Coming Soon</div>
            },
            {
                path: 'media',
                element: <div>Media Page - Coming Soon</div>
            },
            {
                path: 'users',
                element: <div>Users Page - Coming Soon</div>
            },
            {
                path: 'notifications',
                element: <div>Notifications Page - Coming Soon</div>
            },
            {
                path: 'settings',
                element: <div>Settings Page - Coming Soon</div>
            }
        ]
    }
]);

export function AppRouter() {
    return <RouterProvider router={router} />;
} 