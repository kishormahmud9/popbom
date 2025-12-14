
import { CreatePostInput, IPost } from "./post.interface";
import { Post } from "./post.model";
import { PostTag } from "../PostTag/postTag.model";
import { TagPerson } from "../TagPeople/tagPeople.model";


import mongoose from "mongoose";
import { ChallengeParticipant } from "../ChallengeParticipant/participant.model";
import { Story } from "../Story/story.model";
import { Follow } from "../Follow/follow.model";
import { ITag } from "../Tag/tag.interface";
import { PostReaction } from "../PostReaction/reaction.model";
import { Comment } from "../Comment/comment.model";
import { SharedPost } from "../SharedPost/sharedPost.model";
import { SavedPost } from "../SavePost/savedPost.model";
import { PostWatchCount } from "../PostWatchCount/watchCount.model";
import AppError from "../../app/errors/AppError";
import status from "http-status";

const createPost = async (data: Partial<CreatePostInput>) => {
  // 1. Create core post
  const post = await Post.create({
    title: data.title,
    body: data.body,
    authorId: data.authorId,
    challengeId: data.challengeId,
    videoUrl: data.videoUrl,
    musicUrl: data.musicUrl,
    location: data.location,
    postType: data.postType,
    audience: data.audience || 'everyone',
    status: 'active',
  });

  // 2. Handle hashtags
  const allTagIds: string[] = [];

  if (data.hashTagIds?.length) {
    allTagIds.push(...data.hashTagIds);
  }

  // Remove duplicates and convert to ObjectId
  const uniqueTagIds = Array.from(new Set(allTagIds))
    .map(id => new mongoose.Types.ObjectId(id));

  // 3. Create PostTag links
  if (uniqueTagIds.length) {
    await Promise.all(
      uniqueTagIds.map(tagId =>
        PostTag.create({ postId: post._id, tagId })
      )
    );
  }

  // 4. Handle tagged people
  if (data.tagPeople?.length) {
    await Promise.all(
      data.tagPeople.map(userId =>
        TagPerson.create({
          postId: post._id,
          userId: new mongoose.Types.ObjectId(userId),
        })
      )
    );
  }

  if(data.challengeId){
    await ChallengeParticipant.create({
      challengeId:new mongoose.Types.ObjectId(data.challengeId),
      postId:post._id,
      participantId: new mongoose.Types.ObjectId(data.authorId)
    })
  }
  //handle postType ='story'
  if(post.postType ==='story'){
    await Story.create({
      authorId:post.authorId,
      postId: post._id
    })
  }

  return {
    post,
    tagPeople: data.tagPeople || [],
  };
};

const attachTaggedPeople = async (posts: any[]) => {
  return Promise.all(
    posts.map(async post => {
      const tagged = await TagPerson.find({ postId: post._id })
        .populate({
          path: "userId",
          select: "username",
          populate: {
            path: "userDetails",
            select: "name photo"
          }
        })
        .lean();

      return {
        ...post,
        taggedPeople: tagged.map(t => {
          const u: any = t.userId;
          return {
            _id: u?._id,
            username: u?.username,
            name: u?.userDetails?.name,
            photo: u?.userDetails?.photo,
          };
        })
      };
    })
  );
};


const attachHashtags = async (posts: any[]) => {
  return Promise.all(
    posts.map(async post => {
      const tags = await PostTag.find({ postId: post._id })
        .populate<{ tagId: ITag }>("tagId", "tagName")
        .lean();

      return {
        ...post,
        hashtags: tags
          .map(t => t.tagId?.tagName || null)
          .filter(Boolean)
      };
    })
  );
};

