import { Schema, Types } from "mongoose";

export interface INotification {
  userId: Types.ObjectId; //recipient
  type: string;
  postId: Types.ObjectId;
  reactedBy: Types.ObjectId;
  message:string;
  isRead:boolean;
  createdAt?: Date;
}

export interface INotificationPayload {
  postId: Types.ObjectId | string;
  userId: Types.ObjectId | string; // who reacted
  reaction: string;
}

export interface ICommentNotificationPayload {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  comment:string;
}