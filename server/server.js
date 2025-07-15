const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

require("dotenv").config({ path: "../.env" });

const globalURL = process.env.REACT_APP_SERVER_URL;
const globalAPI = globalURL + ":" + process.env.REACT_APP_PORT; // Port

if (!process.env.REACT_APP_SERVER_URL) {
  console.warn(
    `[WARNING] REACT_APP_SERVER_URL is set to '${process.env.REACT_APP_SERVER_URL}' in your .env file.`
  );
}

const app = express();
const UPLOAD_DIR = path.join(__dirname, "../public/uploads");

app.use(cors());
app.use(express.json());

// app.use("/uploads", express.static(UPLOAD_DIR));
app.use(
  "/uploads",
  (req, res, next) => {
    const requested = decodeURIComponent(req.path);
    console.log(`[STATIC] Requested: ${requested}`);
    fs.readdir(UPLOAD_DIR, (err, files) => {
      if (err) {
        console.error("[STATIC] Could not read upload dir:", err);
      } else {
        console.log("[STATIC] Files in uploads dir:", files);
      }
      next();
    });
  },
  express.static(UPLOAD_DIR)
);

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

// Example: protect a route
// app.post("/upload", authMiddleware, upload.single("media"), (req, res) => { ... });
const { loginHandler, authMiddleware, refreshHandler } = require("./auth");

// Login endpoint
app.post("/login", loginHandler);

app.post("/refresh", refreshHandler);

const upload = multer({ storage });

app.post("/upload", authMiddleware, upload.single("media"), (req, res) => {
  const filePath = req.file ? req.file.path : null;
  if (!filePath) {
    return res.status(400).json({ success: false, error: "No file uploaded." });
  }
  fs.stat(filePath, (err, stats) => {
    if (err || !stats || stats.size === 0) {
      // Remove the empty/corrupted file if it exists
      if (!err) fs.unlink(filePath, () => {});
      return res.status(400).json({
        success: false,
        error: "File upload failed or file is corrupted.",
      });
    }
    res.json({ success: true, filename: req.file.filename });
  });
});

app.get("/files", authMiddleware, (req, res) => {
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(files);
  });
});

app.delete("/delete/:name", authMiddleware, (req, res) => {
  const filename = req.params.name;
  const filePath = path.join(UPLOAD_DIR, filename);

  console.log(`Looking for: ${filename}`);

  fs.unlink(filePath, (err) => {
    if (err) {
      return res
        .status(404)
        .json({ error: "File not found or could not be deleted." });
    }
    // Deselect if the deleted file was selected
    if (currentSelected === filename) {
      currentSelected = null;
    }
    res.json({ success: true });
  });
});

let currentSelected = null;

app.post("/deselect", authMiddleware, (req, res) => {
  currentSelected = null;
  res.json({ selected: null });
});

app.post("/select", authMiddleware, (req, res) => {
  const { filename } = req.body;
  currentSelected = filename;
  res.json({ selected: filename });
});

app.get("/selected", (req, res) => {
  res.json({ selected: currentSelected });
});

const PORT = process.env.REACT_APP_PORT;
app.listen(PORT, () => console.log(`Server running at ${globalAPI}`));
