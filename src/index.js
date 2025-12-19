import dotenv from "dotenv"
import connectDB from "./database/db.js"
import { app } from "./app.js"

dotenv.config({
    path:"./.env"
})

connectDB()
.then(
   ()=>{
    app.listen(process.env.PORT || 3000 ,()=>{
        console.log(`Server is running on http://localhost:${process.env.PORT}`)
    })
   }
)
.catch(
    (err)=>{
    console.log("Mongo DB connection failed!!", err)
    }
)

/*
import express from "express"
const app = express()
;(()=>{
    try {
        mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", ()=>{
            console.log("Error:", error)
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port http://localhost:${process.env.MONGODB_URI}`)
        })
    } catch (error) {
       console.error("Error Detected", error)
       throw err 
    }
})()
    */