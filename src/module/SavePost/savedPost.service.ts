import { SavedPost } from "./savedPost.model";
import { Types } from "mongoose";
import AppError from "../../app/errors/AppError";
import status from "http-status";
import { JwtPayload } from "jsonwebtoken";

interface SavePayload {
  postId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
}

const savePost = async (payload: SavePayload) => {
  try {
    const record = await SavedPost.create({
      postId: payload.postId,
      userId: payload.userId,
    });

    return record;
  } catch (err: any) {
    // handle duplicate key (already saved)
    if (err?.code === 11000) {
      throw new AppError(status.CONFLICT, "Post already saved");
    }
    throw err;
  }
};


const getSavedById = async (id: string) => {
  const record = await SavedPost.findById(id).populate("postId", "title videoUrl")
  .populate({
    path: "userId",
    select: "username",
    populate: {
    path: "userDetails",
    select: "name photo"
    }
  });

  if (!record) throw new AppError(status.NOT_FOUND, "Saved post not found");
  return record;
};

const getSavedByUser = async (userId: string) => {
  const data = await SavedPost.find({ userId })
      .sort({ createdAt: -1 })
      .populate("postId", "title videoUrl createdAt")
      .populate({
          path: "userId",
          select: "username",
          populate: {
          path: "userDetails",
          select: "name photo"
          }
      });

  return data;
};

const deleteSaved = async (postId: string, user: JwtPayload) => {
  // console.log("Id ",id, 'user ',user);
  const userId = user.id;
  const record = await SavedPost.find({postId});
  if (!record) throw new AppError(status.NOT_FOUND, "Saved post not found");
  
  const deleted = await SavedPost.findOneAndDelete({
    postId,
    userId
  });

  if(!deleted){
    throw new AppError(status.NOT_FOUND,"Saved post not found");
  }

  return true;
};

export const SavedPostServices = {
  savePost,
  getSavedById,
  getSavedByUser,
  deleteSaved,
};