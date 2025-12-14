import { model, Schema } from 'mongoose';
import { ITagPerson } from './tagPeople.interface';

const tagPeopleSchema = new Schema<ITagPerson>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Prevent duplicate tagging of same user on same post
tagPeopleSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const TagPerson = model<ITagPerson>('TagPerson', tagPeopleSchema);
