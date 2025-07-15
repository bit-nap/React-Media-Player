const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function hashStringNode(message) {
  const hash = crypto.createHash("sha256").update(message).digest("hex");
  return hash;
}

const USERS = [
  {
    username: process.env.SERVER_ADMIN_ACC,
    password: process.env.SERVER_ADMIN_PASS,
  }, // TODO: hash password
];

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const JWT_EXPIRES_IN = "2h";

// Login handler
function loginHandler(req, res) {
  const { username, password } = req.body;

  // console.log(hashStringNode(password));

  const user = USERS.find(
    (u) => u.username === username && u.password === hashStringNode(password)
  );
  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  const token = jwt.sign({ username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  res.json({ token, username });
}

// Middleware to protect routes
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Malformed token" });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid or expired token" });
    req.user = decoded;
    next();
  });
}

// refresh expired token
function refreshHandler(req, res) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid or expired token" });
    // Issue new token
    const newToken = jwt.sign({ username: decoded.username }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
    res.json({ token: newToken, username: decoded.username });
  });
}

module.exports = { loginHandler, authMiddleware, refreshHandler };
