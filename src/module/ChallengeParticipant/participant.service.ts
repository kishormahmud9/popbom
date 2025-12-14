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

export const ChallengeParticipantServices = {
  addParticipant,
  getParticipantsByChallenge,
  getChallengesByUser,
  removeParticipant,
};
