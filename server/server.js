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
  "/api/uploads",
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
app.post("/api/login", loginHandler);

app.post("/api/refresh", refreshHandler);

const upload = multer({ storage });

app.post("/api/upload", authMiddleware, upload.single("media"), (req, res) => {
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

app.get("/api/files", authMiddleware, (req, res) => {
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(files);
  });
});

app.delete("/api/delete/:name", authMiddleware, (req, res) => {
  const filename = req.params.name;
  const filePath = path.join(UPLOAD_DIR, filename);

  try {
    const files = fs.readdirSync(SETTINGS_DIR);

    files.forEach((file) => {
      const filePath = path.join(SETTINGS_DIR, file);

      // Only process .json files
      if (path.extname(filePath) !== ".json") return;
      const data = fs.readFileSync(filePath, "utf-8");
      let json;
      try {
        json = JSON.parse(data);
      } catch (err) {
        console.error(`Invalid JSON in file ${file}:`, err);
        return;
      }

      let modified = false;
      if (Array.isArray(json.playlists)) {
        json.playlists.forEach((playlist) => {
          if (Array.isArray(playlist.songs)) {
            const originalLength = playlist.songs.length;
            playlist.songs = playlist.songs.filter((song) => song !== filename);
            if (playlist.songs.length !== originalLength) {
              modified = true;
            }
          }
        });
      }

      if (modified) {
        fs.writeFileSync(filePath, JSON.stringify(json, null, 2), "utf-8");
      }
    });
  } catch (err) {
    console.error("Error processing files:", err);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete file from existing playlists",
    });
  }

  // Remove file from FS
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
    res.json({
      success: true,
      message: `Deleted "${filename}" from all playlists.`,
    });
  });
});

// Directory to store user settings
const SETTINGS_DIR = path.join(__dirname, "../public/settings");
if (!fs.existsSync(SETTINGS_DIR))
  fs.mkdirSync(SETTINGS_DIR, { recursive: true });

// Save user settings (playlists) as JSON file named after the account
app.post("/api/settings", authMiddleware, (req, res) => {
  const { account, playlists } = req.body;
  if (!account || !playlists) {
    return res
      .status(400)
      .json({ error: "Missing account or playlists in request body." });
  }
  const settingsPath = path.join(SETTINGS_DIR, `${account}.json`);
  fs.writeFile(settingsPath, JSON.stringify({ playlists }, null, 2), (err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to save settings." });
    }
    res.json({ success: true });
  });
});

// Get user settings (playlists) from JSON file
app.get("/api/settings/:account", authMiddleware, (req, res) => {
  const account = req.params.account;
  const settingsPath = path.join(SETTINGS_DIR, `${account}.json`);
  fs.readFile(settingsPath, "utf8", (err, data) => {
    if (err) {
      return res
        .status(404)
        .json({ error: "Settings not found for this account." });
    }
    try {
      const settings = JSON.parse(data);
      res.json(settings);
    } catch (parseErr) {
      res.status(500).json({ error: "Failed to parse settings file." });
    }
  });
});

let currentSelected = null;

app.post("/api/deselect", authMiddleware, (req, res) => {
  currentSelected = null;
  res.json({ selected: null });
});

app.post("/api/select", authMiddleware, (req, res) => {
  const { filename } = req.body;
  currentSelected = filename;
  res.json({ selected: filename });
});

app.get("/api/selected", (req, res) => {
  res.json({ selected: currentSelected });
});

const PORT = process.env.REACT_APP_PORT;
app.listen(PORT, () => console.log(`Server running at ${globalAPI}`));
