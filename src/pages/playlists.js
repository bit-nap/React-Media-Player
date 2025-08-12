import { useState, useEffect } from "react";
import { API_BASE, STORAGE_KEY } from "./controller";
import { useNavigate } from "react-router";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { Card, CardContent } from "../components/card";

export function Playlists() {
  const [files, setFiles] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [newName, setName] = useState("");
  // Track selected song for each playlist
  const [selectedSongs, setSelectedSongs] = useState({});

  let navigate = useNavigate();

  // Fetch media and playlists
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    // Fetch uploaded files
    const fetchFiles = async () => {
      try {
        if (!stored.token) return;
        const res = await fetch(`${API_BASE}/files`, {
          headers: stored.token
            ? { Authorization: `Bearer ${stored.token}` }
            : {},
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            "Unable to get filenames. Session has expired. Please log in again"
          );
        }
        setFiles(data);
      } catch (error) {
        alert(
          error.message ||
            "Credentials invalid. Please log out and log in again"
        );
      }
    };

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
      fetchFiles();
      fetchPlaylists();
    }
  }, []);

  // Fetch account playlist
  const uploadPlaylist = async () => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    try {
      if (!stored.token || !stored.username)
        throw new Error(
          "Unable to get Settings. Session has expired. Please log in again"
        );
      const res = await fetch(`${API_BASE}/settings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stored.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account: stored.username.trim(),
          playlists: playlists,
        }),
      });
      if (!res.ok) {
        console.error("Upload playlists failed");
      } else {
        alert("Changes saved");
      }
    } catch (error) {
      alert(
        error.message || "Credentials invalid. Please log out and log in again"
      );
    }
  };

  // Add a playlist
  const createPlaylist = () => {
    if (!newName) {
      alert("Select a name for the playlist");
      return;
    }
    let newList = { name: newName, songs: [] };
    if (playlists && playlists.length > 0) {
      const playlistExists = playlists.some(
        (playlist) => playlist.name === newName
      );
      if (playlistExists) {
        alert("There already exists a playlist with the selected name");
        return;
      }
      setPlaylists((prevList) => [...prevList, newList]);
    } else {
      setPlaylists([newList]);
    }
    console.log(playlists);
  };

  // Add a song to a playlist
  const addSongToPlaylist = (playlistName) => {
    const songName = selectedSongs[playlistName];
    if (!songName) {
      alert("Please select a song to add.");
      return;
    }
    const updatedList = playlists.map((playlist) =>
      playlist.name === playlistName && !playlist.songs.includes(songName)
        ? { ...playlist, songs: [...playlist.songs, songName] }
        : playlist
    );
    setPlaylists(updatedList);
  };

  // Remove a song from a playlist
  const removeSong = (playlistName, songName) => {
    const updatedList = playlists.map((playlist) =>
      playlist.name === playlistName
        ? {
            ...playlist,
            songs: playlist.songs.filter((song) => song !== songName),
          }
        : playlist
    );
    setPlaylists(updatedList);
  };

  // Remove a playlist from the list of playlists
  const removePlaylist = (playlistName) => {
    const updatedList = playlists.filter(
      (playlist) => playlist.name !== playlistName
    );
    setPlaylists(updatedList);
  };

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
        <h1 className="text-2xl font-bold">Manage Playlists</h1>
      </div>

      <div className="w-full flex flex-row justify-between max-w-4xl my-4">
        <h2 className="text-xl font-bold">Playlists</h2>
        <div className="flex flex-row">
          <Input
            placeholder="New playlist name"
            value={newName}
            onChange={(e) => setName(e.target.value)}
          />
          <Button onClick={createPlaylist}>Add</Button>
        </div>
        <Button onClick={uploadPlaylist}>Save changes</Button>
      </div>

      <div className="w-full max-w-4xl space-y-4 mt-4">
        {playlists.map(({ name, songs }, idx) => (
          <Card key={idx} className="border border-gray-500">
            <CardContent className="mt-0 divide-y-2">
              <h3 className="font-semibold">{name}</h3>
              {songs.map((songName, i) => (
                <div
                  key={idx + ":" + i}
                  className="flex flex-row gap-2 items-center"
                >
                  {songName}
                  <Button
                    className="bg-red-600 hover:bg-red-700 px-1 py-0"
                    onClick={() => removeSong(name, songName)}
                  >
                    X
                  </Button>
                </div>
              ))}
              <div className="flex flex-row gap-2 items-center w-full justify-between">
                <select
                  className="border rounded px-2 py-1"
                  value={selectedSongs[name] || ""}
                  onChange={(e) =>
                    setSelectedSongs((prev) => ({
                      ...prev,
                      [name]: e.target.value,
                    }))
                  }
                >
                  <option value="">Select song</option>
                  {files.map((file, i) => (
                    <option
                      key={i}
                      value={file}
                      disabled={songs.includes(file)}
                    >
                      {file}
                    </option>
                  ))}
                </select>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => addSongToPlaylist(name)}
                >
                  Add Media
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => removePlaylist(name)}
                >
                  Remove Playlist
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
