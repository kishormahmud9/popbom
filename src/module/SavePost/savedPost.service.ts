import { SavedPost } from "./savedPost.model";
import { Types } from "mongoose";
import mongoose from "mongoose";
import AppError from "../../app/errors/AppError";
import status from "http-status";
import { JwtPayload } from "jsonwebtoken";
import { Post } from "../Post/post.model";
import { PostReaction } from "../PostReaction/reaction.model";
import { PostWatchCount } from "../PostWatchCount/watchCount.model";


interface SavePayload {
  postId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
}

const savePost = async (payload: SavePayload) => {
  try {
    const authorId = await Post.findById(payload.postId).select("authorId");
    if (!authorId) throw new AppError(status.NOT_FOUND, "Post not found");
    if (authorId?.authorId.toString() === payload.userId.toString()) {
      throw new AppError(status.BAD_REQUEST, "You cannot save your own post");
    }

    // check if the post is already saved with the same user
    const isSaved = await SavedPost.findOne({ postId: payload.postId, userId: payload.userId });
    if (isSaved) {
      throw new AppError(status.BAD_REQUEST, "Post already saved");
    }

    const record = await SavedPost.create({
      postId: payload.postId,
      authorId: authorId?.authorId,
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
  // Query 1: Get all saved posts with post and author data
  const savedPosts = await SavedPost.aggregate([
    // Step 1: Get all SavedPost documents for this userId
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId)
      }
    },

    // Step 2: Join Post data using SavedPost.postId
    {
      $lookup: {
        from: "posts",
        localField: "postId",
        foreignField: "_id",
        as: "post"
      }
    },
    { $unwind: "$post" },

    // Step 3: Join author User data using SavedPost.authorId
    {
      $lookup: {
        from: "users",
        localField: "authorId",
        foreignField: "_id",
        as: "author"
      }
    },
    { $unwind: "$author" },

    // Step 4: Join author UserDetails
    {
      $lookup: {
        from: "userdetails",
        localField: "author._id",
        foreignField: "userId",
        as: "authorDetails"
      }
    },
    { $unwind: { path: "$authorDetails", preserveNullAndEmptyArrays: true } },

    // Step 5: Sort by createdAt descending
    { $sort: { createdAt: -1 } },

    // Step 6: Project basic fields
    {
      $project: {
        _id: 1,
        postId: "$post._id",
        post: {
          title: "$post.title",
          videoUrl: "$post.videoUrl",
          createdAt: "$post.createdAt"
        },
        authorId: "$author._id",
        author: {
          username: "$author.username"
        },
        authorDetails: {
          name: "$authorDetails.name",
          photo: "$authorDetails.photo"
        },
        createdAt: 1,
        updatedAt: 1
      }
    }
  ]);

  // Query 2: Get all postIds and fetch reactions for each post
  const postIds = savedPosts.map((sp: any) => sp.postId);

  if (postIds.length === 0) {
    return [];
  }

  // Get all reactions for these posts
  const reactions = await PostReaction.aggregate([
    {
      $match: {
        postId: { $in: postIds }
      }
    },
    {
      $group: {
        _id: {
          postId: "$postId",
          reaction: "$reaction"
        },
        count: { $sum: 1 }
      }
    }
  ]);

  // Query 3: Get watch counts for these posts
  const watchCounts = await PostWatchCount.find({
    postId: { $in: postIds }
  }).lean();

  // Build a map: postId -> reactionsByType
  const reactionsMap = new Map<string, { heart: number; like: number; sad: number; happy: number; angry: number }>();
  // Build a map: postId -> watchCount
  const watchCountMap = new Map<string, number>();

  // Initialize reactions map for all posts
  postIds.forEach((pid: any) => {
    reactionsMap.set(pid.toString(), {
      heart: 0,
      like: 0,
      sad: 0,
      happy: 0,
      angry: 0
    });
  });

  // Process reactions
  reactions.forEach((r: any) => {
    const postId = r._id.postId.toString();
    const reactionType = r._id.reaction;
    const count = r.count;

    const reactionsByType = reactionsMap.get(postId)!;
    if (reactionsByType) {
      // Directly assign count based on reaction type
      switch (reactionType) {
        case "heart":
          reactionsByType.heart = count;
          break;
        case "like":
          reactionsByType.like = count;
          break;
        case "sad":
          reactionsByType.sad = count;
          break;
        case "happy":
          reactionsByType.happy = count;
          break;
        case "angry":
          reactionsByType.angry = count;
          break;
      }
    }
  });

  // Process watch counts
  watchCounts.forEach((wc: any) => {
    watchCountMap.set(wc.postId.toString(), wc.watchCount || 0);
  });

  // Transform to match expected structure and attach reactionsByType, reactionCount, and watchCount
  return savedPosts.map((item: any) => {
    const postIdStr = item.postId.toString();
    const reactionsByType = reactionsMap.get(postIdStr) || {
      heart: 0,
      like: 0,
      sad: 0,
      happy: 0,
      angry: 0
    };

    // Calculate total reaction count
    const reactionCount = reactionsByType.heart + reactionsByType.like + reactionsByType.sad + reactionsByType.happy + reactionsByType.angry;

    return {
      _id: item._id,
      postId: {
        _id: item.postId,
        title: item.post?.title,
        videoUrl: item.post?.videoUrl,
        createdAt: item.post?.createdAt
      },
      authorId: {
        _id: item.authorId,
        username: item.author?.username,
        userDetails: {
          name: item.authorDetails?.name,
          photo: item.authorDetails?.photo
        }
      },
      reactionCount,
      reactionsByType,

      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  });
};

const deleteSaved = async (postId: string, user: JwtPayload) => {

  const record = await SavedPost.find({ postId });
  if (!record) throw new AppError(status.NOT_FOUND, "Saved post not found");

  const deleted = await SavedPost.findOneAndDelete({
    _id: postId,
  });

  if (!deleted) {
    throw new AppError(status.NOT_FOUND, "Saved post not found");
  }

  return true;
};

export const SavedPostServices = {
  savePost,
  getSavedById,
  getSavedByUser,
  deleteSaved,
};