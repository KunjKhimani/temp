// middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Path to the root of your project where 'server' folder is.
// If this middleware/upload.js is in 'project_root/server/middleware/upload.js',
// then __dirname is 'project_root/server/middleware'.
// So, path.join(__dirname, "..") is 'project_root/server'.
// And path.join(__dirname, "..", "uploads") is 'project_root/server/uploads'.
// This should align with your express.static path in index.js
const rootUploadDir = path.join(__dirname, "..", "uploads");

console.log(`[Multer Init] Middleware __dirname: ${__dirname}`);
console.log(`[Multer Init] Calculated rootUploadDir: ${rootUploadDir}`);

// Ensure main uploads folder exists (optional here if destination creates it, but good for clarity)
if (!fs.existsSync(rootUploadDir)) {
  console.log(
    `[Multer Init] Root uploads directory NOT FOUND. Attempting to create: ${rootUploadDir}`
  );
  try {
    fs.mkdirSync(rootUploadDir, { recursive: true });
    console.log(
      `[Multer Init] Successfully created root uploads directory: ${rootUploadDir}`
    );
  } catch (err) {
    console.error(
      `[Multer Init] CRITICAL ERROR: Failed to create root uploads directory: ${rootUploadDir}`,
      err
    );
    // You might want to throw an error here or handle it so multer doesn't proceed if this fails
  }
} else {
  console.log(`[Multer Init] Root uploads directory exists: ${rootUploadDir}`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = "others"; // Default subfolder

    // Log the fieldname to ensure it's what you expect
    // console.log(`[Multer Destination] File fieldname: ${file.fieldname}`);

    if (file.fieldname === "profilePicture") {
      subfolder = "profile_pictures";
    } else if (file.fieldname === "documents") {
      subfolder = "documents";
    } else if (file.fieldname === "media") {
      // For service images
      subfolder = "services";
    } else if (file.fieldname === "productImages") {
      // <<< --- ADD THIS CONDITION ---
      subfolder = "products";
    } else if (file.fieldname === "attachments") {
      subfolder = "serviceRequest";
    }
    // <<< --- New subfolder for product images
    // else, it remains 'others'

    const fullUploadPath = path.join(rootUploadDir, subfolder);
    // console.log(`[Multer Destination] For field '${file.fieldname}', determined subfolder: '${subfolder}', full path: ${fullUploadPath}`);

    if (!fs.existsSync(fullUploadPath)) {
      // console.log(`[Multer Destination] Subfolder NOT FOUND. Attempting to create: ${fullUploadPath}`);
      try {
        fs.mkdirSync(fullUploadPath, { recursive: true });
        // console.log(`[Multer Destination] Successfully created subfolder: ${fullUploadPath}`);
      } catch (err) {
        console.error(
          `[Multer Destination] FAILED to create subfolder: ${fullUploadPath}`,
          err
        );
        return cb(err); // Pass error to multer, stop processing this file
      }
    } else {
      // console.log(`[Multer Destination] Subfolder exists: ${fullUploadPath}`);
    }
    cb(null, fullUploadPath); // Tell multer to save file here
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Sanitize originalname: replace spaces with underscores, remove special chars if needed
    const originalFilename = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^\w.-]/g, "");
    const finalFilename = `${uniqueSuffix}-${originalFilename}`;
    // console.log(`[Multer Filename] Generated filename: ${finalFilename} for original: ${file.originalname}`);
    cb(null, finalFilename); // This is JUST the filename, not path
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp", // Common image types
    "application/pdf",
    // Add more types if needed, e.g., for documents
    // "application/msword",
    // "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.warn(
      `[Multer FileFilter] Blocked file type: ${file.mimetype} for ${file.originalname}`
    );
    cb(
      new Error("Invalid file type. Allowed: JPG, PNG, GIF, WEBP, PDF."),
      false
    ); // Provide more user-friendly error
  }
};

const upload = multer({
  storage: storage, // Corrected: use the 'storage' object defined above
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter, // Corrected: use the 'fileFilter' function
});

module.exports = upload;
