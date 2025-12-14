
import { Types } from "mongoose";
import AppError from "../../app/errors/AppError";
import status from "http-status";
import { StoryReply } from "./reply.model";

interface IReplyPayload {
    storyId: Types.ObjectId | string;
    authorUserId: Types.ObjectId | string;
    replyUserId: Types.ObjectId | string;
    replyMessage: string;
}

// Create a reply
const createReply = async (data: IReplyPayload) => {
    return StoryReply.create(data);
};

// Get replies for a story
const getRepliesByStory = async (storyId: string) => {
    return StoryReply.find({ storyId })
        .sort({ createdAt: -1 })
        .populate("replyUserId", "name photo")
        .populate("authorUserId", "name");
};

// Get replies by a user
const getRepliesByUser = async (userId: string) => {
    return StoryReply.find({ replyUserId: userId })
        .sort({ createdAt: -1 })
        .populate("storyId", "authorId createdAt")
        .populate("authorUserId", "name");
};

// Delete a reply (only reply owner or admin)
const deleteReply = async (replyId: string, userId: string, userRole: string) => {
    const reply = await StoryReply.findById(replyId);
    if (!reply) throw new AppError(status.NOT_FOUND, "Reply not found");

    if (reply.replyUserId.toString() !== userId && userRole !== "admin") {
        throw new AppError(status.UNAUTHORIZED, "You are not authorized to delete this reply");
    }

    await StoryReply.findByIdAndDelete(replyId);
    return true;
};

export const StoryReplyServices = {
    createReply,
    getRepliesByStory,
    getRepliesByUser,
    deleteReply,
};
