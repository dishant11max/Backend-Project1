import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async(req,res)=>{
// 1 get user details from frontend
// 2 validation of user - not empty
// 3 check if user already exists - username or email
// 4 check if avatar is there or not,along with imgs
// 5 upload them on cloudinary - check avatar
// 6 create user object - create an entry in db
// 7 remove password and refreshtoken fields 
// 8 check for user creation
// 9 return response


const {fullName,username,email,password}=req.body
console.log("email:", email)

if(
    [fullName,username,email,password].some((f)=>f?.trim()==="")
)
{
    throw new ApiError(400,"Fields Should'nt Be Empty")
}

const existedUser =User.findOne(
    {
        $or:[{ username },{ email }]
    }
)
if(existedUser){
    throw new ApiError(409,"User already Exists with Email or Username")
}

const avatarLocalPath=req.files?.avatar[0]?.path
const coverImageLocalPath=req.files?.coverImage[0]?.path

if(!avatarLocalPath){
    throw new ApiError(400,"Avatar is needed")
}

const avatar = await uploadOnCloudinary(avatarLocalPath);
const coverImage = await uploadOnCloudinary(coverImageLocalPath);

if(!avatar){
     throw new ApiError(400,"Avatar is needed")
}

 const user = await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
})

const createdUser=await User.findById(user._id).select(
    "-password -refreshToken"
)
if(!createdUser)
{
    throw new ApiError(500,"Something Went wrong from our side while registrating the user")

}

return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully")
)






})

export {registerUser}