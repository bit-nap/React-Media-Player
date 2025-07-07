import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Controller } from "./components/controller";
import { Display } from "./components/display";
import { Home } from "./components/home";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/display" element={<Display />} />
        <Route path="/controller" element={<Controller />} />
      </Routes>
    </BrowserRouter>
  );
}
