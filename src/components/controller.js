import { useEffect, useState } from "react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Input } from "./input";
import { v4 as uuidv4 } from "uuid";

const globalURL = process.env.REACT_APP_SERVER_URL; // Change this to your server's URL if needed
const STORAGE_KEY = "media-share-app";
export const API_BASE = globalURL + ":" + process.env.REACT_APP_PORT; // Base URL for API requests

export function Controller() {
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [inputUsername, setInputUsername] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [newFile, setNewFile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Load user from local storage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.userId && stored?.username) {
      setUserId(stored.userId);
      setUsername(stored.username);
    }
  }, []);

  // Fetch media and current selection
  useEffect(() => {
    fetchFiles();
    fetchSelected();
  }, []);

  // Fetch uploaded files
  const fetchFiles = async () => {
    const res = await fetch(`${API_BASE}/files`);
    const data = await res.json();

    // Convert raw filenames into objects with display data
    const formatted = data.map((filename) => ({
      name: filename,
      url: `${API_BASE}/uploads/${filename}`,
    }));
    setMediaFiles(formatted);
  };

  // Fetch current selected media
  const fetchSelected = async () => {
    const res = await fetch(`${API_BASE}/selected`);
    const data = await res.json();
    setSelectedFile(data.selected);
  };

  const handleLogin = () => {
    if (!inputUsername.trim() || !inputPassword.trim()) return;
    const newUserId = uuidv4();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        userId: newUserId,
        username: inputUsername.trim(),
      })
    );
    if (inputUsername.trim() && inputPassword.trim()) {
      setUserId(newUserId);
      setUsername(inputUsername.trim());
    }
    try {
      fetchFiles();
      fetchSelected();
    } catch (error) {
      console.log("login error:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUserId("");
    setUsername("");
    setMediaFiles([]);
    setSelectedFile(null);
  };

  const handleUpload = async () => {
    if (!newFile) return;
    // eslint-disable-next-line
    const specialCharsRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    if (specialCharsRegex.test(newFile.name)) {
      console.log(newFile);
      window.confirm(
        `File name invalid. Please remove any special characters from the file: "${newFile.name}"?`
      );
      return;
    }
    const formData = new FormData();
    formData.append("media", newFile);

    try {
      setUploading(true);
      await fetch(`${API_BASE}/upload`, {
        method: "POST",
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

  const handleSelect = async (filename) => {
    try {
      if (selectedFile === filename) {
        await fetch(`${API_BASE}/deselect`, {
          method: "POST",
        });
        setSelectedFile("");
      } else {
        await fetch(`${API_BASE}/select`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename }),
        });
        setSelectedFile(filename);
      }
    } catch (error) {
      console.error("Select error:", error);
    }
  };

  const handleDelete = async (filename) => {
    if (!filename) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${filename}"?`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_BASE}/delete/${filename}`, {
        method: "DELETE",
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
          placeholder="Enter a password"
          value={inputPassword}
          onChange={(e) => setInputPassword(e.target.value)}
        />
        <Button onClick={handleLogin}>Continue</Button>
      </div>
    );
  }

  // Media selection screen
  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Welcome, {username}</h1>
        <Button className="bg-red-600 hover:bg-red-700" onClick={handleLogout}>
          Log Out
        </Button>
      </div>

      {/* Upload Section */}
      <div className="mb-6">
        <Input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setNewFile(e.target.files[0])}
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
              <div class="flex flex-row justify-between py-2">
                <p className="font-semibold text-center break-all">
                  {file.name}
                </p>
                <Button
                  className="bg-red-600 hover:bg-red-700 mx-4"
                  onClick={() => handleDelete(file.name)}
                >
                  X
                </Button>
              </div>
              <Button
                className={`w-full ${
                  selectedFile === file.name
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                onClick={() => handleSelect(file.name)}
              >
                {selectedFile === file.name ? "Selected" : "Select to Display"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
