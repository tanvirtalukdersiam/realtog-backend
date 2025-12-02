import { v2 as cloudinary } from "cloudinary";
import { config } from "@config/index.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string = "orders"
): Promise<{ url: string; public_id: string }> => {
  // Validate Cloudinary configuration
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary configuration is missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables."
    );
  }

  // Validate file buffer
  if (!file.buffer || file.buffer.length === 0) {
    throw new Error(`File buffer is empty for file: ${file.originalname}`);
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          // Provide more detailed error information
          const errorMessage = error.message || "Unknown Cloudinary error";
          reject(new Error(`Cloudinary upload failed: ${errorMessage}`));
        } else if (result) {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(
            new Error("Upload failed: No result returned from Cloudinary")
          );
        }
      }
    );

    uploadStream.on("error", (streamError) => {
      reject(
        new Error(
          `Upload stream error: ${
            streamError.message || "Unknown stream error"
          }`
        )
      );
    });

    uploadStream.end(file.buffer);
  });
};

export const deleteFromCloudinary = async (
  public_id: string
): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
  }
};

export default cloudinary;
