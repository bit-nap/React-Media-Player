import { useNavigate } from "react-router";
import { Button } from "../components/button";

export function Setting() {
  let navigate = useNavigate();

  return (
    <div className="flex flex-col p-6 min-h-screen w-full items-center">
      <div className="w-full flex flex-row gap-4">
        <Button
          onClick={() => {
            navigate("../controller");
          }}
        >
          Back
        </Button>
        <h1 className="text-2xl font-bold">User's Settings</h1>
      </div>
      <div className="w-2/3 h-full flex flex-col gap-4 my-4">
        <Button
          onClick={() => {
            navigate("upload");
          }}
        >
          Manage Files
        </Button>
        <Button
          onClick={() => {
            navigate("playlists");
          }}
        >
          Manage Playlists
        </Button>
      </div>
    </div>
  );
}