const attachPostCounts = async (posts: any[]) => {
  return Promise.all(
    posts.map(async post => {
      const [likes, comments, shares, saved, watch] = await Promise.all([
        PostReaction.countDocuments({ postId: post._id }),
        Comment.countDocuments({ postId: post._id }),
        SharedPost.countDocuments({ postId: post._id }),
        SavedPost.countDocuments({ postId: post._id }),
        PostWatchCount.findOne({ postId: post._id })
      ]);

      return {
        ...post,
        counts: {
          likes,
          comments,
          shares,
          saved,
          watchCount: watch?.watchCount || 0
        }
      };
    })
  );
};


  const getPostById = async (postId: string) => {
    let post = await Post.findById(postId)
    .populate({
      path: 'authorId',
      select: 'username email',
      populate: { path: 'userDetails', select: 'name photo' }
    }).lean();

    if(!post) return null;

    post = (await attachHashtags([post]))[0];

    // Attach tagged people
    post = (await attachTaggedPeople([post]))[0];

    // Attach counts
    post = (await attachPostCounts([post]))[0];

    return post;
  };

  // send only reels
  // loggedin user posts
  const getPostsByUser = async (userId: string) => {
    const posts = await Post.find({ authorId: userId, postType: "reels" }).sort({ createdAt: -1 })
    .populate({
      path: 'authorId',
      select: 'username',
      populate: { 
        path: 'userDetails', 
        select: 'name photo' 
      }
    }).lean();

    let result = posts;

    result = await attachHashtags(result);
    result = await attachTaggedPeople(result);
    result = await attachPostCounts(result);

    return result;
  };

  const getPostsByUserId = async (userId: string) => {

    let posts = await Post.find({ authorId: userId })
    .sort({ createdAt: -1 })
    .populate({
      path: 'authorId',
      select: 'username',
      populate: { 
        path: 'userDetails', 
        select: 'name photo' 
      }
    }).lean();

    
     const simplified = posts.map((p: any) => ({
    _id: p._id,
    title: p.title,
    body: p.body,
    videoUrl: p.videoUrl,
    musicUrl: p.musicUrl,
    location: p.location,
    status: p.status,
    audience: p.audience,
    postType: p.postType,
    authorUsername: p.authorId?.username,
    authorName: p.authorId?.userDetails?.name,
    authorPhoto: p.authorId?.userDetails?.photo,
  }));

    return simplified;
  };

 const getFeed = async (currentUserId: string) => {

  const followingRecords = await Follow.find({ followingUserId: currentUserId })
    .select('followedUserId');

  const followingIds = followingRecords.map(r => r.followedUserId);

  const posts = await Post.find({
    $or: [
      { audience: 'everyone', status: 'active' },
      { authorId: { $in: followingIds }, audience: 'follower', status: 'active' }
    ]
  })
    .sort({ createdAt: -1 })
    .populate({
      path: 'authorId',
      select: 'username',
      populate: { path: 'userDetails', select: 'name photo' }
    }).lean();

     let result = posts;
  result = await attachHashtags(result);
  result = await attachTaggedPeople(result);
  result = await attachPostCounts(result);

  return result;
};

const getTaggedPosts = async (userId:string) =>{
  const tagEntries = await TagPerson.find({userId}).select("postId").lean();
  const postIds = tagEntries.map(t => t.postId);
  if(!postIds.length) return [];
  let posts = await Post.find({_id: { $in:postIds }, status:"active"})
  .sort({createdAt:-1})
  .populate({
    path:"authorId",
    select:"username",
    populate: {
      path:"userDetails", select:"name photo"
    }
  })
  .lean();

  posts = await attachHashtags(posts);
  posts = await attachTaggedPeople(posts);
  posts = await attachPostCounts(posts);

 return posts;
}

  const updatePost = async (postId: string, data: Partial<IPost>) => {
    
    return await Post.findByIdAndUpdate(postId, data, { new: true, runValidators: true });
  };

  const deletePost = async (postId: string) => {
    const session = await mongoose.startSession();

    let usedTransaction = false;
    const safeSession = usedTransaction ? session : null;

    try {
      try {
        session.startTransaction();
        usedTransaction = true;
      } catch (err) {
        usedTransaction = false;
      }

      const post = await Post.findById(postId).session(safeSession);
      if(!post){
        if(usedTransaction){
          await session.abortTransaction();
          session.endSession();
        }
        throw new AppError(status.NOT_FOUND, "Post not found");
      }

      await Post.findByIdAndDelete(postId, usedTransaction ? {session} : undefined);

      const deleteOps: Promise<any>[] =[];

        deleteOps.push(PostTag.deleteMany({ postId }).session(safeSession));
        deleteOps.push(TagPerson.deleteMany({ postId }).session(safeSession));
        deleteOps.push(ChallengeParticipant.deleteMany({ postId }).session(safeSession));
        deleteOps.push(Story.deleteMany({ postId }).session(safeSession));
        deleteOps.push(PostReaction.deleteMany({ postId }).session(safeSession));
        deleteOps.push(Comment.deleteMany({ postId }).session(safeSession));
        deleteOps.push(SharedPost.deleteMany({ postId }).session(safeSession));
        deleteOps.push(SavedPost.deleteMany({ postId }).session(safeSession));
        deleteOps.push(PostWatchCount.deleteMany({ postId }).session(safeSession));

        await Promise.all(deleteOps);

        if(usedTransaction){
          await session.commitTransaction();
          session.endSession();
        }
        return true;
    
    } catch (err){
      try {
        if(usedTransaction){
          await session.abortTransaction();
          session.endSession();
        }
      } catch (e) {
        
      }
      throw err;
    }

  };

  export const PostServices ={
    createPost,
    getPostById,
    getPostsByUser,
    getPostsByUserId,
    getFeed,
    updatePost,
    deletePost,
    getTaggedPosts
  }