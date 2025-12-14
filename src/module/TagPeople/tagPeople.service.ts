import { TagPerson } from './tagPeople.model';
import { ITagPerson } from './tagPeople.interface';
import AppError from '../../app/errors/AppError';
import status from 'http-status';

const tagPerson = async (payload: Partial<ITagPerson>) => {
  // create, unique index will prevent duplicates
  const tag = await TagPerson.create(payload);
  return tag;
};

const getTaggedUsersByPost = async (postId: string) => {
  return await TagPerson.find({ postId })
    .populate('userId', 'name photo email')
    .sort({ createdAt: -1 });
};

const getTaggedPostsByUser = async (userId: string) => {
  return await TagPerson.find({ userId })
    .populate('postId', 'title body authorId createdAt')
    .sort({ createdAt: -1 });
};

const removeTagById = async (id: string) => {
  const tag = await TagPerson.findByIdAndDelete(id);
  if (!tag) throw new AppError(status.NOT_FOUND, 'Tag not found');
  return true;
};

// optional: remove tag by postId + userId
const removeTagByPostAndUser = async (postId: string, userId: string) => {
  const tag = await TagPerson.findOneAndDelete({ postId, userId });
  if (!tag) throw new AppError(status.NOT_FOUND, 'Tag not found');
  return true;
};

export const TagPeopleService = {
  tagPerson,
  getTaggedUsersByPost,
  getTaggedPostsByUser,
  removeTagById,
  removeTagByPostAndUser,
};
