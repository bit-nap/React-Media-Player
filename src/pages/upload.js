import { useEffect, useState } from "react";
import { Button } from "../components/button";
import { Card, CardContent } from "../components/card";
import { Input } from "../components/input";
import { useNavigate } from "react-router";

const globalURL = process.env.REACT_APP_SERVER_URL; // Change this to your server's URL if needed
export const STORAGE_KEY = "media-share-app";
export const API_BASE = globalURL + ":" + process.env.REACT_APP_PORT + "/api"; // Base URL for API requests

export function Upload() {
  const [userId, setUserId] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [newFile, setNewFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  let navigate = useNavigate();

  // Load user from local storage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.token && stored?.username) {
      setUserId(stored.token);
    }
  }, []);

  // Fetch media and current selection
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.token && stored?.username) {
      fetchFiles();
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
    } catch (error) {
      console.error("Delete error:", error.message);
      alert(`Failed to delete file: \n${error.message}`);
    }
  };

  // Media selection/settings screen
  return (
    <div className="flex flex-col p-6 min-h-screen w-full items-center">
      <div className="w-full flex flex-row gap-4">
        <Button
          onClick={() => {
            navigate(-1);
          }}
        >
          Back
        </Button>
        <h1 className="text-2xl font-bold">Manage Media</h1>
      </div>

      {/* Upload Section */}
      <div className="mb-6 my-4 max-w-5xl text-center">
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
