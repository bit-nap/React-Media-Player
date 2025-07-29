import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Controller } from "./pages/controller";
import { Display } from "./pages/display";
import { Home } from "./pages/home";
import { Setting } from "./pages/setting";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/display" element={<Display />} />
        <Route path="/controller" element={<Controller />} />
        <Route path="/settings" element={<Setting />}></Route>
      </Routes>
    </BrowserRouter>
  );
}
