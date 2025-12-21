import { Types } from "mongoose";
import { Post } from "../Post/post.model";
import { Notification } from "./notification.model";
import { INotificationPayload } from "./notification.interface";



const sendNotification = async (payload: INotificationPayload) => {
  
  if (payload.userId.toString() === payload.senderId.toString()) return;

  const notification = await Notification.create({
    ...payload,
    isRead: false,
  });

  return notification;
};


const createReactionNotification = async (data: { postId: string, userId: string, reaction: string }) => {
  const post = await Post.findById(data.postId);
  if (!post) throw new Error("Post not found");

  return await sendNotification({
    userId: post.authorId.toString(),
    senderId: data.userId,
    type: "reaction",
    message: `reacted with ${data.reaction} on your post`,
    linkType: "post",
    linkId: data.postId,
  });
};

const createCommentNotification = async (data: { postId: string, userId: string }) => {
  const post = await Post.findById(data.postId);
  if (!post) throw new Error("Post not found");

  return await sendNotification({
    userId: post.authorId.toString(),
    senderId: data.userId,
    type: "comment",
    message: `commented on your post`,
    linkType: "post",
    linkId: data.postId,
  });
};

const getNotificationsForUser = async (userId: string) => {
  return await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .populate("senderId", "username")
    .populate({
      path: "senderId",
      populate: { path: "userDetails", select: "name photo" }
    });
};

export const NotificationService = {
  sendNotification,
  createReactionNotification,
  createCommentNotification,
  getNotificationsForUser,
};
