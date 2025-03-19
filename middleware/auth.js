const jwt = require("jsonwebtoken");
const JWT_SECRET = "Dhyan04"; // Store this in an env variable for security

// ✅ Authentication Middleware
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if the Authorization header is missing
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header missing" });
    }

    // Extract the token from Authorization header
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token missing in Authorization header" });
    }

    // ✅ Allow Predefined Admin Token (For Frontend Fake Login)
    if (token === "fake-jwt-token") {
      req.userId = "admin"; // Fake admin ID
      req.userRole = "admin"; // Assign admin role
      return next();
    }

    // ✅ Verify JWT Token for Real Users
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId; // Extract user ID
    req.userRole = decoded.role; // Extract user role ("admin" or "user")

    next(); // Proceed to the next middleware
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token has expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }

    console.error("Authorization error:", error);
    return res.status(500).json({ error: "Internal server error during authorization" });
  }
};

// ✅ Middleware to Restrict Access to Admins Only
const adminMiddleware = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
};

// ✅ Middleware to Restrict Access to Users Only
const userMiddleware = (req, res, next) => {
  if (req.userRole !== "user") {
    return res.status(403).json({ error: "Access denied. Users only." });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware, userMiddleware };
