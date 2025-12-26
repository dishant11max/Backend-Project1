import mongoose from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
const userSchema= new mongoose.Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },
         email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
         fullName:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
          avatar:{
            type:String, 
            required:true
        },
        coverImage:{
            type:String
            
        },
        watchHistory:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true,"Password is required"]
        },
        refreshToken:{
            type:String
        }

},
{timestamps:true})
userSchema.pre("save", async function () {
   if (!this.isModified("password")) return;
   this.password = await bcrypt.hash(this.password, 10);
});
userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateAccessToken = function (){
   try {
       
       return jwt.sign({
            _id: this._id,
            fullName: this.fullName,
            username: this.username,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
   } catch (error) {
       console.error("Error generating access token:", error);
       throw new ApiError("Failed to generate access token");
      
   }
};
userSchema.methods.generateRefreshToken = function () {
   try {
       return jwt.sign({
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
   } catch (error) {
       console.error("Error generating refresh token:", error);
       throw new ApiError("Failed to generate refresh token");
   }
};
export const User = mongoose.model("User", userSchema)