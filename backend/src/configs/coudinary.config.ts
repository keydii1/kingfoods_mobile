import cloudinary from "cloudinary";
import dotenv from "dotenv";
dotenv.config();
const cloudinaryConfig = () => {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME as string,
    api_key: process.env.API_KEY as string,
    api_secret: process.env.API_SECRET as string,
  });
};

export default cloudinaryConfig;
