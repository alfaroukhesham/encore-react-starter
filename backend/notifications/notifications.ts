import { api } from "encore.dev/api";
import { SendNotificationRequest, Notification, GetNotificationsResponse } from "./types";
import { v4 as uuidv4 } from "uuid";

// In-memory storage for demo (in production, use Redis or database)
const notifications: Map<string, Notification[]> = new Map();

// Export for testing purposes
export { notifications };

export const sendNotification = api(
    { method: "POST", path: "/send", auth: true },
    async (req: SendNotificationRequest): Promise<Notification> => {
        const notification: Notification = {
            id: uuidv4(),
            type: req.type,
            title: req.title,
            message: req.message,
            user_id: req.user_id,
            read: false,
            created_at: new Date()
        };
        
        // Store notification
        const userNotifications = notifications.get(req.user_id) || [];
        userNotifications.push(notification);
        notifications.set(req.user_id, userNotifications);
        
        // TODO: Send via WebSocket in next step
        
        return notification;
    }
);

export const getNotifications = api(
    { method: "GET", path: "/notifications/:userId", auth: true },
    async ({ userId }: { userId: string }): Promise<GetNotificationsResponse> => {
        const userNotifications = notifications.get(userId) || [];
        
        // Return most recent first
        const sortedNotifications = userNotifications.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        return { notifications: sortedNotifications };
    }
); 