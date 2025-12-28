import { IChallengeParticipant } from "./participant.interface";
import { ChallengeParticipant } from "./participant.model";



const addParticipant = async (data: Partial<IChallengeParticipant>) => {
  const participant = await ChallengeParticipant.create(data);

  if (participant) {
    const { Challenge } = await import("../Challenge/challenge.model");
    const challenge = await Challenge.findById(data.challengeId);

    if (challenge && challenge.authorId.toString() !== data.participantId?.toString()) {
      const { NotificationService } = await import("../Notification/notification.service");
      await NotificationService.sendNotification({
        userId: challenge.authorId as any,
        senderId: data.participantId as any,
        type: 'challenge',
        message: 'accepted your challenge',
        linkType: 'challenge',
        linkId: challenge._id as any,
      });
    }
  }

  return participant;
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
