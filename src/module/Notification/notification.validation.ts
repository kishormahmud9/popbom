import { z } from "zod";

const createNotificationSchema = z.object({
  body: z.object({
    userId: z.string({ required_error: 'User ID is required' }),
    notificationBody: z.string({ required_error: 'Notification body is required' }),
  }),
});

export const NotificationValidation = {
  createNotificationSchema
};
