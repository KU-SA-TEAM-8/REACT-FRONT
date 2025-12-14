import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ScoreboardProvider } from "./contexts/ScoreboardContext";
import ScoreboardListPage from "./pages/ScoreboardListPage";
import LoginPage from "./pages/LoginPage";
import AdminHomePage from "./pages/AdminHomePage";
import ScoreManagementPage from "./pages/ScoreManagementPage";
import ScoreboardSettingsPage, { PAGE_TYPE } from "./pages/ScoreboardSettingsPage";
import ScoreboardDetailPage from "./pages/ScoreboardDetailPage";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <ScoreboardProvider>
        <BrowserRouter basename="/REACT-FRONT">
          <Routes>
            <Route path="/" element={<ScoreboardListPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminHomePage />} />
            <Route path="/admin/score/:adminId" element={<ScoreManagementPage />} />
            <Route path="/admin/settings/:id" element={<ScoreboardSettingsPage />} />
            <Route path="/scoreboard/:id" element={<ScoreboardDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ScoreboardProvider>
    </AuthProvider>
  );
}

export default App;
