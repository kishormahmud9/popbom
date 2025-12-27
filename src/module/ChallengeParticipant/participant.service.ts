import mongoose from "mongoose";
import { Post } from "../Post/post.model";
import { IChallengeParticipant } from "./participant.interface";
import { ChallengeParticipant } from "./participant.model";


const addParticipant = async (data: Partial<IChallengeParticipant>) => {
  return await ChallengeParticipant.create(data);
};

const getParticipantsByChallenge = async (challengeId: string) => {
  return await ChallengeParticipant.find({ challengeId })
    .populate("participantId", "name photo")
    .populate("postId", "title videoUrl");
};

const getChallengesByUser = async (userId: string) => {
  return await ChallengeParticipant.find({ participantId: userId })
    .populate("challengeId", "challengeName challengePoster")
    .populate("postId", "title videoUrl");
};

const removeParticipant = async (id: string) => {
  return await ChallengeParticipant.findByIdAndDelete(id);
};

const getAllParticipantsRanked = async (challengeId: string) => {

  const ranking = await ChallengeParticipant.aggregate([
    {
      $match: {
        challengeId: new mongoose.Types.ObjectId(challengeId)
      }
    },

    // 🔹 Join watch count
    {
      $lookup: {
        from: "postwatchcounts",
        localField: "postId",
        foreignField: "postId",
        as: "watchData"
      }
    },

    {
      $addFields: {
        watchCount: {
          $ifNull: [{ $arrayElemAt: ["$watchData.watchCount", 0] }, 0]
        }
      }
    },

    // 🔹 Sort by highest views
    { $sort: { watchCount: -1 } },

    // 🔹 Join user
    {
      $lookup: {
        from: "users",
        localField: "participantId",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },

    // 🔹 Join userDetails for name & photo
    {
      $lookup: {
        from: "userdetails",
        localField: "user._id",
        foreignField: "userId",
        as: "userDetails"
      }
    },
    { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },

    // 🔹 Final output
    {
      $project: {
        participantId: 1,
        postId: 1,
        watchCount: 1,
        "user.username": 1,
        "userDetails.name": 1,
        "userDetails.photo": 1
      }
    }
  ]);


  return ranking;

};

export const ChallengeParticipantServices = {
  addParticipant,
  getParticipantsByChallenge,
  getChallengesByUser,
  removeParticipant,
  getAllParticipantsRanked,
};
