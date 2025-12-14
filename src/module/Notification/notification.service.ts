import { Types } from "mongoose";
import { Post } from "../Post/post.model";
import { Notification } from "./notification.model";
import { ICommentNotificationPayload, INotificationPayload } from "./notification.interface";



const createReactionNotification = async (data: INotificationPayload) => {
  
  const post = await Post.findById(data.postId);

  if (!post) throw new Error("Post not found");

  const postOwnerId = post.authorId.toString();

  // Avoid notifying the user for their own action
  if (postOwnerId === data.userId) return;


  const notification = await Notification.create({
    userId: postOwnerId,        // recipient
    type: "reaction",
    postId: data.postId,
    reactedBy: data.userId,
    message: `User reacted with ${data.reaction} on your post.`,
    isRead: false,
  });

  return notification;
};

const createCommentNotification = async (data: ICommentNotificationPayload) =>{
  const post = await Post.findById(data.postId);
  if(!post) throw new Error("Post not found");

  const postOwnerId = post.authorId.toString();
  if(postOwnerId.toString() === data.userId.toString()){
    return;
  }

  const notification = await Notification.create({
    userId:postOwnerId,
    type:'comment',
    postId:data.postId as Types.ObjectId,
    reactedBy:data.userId as Types.ObjectId,
    message:`Someone commented on your post`,
    isRead:false
  });
  return notification;
}

const getNotificationsForUser = async (userId: string) => {
  return await Notification.find({ userId }).sort({ createdAt: -1 });
};

export const NotificationService = {
  createReactionNotification,
  createCommentNotification,
  getNotificationsForUser
};
