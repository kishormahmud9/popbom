import { Comment } from "./comment.model";
import { Post } from "../Post/post.model";
import { IComment } from "./comment.interface";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../app/errors/AppError";
import status from "http-status";
import { NotificationService } from "../Notification/notification.service";
// import { io } from "../../server";


const createComment = async (data: Partial<IComment>) => {

  const comment = await Comment.create(data);

  // 1) Notify post author
  const post = await Post.findById(data.postId);
  if (post) {
    await NotificationService.sendNotification({
      userId: post.authorId as any,
      senderId: data.userId as any,
      type: 'comment',
      message: 'commented on your post',
      linkType: 'post',
      linkId: data.postId as any,
    });
  }

  // 2) Notify parent comment author (if this is a reply)
  if (data.parentCommentId) {
    const parentComment = await Comment.findById(data.parentCommentId);
    if (parentComment && parentComment.userId.toString() !== data.userId?.toString()) {
      await NotificationService.sendNotification({
        userId: parentComment.userId as any,
        senderId: data.userId as any,
        type: 'reply',
        message: 'replied to your comment',
        linkType: 'comment',
        linkId: parentComment._id as any,
      });
    }
  }

  return comment;
};

const getCommentsByPost = async (postId: string) => {

  return await Comment.find({ postId })
    .sort({ createdAt: -1 })
    .populate("userId", "name photo")
    .populate("parentCommentId");
};

const updateComment = async (commentId: string, user: JwtPayload, data: Partial<IComment>) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new AppError(status.NOT_FOUND, "Comment not found");

  if (comment.userId.toString() !== user.id && user.role !== "admin") {
    throw new AppError(status.UNAUTHORIZED, "You are not authorized to update this comment");
  }

  comment.comment = data.comment || comment.comment;
  await comment.save();
  return comment;
};

const deleteComment = async (commentId: string, user: JwtPayload) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new AppError(status.NOT_FOUND, "Comment not found");

  if (comment.userId.toString() !== user.id && user.role !== "admin") {
    throw new AppError(status.UNAUTHORIZED, "You are not authorized to delete this comment");
  }

  await Comment.findByIdAndDelete(commentId);
};

export const CommentServices = {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
};
