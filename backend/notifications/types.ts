// Notifications service types will be defined here 

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    user_id: string;
    read: boolean;
    created_at: Date;
}

export interface SendNotificationRequest {
    type: NotificationType;
    title: string;
    message: string;
    user_id: string;
}

export interface WebSocketMessage {
    event: string;
    data: any;
    timestamp: Date;
}

// Response wrapper interfaces for Encore.ts API compatibility
export interface GetNotificationsResponse {
    notifications: Notification[];
} 