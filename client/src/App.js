import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Followers from "./pages/Followers";
import Following from "./pages/Following";

export default function App() {
  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Home /> : <Login />} />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/home" element={isLoggedIn ? <Home /> : <Navigate to="/login" replace />} />
        <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/login" replace />} />
        <Route path="/followers" element={isLoggedIn ? <Followers /> : <Navigate to="/login" replace />} />
        <Route path="/following" element={isLoggedIn ? <Following /> : <Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
