import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"



    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: CLOUDINARY_API_SECRET
    });
    
    const uploadOnCloudinary=async(localFilePath)=>{
        try {
            if(!localFilePath) return null
            // upload files on cloudinary
            const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto"
            })
            // finished uploading on cloudinary
            console.log("File has been uploaded successfully!!", response.url);
            return response;
        } catch (error) {
            fs.unlink(localFilePath) //remove the file from the locally saved temp file as the operation failed
            return null;
        }
    }
    export{uploadOnCloudinary}
  