import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Controller } from "./pages/controller";
import { Display } from "./pages/display";
import { Home } from "./pages/home";
import { Setting } from "./pages/setting";
import { Upload } from "./pages/upload";
import { Playlists } from "./pages/playlists";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/display" element={<Display />} />
        <Route path="/controller" element={<Controller />} />
        <Route path="/controller/settings" element={<Setting />} />
        <Route path="/controller/settings/upload" element={<Upload />} />
        <Route path="/controller/settings/playlists" element={<Playlists />} />
      </Routes>
    </BrowserRouter>
  );
}
