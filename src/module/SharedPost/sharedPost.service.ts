import { SharedPost } from "./sharedPost.model";
import { ISharedPost } from "./sharedPost.interface";

const createSharedPost = async (data: Partial<ISharedPost>) => {
  const sharedPost = await SharedPost.create(data);
  return sharedPost;
};

const getSharedPostsByPost = async (postId: string) => {
  return await SharedPost.find({ postId }).populate("userId", "name photo");
};

const getSharedPostsByUser = async (userId: string) => {
  return await SharedPost.find({ userId }).populate("postId", "title videoUrl createdAt");
};

export const SharedPostServices = {
  createSharedPost,
  getSharedPostsByPost,
  getSharedPostsByUser,
};