import { describe, it, expect } from "vitest";
import type { 
    NotificationType, 
    Notification, 
    SendNotificationRequest, 
    WebSocketMessage 
} from "./types";

describe("Notifications Types", () => {
    describe("NotificationType", () => {
        it("should have all expected notification type values", () => {
            const validTypes: NotificationType[] = ['info', 'success', 'warning', 'error'];
            
            validTypes.forEach(type => {
                expect(['info', 'success', 'warning', 'error']).toContain(type);
            });
        });

        it("should be assignable to string", () => {
            const notificationType: NotificationType = 'info';
            const asString: string = notificationType;
            expect(asString).toBe('info');
        });

        it("should support all notification severity levels", () => {
            const info: NotificationType = 'info';
            const success: NotificationType = 'success';
            const warning: NotificationType = 'warning';
            const error: NotificationType = 'error';

            expect(info).toBe('info');
            expect(success).toBe('success');
            expect(warning).toBe('warning');
            expect(error).toBe('error');
        });
    });

    describe("Notification interface", () => {
        it("should accept valid notification object", () => {
            const notification: Notification = {
                id: "123e4567-e89b-12d3-a456-426614174000",
                type: "info",
                title: "Test Notification",
                message: "This is a test notification message",
                user_id: "user-123",
                read: false,
                created_at: new Date()
            };

            expect(notification.id).toBeDefined();
            expect(notification.type).toBe("info");
            expect(notification.title).toBe("Test Notification");
            expect(notification.message).toBe("This is a test notification message");
            expect(notification.user_id).toBe("user-123");
            expect(notification.read).toBe(false);
            expect(notification.created_at).toBeInstanceOf(Date);
        });

        it("should handle different notification types", () => {
            const infoNotification: Notification = {
                id: "info-id",
                type: "info",
                title: "Information",
                message: "Informational message",
                user_id: "user1",
                read: false,
                created_at: new Date()
            };

            const successNotification: Notification = {
                id: "success-id",
                type: "success",
                title: "Success",
                message: "Operation completed successfully",
                user_id: "user2",
                read: true,
                created_at: new Date()
            };

            const warningNotification: Notification = {
                id: "warning-id",
                type: "warning",
                title: "Warning",
                message: "Please be cautious",
                user_id: "user3",
                read: false,
                created_at: new Date()
            };

            const errorNotification: Notification = {
                id: "error-id",
                type: "error",
                title: "Error",
                message: "Something went wrong",
                user_id: "user4",
                read: true,
                created_at: new Date()
            };

            expect(infoNotification.type).toBe("info");
            expect(successNotification.type).toBe("success");
            expect(warningNotification.type).toBe("warning");
            expect(errorNotification.type).toBe("error");
        });

        it("should handle read status correctly", () => {
            const unreadNotification: Notification = {
                id: "unread-id",
                type: "info",
                title: "Unread",
                message: "This notification is unread",
                user_id: "user1",
                read: false,
                created_at: new Date()
            };

            const readNotification: Notification = {
                id: "read-id",
                type: "success",
                title: "Read",
                message: "This notification has been read",
                user_id: "user2",
                read: true,
                created_at: new Date()
            };

            expect(unreadNotification.read).toBe(false);
            expect(readNotification.read).toBe(true);
        });

        it("should handle various content types", () => {
            const emptyContentNotification: Notification = {
                id: "empty-id",
                type: "info",
                title: "",
                message: "",
                user_id: "user1",
                read: false,
                created_at: new Date()
            };

            const longContentNotification: Notification = {
                id: "long-id",
                type: "warning",
                title: "A".repeat(200),
                message: "B".repeat(1000),
                user_id: "user2",
                read: false,
                created_at: new Date()
            };

            const specialCharNotification: Notification = {
                id: "special-id",
                type: "success",
                title: "🎉 Success with émojis!",
                message: "Message with\nnewlines\tand\ttabs & unicode: 你好",
                user_id: "user3",
                read: true,
                created_at: new Date()
            };

            expect(emptyContentNotification.title).toBe("");
            expect(emptyContentNotification.message).toBe("");
            expect(longContentNotification.title).toHaveLength(200);
            expect(longContentNotification.message).toHaveLength(1000);
            expect(specialCharNotification.title).toContain("🎉");
            expect(specialCharNotification.message).toContain("你好");
        });
    });

    describe("SendNotificationRequest interface", () => {
        it("should accept valid notification request", () => {
            const request: SendNotificationRequest = {
                type: "info",
                title: "Test Request",
                message: "Test message for request",
                user_id: "user-456"
            };

            expect(request.type).toBe("info");
            expect(request.title).toBe("Test Request");
            expect(request.message).toBe("Test message for request");
            expect(request.user_id).toBe("user-456");
        });

        it("should handle all notification types in requests", () => {
            const infoRequest: SendNotificationRequest = {
                type: "info",
                title: "Info Request",
                message: "Information request",
                user_id: "user1"
            };

            const successRequest: SendNotificationRequest = {
                type: "success",
                title: "Success Request",
                message: "Success request",
                user_id: "user2"
            };

            const warningRequest: SendNotificationRequest = {
                type: "warning",
                title: "Warning Request",
                message: "Warning request",
                user_id: "user3"
            };

            const errorRequest: SendNotificationRequest = {
                type: "error",
                title: "Error Request",
                message: "Error request",
                user_id: "user4"
            };

            expect(infoRequest.type).toBe("info");
            expect(successRequest.type).toBe("success");
            expect(warningRequest.type).toBe("warning");
            expect(errorRequest.type).toBe("error");
        });

        it("should handle various content in requests", () => {
            const minimalRequest: SendNotificationRequest = {
                type: "info",
                title: "",
                message: "",
                user_id: "user1"
            };

            const richRequest: SendNotificationRequest = {
                type: "success",
                title: "🚀 Rich Content Title",
                message: "Rich message with\nmultiple lines\nand special chars: àáâãäå",
                user_id: "user2"
            };

            expect(minimalRequest.title).toBe("");
            expect(minimalRequest.message).toBe("");
            expect(richRequest.title).toContain("🚀");
            expect(richRequest.message).toContain("\n");
        });

        it("should be compatible with Notification interface", () => {
            const request: SendNotificationRequest = {
                type: "warning",
                title: "Compatibility Test",
                message: "Testing compatibility",
                user_id: "user-789"
            };

            // Should be able to use request properties to create a Notification
            const notification: Notification = {
                id: "generated-id",
                type: request.type,
                title: request.title,
                message: request.message,
                user_id: request.user_id,
                read: false,
                created_at: new Date()
            };

            expect(notification.type).toBe(request.type);
            expect(notification.title).toBe(request.title);
            expect(notification.message).toBe(request.message);
            expect(notification.user_id).toBe(request.user_id);
        });
    });

    describe("WebSocketMessage interface", () => {
        it("should accept valid WebSocket message", () => {
            const message: WebSocketMessage = {
                event: "notification",
                data: { id: "123", type: "info", title: "Test" },
                timestamp: new Date()
            };

            expect(message.event).toBe("notification");
            expect(message.data).toBeDefined();
            expect(message.timestamp).toBeInstanceOf(Date);
        });

        it("should handle different event types", () => {
            const notificationEvent: WebSocketMessage = {
                event: "notification",
                data: { notification: "data" },
                timestamp: new Date()
            };

            const statusEvent: WebSocketMessage = {
                event: "status",
                data: { status: "online" },
                timestamp: new Date()
            };

            const customEvent: WebSocketMessage = {
                event: "custom-event",
                data: { custom: "payload" },
                timestamp: new Date()
            };

            expect(notificationEvent.event).toBe("notification");
            expect(statusEvent.event).toBe("status");
            expect(customEvent.event).toBe("custom-event");
        });

        it("should handle various data types", () => {
            const stringDataMessage: WebSocketMessage = {
                event: "test",
                data: "simple string",
                timestamp: new Date()
            };

            const objectDataMessage: WebSocketMessage = {
                event: "test",
                data: { complex: "object", nested: { value: 123 } },
                timestamp: new Date()
            };

            const arrayDataMessage: WebSocketMessage = {
                event: "test",
                data: [1, 2, 3, "array", { mixed: true }],
                timestamp: new Date()
            };

            const nullDataMessage: WebSocketMessage = {
                event: "test",
                data: null,
                timestamp: new Date()
            };

            expect(typeof stringDataMessage.data).toBe("string");
            expect(typeof objectDataMessage.data).toBe("object");
            expect(Array.isArray(arrayDataMessage.data)).toBe(true);
            expect(nullDataMessage.data).toBeNull();
        });

        it("should handle notification data in WebSocket messages", () => {
            const notification: Notification = {
                id: "ws-notification-id",
                type: "success",
                title: "WebSocket Notification",
                message: "Sent via WebSocket",
                user_id: "user-ws",
                read: false,
                created_at: new Date()
            };

            const wsMessage: WebSocketMessage = {
                event: "new-notification",
                data: notification,
                timestamp: new Date()
            };

            expect(wsMessage.event).toBe("new-notification");
            expect(wsMessage.data.id).toBe(notification.id);
            expect(wsMessage.data.type).toBe(notification.type);
            expect(wsMessage.data.title).toBe(notification.title);
        });
    });

    describe("Type Compatibility", () => {
        it("should allow NotificationType in all interfaces", () => {
            const type: NotificationType = "error";

            const notification: Notification = {
                id: "compat-id",
                type: type,
                title: "Compatibility",
                message: "Testing type compatibility",
                user_id: "user-compat",
                read: false,
                created_at: new Date()
            };

            const request: SendNotificationRequest = {
                type: type,
                title: "Request",
                message: "Request message",
                user_id: "user-req"
            };

            expect(notification.type).toBe(type);
            expect(request.type).toBe(type);
        });

        it("should handle date serialization compatibility", () => {
            const now = new Date();
            
            const notification: Notification = {
                id: "date-test",
                type: "info",
                title: "Date Test",
                message: "Testing date handling",
                user_id: "user-date",
                read: false,
                created_at: now
            };

            const wsMessage: WebSocketMessage = {
                event: "date-test",
                data: notification,
                timestamp: now
            };

            // Should be able to serialize/deserialize dates
            const serializedNotification = JSON.stringify(notification);
            const parsedNotification = JSON.parse(serializedNotification);
            
            const serializedMessage = JSON.stringify(wsMessage);
            const parsedMessage = JSON.parse(serializedMessage);

            expect(typeof parsedNotification.created_at).toBe("string");
            expect(new Date(parsedNotification.created_at).getTime()).toBe(now.getTime());
            expect(typeof parsedMessage.timestamp).toBe("string");
            expect(new Date(parsedMessage.timestamp).getTime()).toBe(now.getTime());
        });

        it("should maintain type safety across operations", () => {
            const request: SendNotificationRequest = {
                type: "warning",
                title: "Type Safety Test",
                message: "Testing type safety",
                user_id: "user-safety"
            };

            // Should be able to create notification from request
            const notification: Notification = {
                id: "safety-id",
                ...request,
                read: false,
                created_at: new Date()
            };

            // Should be able to create WebSocket message from notification
            const wsMessage: WebSocketMessage = {
                event: "notification-created",
                data: notification,
                timestamp: notification.created_at
            };

            expect(notification.type).toBe(request.type);
            expect(notification.title).toBe(request.title);
            expect(wsMessage.data.type).toBe(request.type);
        });

        it("should handle arrays of notifications", () => {
            const notifications: Notification[] = [
                {
                    id: "array-1",
                    type: "info",
                    title: "First",
                    message: "First notification",
                    user_id: "user1",
                    read: false,
                    created_at: new Date()
                },
                {
                    id: "array-2",
                    type: "success",
                    title: "Second",
                    message: "Second notification",
                    user_id: "user1",
                    read: true,
                    created_at: new Date()
                }
            ];

            const wsMessage: WebSocketMessage = {
                event: "notifications-list",
                data: notifications,
                timestamp: new Date()
            };

            expect(Array.isArray(notifications)).toBe(true);
            expect(notifications).toHaveLength(2);
            expect(Array.isArray(wsMessage.data)).toBe(true);
            expect(wsMessage.data[0].type).toBe("info");
            expect(wsMessage.data[1].type).toBe("success");
        });
    });
}); 