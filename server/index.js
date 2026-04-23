// index.js (or your main server file name - e.g., server.js, app.js)
const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { initializeSocketIO } = require("./socketSetup");
const { errorHandler, notFound } = require("./middleware/error.js");
const seedAdmin = require("./bootstrap/seeder.js");

// --- IMPORT THE INITIALIZER FROM YOUR ROUTES FOLDER 
const initializeApiRoutes = require("./route/index.js");
const { startPromotionCron } = require("./cron/promotionCron.js");
const { startCommunityExpiryCron } = require("./cron/communityExpiryCron.js");
const { startSpecialDealCron } = require("./cron/specialDealCron.js");
const { startPromoCodeCron } = require("./cron/promoCodeCron.js");

const {
  squareWebhookHandler,
} = require("./controller/stripeWebhook.controller"); // Import Square webhook handler

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const clientURL = process.env.CLIENT_URL || "http://localhost:5173";
console.log(`[Server Init] CLIENT_URL resolved to: ${clientURL}`);

const server = http.createServer(app);
const io = initializeSocketIO(server, clientURL);
app.set("socketio", io);

const uploadDirRoot = path.join(__dirname, "uploads"); // Main uploads directory
if (!fs.existsSync(uploadDirRoot)) {
  fs.mkdirSync(uploadDirRoot, { recursive: true });
  console.log(`[Server Init] Created root uploads directory: ${uploadDirRoot}`);
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {});
    console.log("Connected to MongoDB");
    await seedAdmin();
    startPromotionCron();
    startCommunityExpiryCron();
    startSpecialDealCron();
    startPromoCodeCron();
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

app.use(cors());

// Square webhook endpoint needs raw body, so it must come before express.json()
app.post(
  "/api/square-webhook",
  express.raw({ type: "application/json" }),
  squareWebhookHandler
);

app.use(express.json()); // This should be after all webhook raw body parsers

app.use((req, res, next) => {
  console.log(
    "New request at",
    new Date().toISOString(),
    "Method:",
    req.method,
    "URL:",
    req.originalUrl
  );
  next();
});

// Serve static files from the main 'uploads' directory
// The subdirectories (profile_pictures, services, products) will be resolved correctly by express.static
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// --- INITIALIZE API ROUTES ---
// Pass the app instance to initialize all routes, excluding the webhook which is handled above
initializeApiRoutes(app);

// Error Handling Middleware (should be after routes)
app.use(notFound);
app.use(errorHandler);

server.listen(port, async () => {
  await connectDB();
  console.log(`Server is running on port ${port}. Socket.IO is attached.`);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
  server.close(() => process.exit(1));
});
