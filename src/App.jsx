import { Routes, Route } from "react-router-dom";
import ScrollBackground from "./components/ScrollBackground";
import SkipLink from "./components/SkipLink";
import HomePage from "./pages/HomePage";
import LkPage from "./pages/LkPage";
import CabinetPage from "./pages/CabinetPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <>
      <SkipLink />
      <ScrollBackground />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lk" element={<LkPage />} />
        <Route path="/cabinet" element={<CabinetPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </>
  );
}
