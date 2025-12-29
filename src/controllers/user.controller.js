import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
  // 1 get user details from frontend
  // 2 validation of user - not empty
  // 3 check if user already exists - username or email
  // 4 check if avatar is there or not,along with imgs
  // 5 upload them on cloudinary - check avatar
  // 6 create user object - create an entry in db
  // 7 remove password and refreshtoken fields
  // 8 check for user creation
  // 9 return response

  const { fullName, username, email, password } = req.body;
  console.log("email:", email);

  if ([fullName, username, email, password].some((f) => f?.trim() === "")) {
    throw new ApiError(400, "Fields Should'nt Be Empty");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already Exists with Email or Username");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  // const coverImageLocalPath=req.files?.coverImage?.[0]?.path
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  console.log("Uploaded files:", req.files);
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(
      500,
      "Something Went wrong from our side while registrating the user"
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;


  await user.save({ validateBeforeSave: false });

    return{
        accessToken,
        refreshToken
    }
  } catch (error) {
    console.error("Error in generateAccessandRefreshToken:", error);
    throw new ApiError(
      500,
      "Something went wrong from our side while generating tokens"
    );
  }
};
const loginUser = asyncHandler(async (req, res) => {
  // 1 req body-> data
  // 2 username or email
  // 3 find the user
  // 4 compare password
  // 5 access and refresh token
  // 6 send cookies
  // send response

  const { username, email, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "Username or Email is required");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isPasswordvalid = await user.isPasswordCorrect(password);

  if (!isPasswordvalid) {
    throw new ApiError(401, "Invalid user credentials");
  }
 const{
     accessToken,refreshToken} =await generateAccessandRefreshToken(user._id)
    const loggedInUser =await User.findById(user._id).select("-password -refreshToken")
     const options ={
        httpOnly:true,
        secure:true
     }
     res
     .status(200)
     .cookie("refreshToken", refreshToken,options)
     .cookie("accessToken", accessToken,options)
     .json(
        new ApiResponse(200,{
            user:loggedInUser,accessToken,refreshToken
        },
        "User logged in successfully")
     )

});

const logoutUser = asyncHandler(async(req,res)=>{
    // 1 get user id from req.user
    // 2 find user in db
    // 3 remove refresh token from db
    // 4 clear cookies
    // 5 send response

 await User.findByIdAndUpdate(   req.user._id,
    {
      $set:{
        refreshToken:"undefined"
      }
  },{
    new:true
  }
)
const options ={
    httpOnly:true,
    secure:true
   }
    return res
    .status(200)
    .clearCookie("refreshToken",options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200,"User logged out successfully"))
})
const refreshAccessToken = asyncHandler(async(req,res)=>{
  
  try {
     const incomingRefreshToken =req.cookies.refreshToken || req.body.refreshToken
     if(!incomingRefreshToken){
      throw new ApiError(401,"Unauthorized Request")
     }
   const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
   const user  = await User.findById(decodedToken?._id)
   if(!user){
      throw new ApiError(401,"invalid refresh token")
     }
    if(incomingRefreshToken !== user.refreshToken){
      throw new ApiError(401,"Token mismatch .Unauthorized request")
    }
    const options={
      httpOnly:true,
      secure:true
    }
    const {accessToken,newRefreshToken} = await generateAccessandRefreshToken(user._id)
    return res
    .status(200)
    .cookie("refreshToken", newRefreshToken,options)
    .cookie("accessToken", accessToken,options)
    .json(new ApiResponse(200,{
      accessToken,
      newRefreshToken,
     
  
    },"Access token refreshed successfully")
  )
  } catch (error) {
    throw new ApiError(401, error?.message || "Unauthorized Request")
  }
}
) 
const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const{oldPassword,newPassword}=req.body
   const user = await User.findById(req.user._id)
 const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
 if(!isPasswordCorrect){
  throw  new ApiError(400,"Invalid Old Password")
 }
 user.password=newPassword
 await user.save({validateBeforeSave:false})
 return res
 .status(200)
 .json(new ApiResponse(200,{},"Password Changed Successfully"))
})
const currentUser = asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(200,req.user,"Current User Fetched!!!")
})
const updateAccountDetails = asyncHandler(async(req,res)=>{
  const {fullName,email}= req.body
  if(!fullName || !email){
    throw new ApiError(400,"All fields are required")
  }
const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName,
        email
      }
    },
    {new:true}
  
  ).select("-password")
  return res
  .status(200)
  .json(new ApiResponse(200, user, "Account Details Updated"))
})
const avatarUpdate = asyncHandler(async(req,res)=>
  {
   const avatarLocalPath = req.file?.path
   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
   }
  const avatar =await uploadOnCloudinary(avatarLocalPath)
  if(!avatar.url){
     throw new ApiError(400,"Error while uploading Avatar")
  }
  const user =await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {new:true}
  ).select("-password")
  return res
  .status(200)
  .json(new ApiResponse(200,user,"Avatar Updated Successfully"))
  }
)
const coverImageUpdate = asyncHandler(async(req,res)=>
  {
   const coverImageLocalPath = req.file?.path
   if(!coverImageLocalPath){
    throw new ApiError(400,"Cover File is missing")
   }
  const coverImage =await uploadOnCloudinary(coverImageLocalPath)
  if(!coverImage.url){
     throw new ApiError(400,"Error while uploading Cover Image")
  }
 const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage:coverImage.url
      }
    },
    {new:true}
  ).select("-password")
  return res
  .status(200)
  .json(new ApiResponse(200,user,"Cover Image Updated Successfully"))
  }
  
)
const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

export { registerUser,
   loginUser,
    logoutUser,
     refreshAccessToken,
     changeCurrentPassword,
     currentUser,
    updateAccountDetails,
    avatarUpdate,
    coverImageUpdate,
    getUserChannelProfile,
    getWatchHistory
  
  
  
  };
