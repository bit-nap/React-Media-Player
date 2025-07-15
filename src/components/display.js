import { useEffect, useState } from "react";
import { API_BASE } from "./controller"; // Import the global API URL

const mediaFolder = API_BASE + "/uploads/";

export function Display() {
  const [media, setMedia] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSelected = () => {
      fetch(API_BASE + "/selected")
        .then((res) => res.json())
        .then((data) => {
          if (isMounted) setMedia(data.selected);
        });
    };

    fetchSelected();
    const interval = setInterval(fetchSelected, 500); // Poll (1000 = 1 sec)

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (
    media?.endsWith(".jpg") ||
    media?.endsWith(".png") ||
    media?.endsWith(".gif")
  ) {
    return (
      <div className="h-svh max-w-full flex items-center justify-center">
        <img
          src={mediaFolder + encodeURIComponent(media)}
          class="h-full max-w-full content-center inline-flex"
          alt="Unable to load"
        />
      </div>
    );
  } else if (media?.endsWith(".mp4")) {
    return (
      <div className="h-svh max-w-full flex items-center justify-center">
        <video
          src={mediaFolder + encodeURIComponent(media)}
          controls
          autoPlay
          class="w-full"
          alt="Unable to load"
        />
      </div>
    );
  } else {
    return (
      <div className="h-svh max-w-full flex items-center justify-center">
        <h1 className="text-2xl font-bold text-center">No file selected</h1>
      </div>
    );
  }
}
