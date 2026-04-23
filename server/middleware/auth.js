const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../model/user.model");

const authMiddleware = asyncHandler(async (req, res, next) => {
  let token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token found" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY);

    const user = await User.findById(decoded.user_id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if the user's email is verified, unless they are an admin
    if (!user.isEmailVerified && !user.isAdmin) {
      return res.status(403).json({ message: "Email not verified" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT Authentication Error:", error.message);
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
});

const sellerAuth = (req, res, next) => {
  if (req.user?.isSeller) {
    return next();
  }
  return res.status(403).json({ message: "Not authorized as a seller" });
};

const adminAuth = (req, res, next) => {
  if (req.user?.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: "Not authorized as an admin" });
};

const optionalAuth = asyncHandler(async (req, res, next) => {
  let token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY);
    const user = await User.findById(decoded.user_id).select("-password");

    if (user && (user.isEmailVerified || user.isAdmin)) {
      req.user = user;
    }
    next();
  } catch (error) {
    // If token is invalid, just proceed as public user
    next();
  }
});

module.exports = { authMiddleware, sellerAuth, adminAuth, optionalAuth };
