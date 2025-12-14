import { catchAsync } from '../../app/utils/catchAsync';
import sendResponse from '../../app/utils/sendResponse';
import status from 'http-status';
import { PostServices } from './post.service';
import { JwtPayload } from 'jsonwebtoken';


const createPost = catchAsync(async (req, res) => {
  const fileUrl = req.file?.path;

  console.log("cloudinary url ",fileUrl);

  const data = { 
    ...req.body, 
    authorId: req.user?.id,
    videoUrl:fileUrl 
  };

  if(typeof data.tagPeople ==='string'){
    try {
      data.tagPeople = JSON.parse(data.tagPeople);
    } catch (error) {
      data.tagPeople = [];
    }
  }
  
    if (typeof data.hashTagIds === 'string') {
    try {
      data.hashTagIds = JSON.parse(data.hashTagIds);
    } catch {
      data.hashTagIds = [];
    }
  }

  const post = await PostServices.createPost(data);

  sendResponse(res, {
    statusCode: status.CREATED, 
    success: true, 
    message: 'Post created', 
    data: post 
  });
});

const getPost = catchAsync(async (req, res) => {
  const post = await PostServices.getPostById(req.params.id);
  console.log(post);

  sendResponse(res, { 
    statusCode: status.OK,
    success: true,
    message:'Post retrived successfully',
    data: post
  });
});

// only reels
const getLoggedInUserPosts = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  
  const userId = user._id.toString();

  const posts = await PostServices.getPostsByUser(userId);

  sendResponse(res, { 
    statusCode: status.OK,
    success: true,
    message:'Post retrived successfully',
    data: posts
  });
});

const getUserPostsByUserId = catchAsync(async (req, res) => {
  
  const userId = req.params.userId;

  const posts = await PostServices.getPostsByUserId(userId);

  sendResponse(res, { 
    statusCode: status.OK,
    success: true,
    message:'Post retrived successfully',
    data: posts
  });
});

const getFeed = catchAsync(async (req, res) => {
  const currentUser = req.user as JwtPayload;

  const posts = await PostServices.getFeed(currentUser.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Feed retrieved successfully",
    data: posts,
  });
});


const updatePost = catchAsync(async (req, res) => {
  const post = await PostServices.updatePost(req.params.id, req.body);

  sendResponse(res, { 
    statusCode: status.OK,
    success: true,
    data: post
  });
});

const deletePost = catchAsync(async (req, res) => {
  await PostServices.deletePost(req.params.postId);

  sendResponse(res, { 
    statusCode: status.OK,
    success: true,
    message: 'Post deleted',
    data: null
  });
});

const getTaggedPosts = catchAsync(async (req, res) =>{
  const { userId } = req.params;

  const result = await PostServices.getTaggedPosts(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message:"Tagged posts retrieved successfully",
    data: result
  });
});

export const PostController = { 
  createPost,
  getPost,
  getLoggedInUserPosts,
  getUserPostsByUserId,
  getFeed,
  updatePost,
  deletePost,
  getTaggedPosts
};
