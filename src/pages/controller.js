import { useEffect, useState } from "react";
import { Button } from "../components/button";
import { Card, CardContent } from "../components/card";
import { Input } from "../components/input";

const globalURL = process.env.REACT_APP_SERVER_URL; // Change this to your server's URL if needed
const STORAGE_KEY = "media-share-app";
export const API_BASE = globalURL + ":" + process.env.REACT_APP_PORT + "/api"; // Base URL for API requests

export function Controller() {
  const [passwordToggle, setPasswordToggle] = useState("password");
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [inputUsername, setInputUsername] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [hiddenFiles, setHiddenFiles] = useState([]);
  const [newFile, setNewFile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [settingsMode, setSettingsMode] = useState(false); // Toggle for settings mode

  // Load user from local storage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.token && stored?.username) {
      setUserId(stored.token);
      setUsername(stored.username);
    }
  }, []);

  // Fetch media and current selection
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.token && stored?.username) {
      fetchFiles();
      fetchSelected();
    }
  }, []);

  // Refresh token if close to expiration
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const token = stored?.token;
    if (token) {
      const expiry = getTokenExpiry(token);
      const now = Date.now();
      if (expiry - now < 10 * 60 * 1000) {
        // () sec/min ms/sec
        // less than 10 min left
        fetch(`${API_BASE}/refresh`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.token) {
              localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                  ...stored,
                  token: data.token,
                })
              );
              setUserId(data.token);
            }
          });
      }
    }
  }, [userId]);

  // Calculate expiration of token
  function getTokenExpiry(token) {
    if (!token) return 0;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000; // ms
  }

  // Fetch uploaded files
  const fetchFiles = async () => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const token = stored?.token;
      const res = await fetch(`${API_BASE}/files`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          "Unable to get filenames. Session has expired. Please log in again"
        );
      }

      // Convert raw filenames into objects with display data
      const formatted = data.map((filename) => ({
        name: filename,
        url: `${API_BASE}/uploads/${filename}`,
      }));
      setMediaFiles(formatted);
    } catch (error) {
      alert(
        error.message || "Credentials invalid. Please log out and log in again"
      );
    }
  };

  // Fetch current selected media
  const fetchSelected = async () => {
    try {
      const res = await fetch(`${API_BASE}/selected`);
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      setSelectedFile(data.selected);
    } catch (error) {
      // console.error("Fetch error:", error);
    }
  };

  // Hide/show file
  const handleHideFile = (filename) => {
    setHiddenFiles((prev) =>
      prev.includes(filename)
        ? prev.filter((f) => f !== filename)
        : [...prev, filename]
    );
  };

  // UI password hide/show
  const handlePasswordToggle = () => {
    if (passwordToggle === "password") {
      setPasswordToggle("");
    } else {
      setPasswordToggle("password");
    }
  };

  // Log in and save info
  const handleLogin = async () => {
    if (!inputUsername.trim() || !inputPassword.trim()) return;
    try {
      console.log(API_BASE);
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: inputUsername.trim(),
          password: inputPassword.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Login failed");
        return;
      }
      console.log(data);
      // Store token and username in localStorage
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          token: data.token,
          username: data.username,
        })
      );
      setUserId(data.token);
      setUsername(data.username);
      fetchFiles();
      fetchSelected();
    } catch (error) {
      alert("Login error: " + error.message);
    }
  };

  // Log out and clear local storage
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUserId("");
    setUsername("");
    setMediaFiles([]);
    setSelectedFile(null);
  };

  // Send file to API
  const handleUpload = async () => {
    if (!newFile) return;
    // eslint-disable-next-line
    const specialCharsRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,<>\/?~]/;
    if (specialCharsRegex.test(newFile.name)) {
      console.log(newFile);
      window.confirm(
        `File name invalid. Please remove any spaces or special characters from the file: '${newFile.name}'.`
      );
      return;
    }
    const formData = new FormData();
    formData.append("media", newFile);

    try {
      setUploading(true);
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const token = stored?.token;
      await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      setNewFile(null);
      await fetchFiles();
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  // Select file to display
  const handleSelect = async (filename) => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const token = stored?.token;
    try {
      if (selectedFile === filename) {
        await fetch(`${API_BASE}/deselect`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setSelectedFile("");
      } else {
        await fetch(`${API_BASE}/select`, {
          method: "POST",
          headers: token
            ? {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              }
            : {
                "Content-Type": "application/json",
              },
          body: JSON.stringify({ filename }),
        });
        setSelectedFile(filename);
      }
    } catch (error) {
      console.error("Select error:", error);
    }
  };

  // Delete file from API
  const handleDelete = async (filename) => {
    if (!filename) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${filename}"?`
    );
    if (!confirmDelete) return;

    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const token = stored?.token;
      const res = await fetch(`${API_BASE}/delete/${filename}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Delete failed: \n${errorText}`);
      }

      // Refresh state
      await fetchFiles();
      await fetchSelected();
    } catch (error) {
      console.error("Delete error:", error.message);
      alert(`Failed to delete file: \n${error.message}`);
    }
  };

  // Login screen
  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 p-6">
        <h1 className="text-2xl font-bold">Login / Create Account</h1>
        <Input
          placeholder="Enter a username"
          value={inputUsername}
          onChange={(e) => setInputUsername(e.target.value)}
        />
        <Input
          type={passwordToggle}
          placeholder="Enter a password"
          value={inputPassword}
          onChange={(e) => setInputPassword(e.target.value)}
        />
        <div className="flex flex-row w-1/6 mt-1">
          <Input
            type="checkbox"
            className="shrink-0 w-1/6 border-gray-200 rounded-sm text-blue-600 focus:ring-blue-500"
            value={passwordToggle}
            onChange={(e) => handlePasswordToggle(e.target.value)}
          />
          <label className="text-sm text-gray-500 ms-3">Show password</label>
        </div>
        <Button onClick={handleLogin}>Continue</Button>
      </div>
    );
  }

  // Media selection/settings screen
  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Welcome, {username}</h1>
        <div className="flex flex-row gap-2">
          <Button
            className={`bg-blue-500 hover:bg-blue-600`}
            onClick={() => setSettingsMode((prev) => !prev)}
          >
            {settingsMode ? "Done" : "Settings"}
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={handleLogout}
          >
            Log Out
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="mb-6">
        <Input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setNewFile(e.target.files[0])}
          className="flex flex-row break-all px-3 py-2 border border-gray-300 rounded w-full"
        />
        <Button
          className="mt-2 mx-4"
          onClick={handleUpload}
          disabled={!newFile || uploading}
        >
          {uploading ? "Uploading..." : "Upload Media"}
        </Button>
      </div>

      {/* Media List */}
      <h2 className="text-xl font-semibold mb-2">Uploaded Files</h2>
      <div className="grid grid-cols-1 gap-4">
        {mediaFiles.map((file, idx) => (
          <Card key={idx}>
            <CardContent className="space-y-2">
              <div className="flex flex-row justify-between py-2">
                <p className="font-semibold text-center overflow-hidden">
                  {file.name}
                </p>
                <div className="flex flex-row">
                  <Button
                    className="bg-red-600 hover:bg-red-700 mx-2"
                    onClick={() => handleDelete(file.name)}
                  >
                    X
                  </Button>
                </div>
              </div>
              {settingsMode ? (
                <Button
                  className={`w-full ${
                    hiddenFiles.includes(file.name)
                      ? "bg-gray-400 hover:bg-gray-500"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  }`}
                  onClick={() => handleHideFile(file.name)}
                >
                  {hiddenFiles.includes(file.name) ? "Show" : "Hide"}
                </Button>
              ) : (
                <Button
                  className={`w-full ${
                    selectedFile === file.name
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  onClick={() => handleSelect(file.name)}
                >
                  {selectedFile === file.name
                    ? "Selected"
                    : "Select to Display"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
