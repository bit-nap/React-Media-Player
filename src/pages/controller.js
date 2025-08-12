import { useEffect, useState } from "react";
import { Button } from "../components/button";
import { Card, CardContent } from "../components/card";
import { Input } from "../components/input";
import { useNavigate } from "react-router";

const globalURL = process.env.REACT_APP_SERVER_URL; // Change this to your server's URL if needed
export const STORAGE_KEY = "media-share-app";
export const API_BASE = globalURL + ":" + process.env.REACT_APP_PORT + "/api"; // Base URL for API requests

export function Controller() {
  const [passwordToggle, setPasswordToggle] = useState("password");
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [inputUsername, setInputUsername] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [playlists, setPlaylists] = useState([]);

  let navigate = useNavigate();

  // Load user from local storage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.token && stored?.username) {
      setUserId(stored.token);
      setUsername(stored.username);
      fetchSelected();
    }
  }, []);

  // Fetch media and playlists
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    // Fetch account playlists
    const fetchPlaylists = async () => {
      try {
        if (!stored.token || !stored.username) return;
        const res = await fetch(`${API_BASE}/settings/${stored.username}`, {
          headers: stored.token
            ? { Authorization: `Bearer ${stored.token}` }
            : {},
        });
        const data = await res.json();
        if (res.status === 404) {
          const res = await fetch(`${API_BASE}/settings`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${stored.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              account: stored.username.trim(),
              playlists: [],
            }),
          });
          if (!res.ok) {
            console.error("Upload playlists failed");
          }

          return;
        }
        if (!res.ok) {
          console.error("Failed to fetch playlists");
          return;
        }
        setPlaylists(data.playlists);
      } catch (error) {
        alert(
          error.message ||
            "Credentials invalid. Please log out and log in again"
        );
      }
    };

    if (stored?.token && stored?.username) {
      fetchPlaylists();
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
  }, []);

  // Calculate expiration of token
  function getTokenExpiry(token) {
    if (!token) return 0;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000; // ms
  }

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
    setSelectedFile(null);
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
        <div className="flex flex-row w-2/12 justify-center mt-1">
          <Input
            type="checkbox"
            className="shrink-0 w-4 border-gray-200 rounded-sm text-blue-600 focus:ring-blue-500"
            value={passwordToggle}
            onChange={(e) => handlePasswordToggle(e.target.value)}
          />
          <label className="text-sm text-gray-500 ms-3">Show password</label>
        </div>
        <Button onClick={handleLogin}>Continue</Button>
      </div>
    );
  }
  console.log(playlists);

  // Media selection/settings screen
  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Welcome, {username}</h1>
        <div className="flex flex-row gap-2">
          <Button
            className={`bg-blue-500 hover:bg-blue-600`}
            onClick={() => navigate("settings")}
          >
            Settings
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={handleLogout}
          >
            Log Out
          </Button>
        </div>
      </div>

      {/* Media List */}
      <h2 className="text-xl font-semibold mb-2">Media</h2>
      <div className="grid grid-cols-1">
        {playlists.map(({ name, songs }, idx) => (
          <>
            <h3 className="font-semibold w-fit mt-2">{name}</h3>
            <Card key={idx} className="border border-gray-500 px-4 py-2">
              <CardContent className="mt-0 divide-y-2">
                {songs.map((songName, i) => (
                  <div className="flex flex-row justify-between py-2">
                    <p className="font-semibold text-center overflow-hidden">
                      {songName}
                    </p>

                    <Button
                      className={`w-1/3 ${
                        selectedFile === songName
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                      onClick={() => handleSelect(songName)}
                    >
                      {selectedFile === songName
                        ? "Selected"
                        : "Select to Display"}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        ))}
      </div>
    </div>
  );
}
