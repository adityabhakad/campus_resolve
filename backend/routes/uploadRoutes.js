import express from "express";
import multer from "multer";
import crypto from "crypto";

const router = express.Router();

// Check File Type
function checkFileType(file, cb) {
  const filetypes = /^image\/(jpeg|jpg|png|webp)$/;
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Images Only! (JPEG, JPG, PNG, WEBP)"));
  }
}

// Init Upload (Max 5 images of 5MB max each)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5000000 }, 
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

const uploadToCloudinary = async (file) => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary environment variables are not configured");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "campus-resolve";
  const signaturePayload = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash("sha1").update(signaturePayload).digest("hex");

  const formData = new FormData();
  formData.append("file", new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("timestamp", String(timestamp));
  formData.append("folder", folder);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Cloudinary upload failed");
  }

  return data.secure_url;
};

// Route for multiple image uploads
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files uploaded.");
    }
    
    const filePaths = await Promise.all(req.files.map(uploadToCloudinary));
    
    res.status(200).json({
      message: "Images Uploaded Successfully",
      filePaths,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
