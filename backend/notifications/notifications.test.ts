import { describe, it, expect, beforeEach } from "vitest";
import { sendNotification, getNotifications, notifications } from "./notifications";
import { NotificationType } from "./types";
import { randomUUID } from "crypto";

describe("Notifications Service", () => {
    // Clear in-memory storage before each test
    beforeEach(() => {
        // Clear the notifications Map before each test
        notifications.clear();
    });

    describe("sendNotification", () => {
        it("should send a new notification", async () => {
            const userId = randomUUID();
            const request = {
                type: "info" as NotificationType,
                title: "Test Notification",
                message: "This is a test notification",
                user_id: userId
            };

            const result = await sendNotification(request);

            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
            expect(result.type).toBe("info");
            expect(result.title).toBe("Test Notification");
            expect(result.message).toBe("This is a test notification");
            expect(result.user_id).toBe(userId);
            expect(result.read).toBe(false);
            expect(result.created_at).toBeInstanceOf(Date);
        });

        it("should handle different notification types", async () => {
            const userId = randomUUID();
            const testCases = [
                { type: "info" as NotificationType, title: "Info", message: "Info message" },
                { type: "success" as NotificationType, title: "Success", message: "Success message" },
                { type: "warning" as NotificationType, title: "Warning", message: "Warning message" },
                { type: "error" as NotificationType, title: "Error", message: "Error message" }
            ];

            for (const testCase of testCases) {
                const result = await sendNotification({
                    ...testCase,
                    user_id: userId
                });

                expect(result.type).toBe(testCase.type);
                expect(result.title).toBe(testCase.title);
                expect(result.message).toBe(testCase.message);
                expect(result.read).toBe(false);
            }
        });

        it("should generate unique IDs for notifications", async () => {
            const userId = randomUUID();
            const baseRequest = {
                type: "info" as NotificationType,
                title: "Test",
                message: "Test message",
                user_id: userId
            };

            const result1 = await sendNotification(baseRequest);
            const result2 = await sendNotification(baseRequest);

            expect(result1.id).not.toBe(result2.id);
            expect(result1.id).toBeDefined();
            expect(result2.id).toBeDefined();
        });

        it("should set read status to false by default", async () => {
            const userId = randomUUID();
            const request = {
                type: "success" as NotificationType,
                title: "Default Read Status",
                message: "Testing default read status",
                user_id: userId
            };

            const result = await sendNotification(request);

            expect(result.read).toBe(false);
        });

        it("should set created_at timestamp", async () => {
            const userId = randomUUID();
            const beforeTime = new Date();
            
            const result = await sendNotification({
                type: "info" as NotificationType,
                title: "Timestamp Test",
                message: "Testing timestamp",
                user_id: userId
            });

            const afterTime = new Date();

            expect(result.created_at).toBeInstanceOf(Date);
            expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
            expect(result.created_at.getTime()).toBeLessThanOrEqual(afterTime.getTime());
        });
    });

    describe("getNotifications", () => {
        it("should return empty array for user with no notifications", async () => {
            const userId = randomUUID();
            const result = await getNotifications({ userId });

            expect(result.notifications).toEqual([]);
            expect(Array.isArray(result.notifications)).toBe(true);
        });

        it("should return user notifications", async () => {
            const userId = randomUUID();
            
            // Send a notification first
            const sentNotification = await sendNotification({
                type: "info" as NotificationType,
                title: "Test Notification",
                message: "Test message",
                user_id: userId
            });

            const result = await getNotifications({ userId });

            expect(result.notifications).toHaveLength(1);
            expect(result.notifications[0].id).toBe(sentNotification.id);
            expect(result.notifications[0].title).toBe("Test Notification");
            expect(result.notifications[0].message).toBe("Test message");
            expect(result.notifications[0].type).toBe("info");
        });

        it("should return notifications in chronological order (newest first)", async () => {
            const userId = randomUUID();
            
            // Send multiple notifications with slight delays
            const notification1 = await sendNotification({
                type: "info" as NotificationType,
                title: "First Notification",
                message: "First message",
                user_id: userId
            });

            // Small delay to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 10));

            const notification2 = await sendNotification({
                type: "success" as NotificationType,
                title: "Second Notification",
                message: "Second message",
                user_id: userId
            });

            await new Promise(resolve => setTimeout(resolve, 10));

            const notification3 = await sendNotification({
                type: "warning" as NotificationType,
                title: "Third Notification",
                message: "Third message",
                user_id: userId
            });

            const result = await getNotifications({ userId });

            expect(result.notifications).toHaveLength(3);
            expect(result.notifications[0].id).toBe(notification3.id); // Most recent first
            expect(result.notifications[1].id).toBe(notification2.id);
            expect(result.notifications[2].id).toBe(notification1.id); // Oldest last
        });

        it("should only return notifications for the specified user", async () => {
            const user1Id = randomUUID();
            const user2Id = randomUUID();
            
            // Send notifications to different users
            await sendNotification({
                type: "info" as NotificationType,
                title: "User 1 Notification",
                message: "Message for user 1",
                user_id: user1Id
            });

            await sendNotification({
                type: "success" as NotificationType,
                title: "User 2 Notification",
                message: "Message for user 2",
                user_id: user2Id
            });

            const user1Notifications = await getNotifications({ userId: user1Id });
            const user2Notifications = await getNotifications({ userId: user2Id });

            expect(user1Notifications.notifications).toHaveLength(1);
            expect(user2Notifications.notifications).toHaveLength(1);
            expect(user1Notifications.notifications[0].title).toBe("User 1 Notification");
            expect(user2Notifications.notifications[0].title).toBe("User 2 Notification");
        });

        it("should handle multiple notifications for same user", async () => {
            const userId = randomUUID();
            
            // Send multiple notifications
            const notifications = [];
            for (let i = 1; i <= 5; i++) {
                const notification = await sendNotification({
                    type: "info" as NotificationType,
                    title: `Notification ${i}`,
                    message: `Message ${i}`,
                    user_id: userId
                });
                notifications.push(notification);
                
                // Small delay to ensure different timestamps
                await new Promise(resolve => setTimeout(resolve, 5));
            }

            const result = await getNotifications({ userId });

            expect(result.notifications).toHaveLength(5);
            
            // Check they're sorted newest first
            for (let i = 0; i < result.notifications.length - 1; i++) {
                expect(result.notifications[i].created_at.getTime()).toBeGreaterThanOrEqual(
                    result.notifications[i + 1].created_at.getTime()
                );
            }
        });
    });

    describe("Data Persistence", () => {
        it("should persist notifications in memory between API calls", async () => {
            const userId = randomUUID();
            
            // Send notification
            const sentNotification = await sendNotification({
                type: "info" as NotificationType,
                title: "Persistence Test",
                message: "Testing persistence",
                user_id: userId
            });

            // Retrieve notifications
            const retrievedNotifications = await getNotifications({ userId });

            expect(retrievedNotifications.notifications).toHaveLength(1);
            expect(retrievedNotifications.notifications[0].id).toBe(sentNotification.id);
            expect(retrievedNotifications.notifications[0].title).toBe("Persistence Test");
        });

        it("should accumulate notifications over multiple sends", async () => {
            const userId = randomUUID();
            
            // Send first notification
            await sendNotification({
                type: "info" as NotificationType,
                title: "First",
                message: "First message",
                user_id: userId
            });

            // Check count
            let notificationsResult = await getNotifications({ userId });
            expect(notificationsResult.notifications).toHaveLength(1);

            // Send second notification
            await sendNotification({
                type: "success" as NotificationType,
                title: "Second",
                message: "Second message",
                user_id: userId
            });

            // Check count again
            notificationsResult = await getNotifications({ userId });
            expect(notificationsResult.notifications).toHaveLength(2);

            // Send third notification
            await sendNotification({
                type: "warning" as NotificationType,
                title: "Third",
                message: "Third message",
                user_id: userId
            });

            // Final check
            notificationsResult = await getNotifications({ userId });
            expect(notificationsResult.notifications).toHaveLength(3);
        });
    });

    describe("Integration Tests", () => {
        it("should handle complete notification workflow", async () => {
            const userId = randomUUID();
            
            // Send notification
            const sent = await sendNotification({
                type: "success" as NotificationType,
                title: "Workflow Test",
                message: "Testing complete workflow",
                user_id: userId
            });

            expect(sent.type).toBe("success");
            expect(sent.title).toBe("Workflow Test");
            expect(sent.read).toBe(false);

            // Retrieve notifications
            const retrieved = await getNotifications({ userId });

            expect(retrieved.notifications).toHaveLength(1);
            expect(retrieved.notifications[0].id).toBe(sent.id);
            expect(retrieved.notifications[0].title).toBe("Workflow Test");
            expect(retrieved.notifications[0].message).toBe("Testing complete workflow");
            expect(retrieved.notifications[0].type).toBe("success");
            expect(retrieved.notifications[0].read).toBe(false);
        });

        it("should handle multiple users and notification types", async () => {
            const user1Id = randomUUID();
            const user2Id = randomUUID();
            
            // Send different types to different users
            await sendNotification({
                type: "info" as NotificationType,
                title: "Info for User 1",
                message: "Information message",
                user_id: user1Id
            });

            await sendNotification({
                type: "error" as NotificationType,
                title: "Error for User 2",
                message: "Error message",
                user_id: user2Id
            });

            // Small delay to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 10));

            await sendNotification({
                type: "warning" as NotificationType,
                title: "Warning for User 1",
                message: "Warning message",
                user_id: user1Id
            });

            // Check user 1 notifications
            const user1Notifications = await getNotifications({ userId: user1Id });
            expect(user1Notifications.notifications).toHaveLength(2);
            expect(user1Notifications.notifications[0].type).toBe("warning"); // Most recent
            expect(user1Notifications.notifications[1].type).toBe("info");

            // Check user 2 notifications
            const user2Notifications = await getNotifications({ userId: user2Id });
            expect(user2Notifications.notifications).toHaveLength(1);
            expect(user2Notifications.notifications[0].type).toBe("error");
        });

        it("should maintain notification properties across storage and retrieval", async () => {
            const userId = randomUUID();
            
            const originalNotification = {
                type: "warning" as NotificationType,
                title: "Property Test",
                message: "Testing property preservation",
                user_id: userId
            };

            const sent = await sendNotification(originalNotification);
            const retrieved = await getNotifications({ userId });

            expect(retrieved.notifications[0]).toMatchObject({
                id: sent.id,
                type: originalNotification.type,
                title: originalNotification.title,
                message: originalNotification.message,
                user_id: originalNotification.user_id,
                read: false,
                created_at: sent.created_at
            });
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty strings in notification content", async () => {
            const userId = randomUUID();
            
            const result = await sendNotification({
                type: "info" as NotificationType,
                title: "",
                message: "",
                user_id: userId
            });

            expect(result.title).toBe("");
            expect(result.message).toBe("");
            expect(result.type).toBe("info");
        });

        it("should handle long notification content", async () => {
            const userId = randomUUID();
            const longTitle = "A".repeat(1000);
            const longMessage = "B".repeat(5000);
            
            const result = await sendNotification({
                type: "info" as NotificationType,
                title: longTitle,
                message: longMessage,
                user_id: userId
            });

            expect(result.title).toBe(longTitle);
            expect(result.message).toBe(longMessage);
        });

        it("should handle special characters in notification content", async () => {
            const userId = randomUUID();
            const specialTitle = "🚀 Special Title with émojis & symbols!";
            const specialMessage = "Message with\nnewlines\tand\ttabs & unicode: 你好世界";
            
            const result = await sendNotification({
                type: "success" as NotificationType,
                title: specialTitle,
                message: specialMessage,
                user_id: userId
            });

            expect(result.title).toBe(specialTitle);
            expect(result.message).toBe(specialMessage);
        });
    });
}); 