import { model, Schema } from "mongoose";
import { INotification } from "./notification.interface";

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    postId: { type: Schema.Types.ObjectId, ref:"Post" },
    reactedBy: { type: Schema.Types.ObjectId, ref:"User" },
    message:{ type:String, required:true },
    isRead: { type: Boolean, default:false }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notification = model<INotification>('Notification', notificationSchema);
