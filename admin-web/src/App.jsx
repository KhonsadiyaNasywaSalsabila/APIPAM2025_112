// src/App.js
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";
import AddQuest from "./AddQuest";
import QuestDetail from "./QuestDetail";
import RewardManager from "./RewardManager";
import EditQuest from "./EditQuest";
import EditStage from "./EditStage"; // Pastikan sudah di-import

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Halaman Login (Default) */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Dashboard Utama */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Fitur Manajemen Quest */}
        <Route path="/add-quest" element={<AddQuest />} />
        <Route path="/edit-quest/:id" element={<EditQuest />} />
        <Route path="/quest/:id" element={<QuestDetail />} />

        {/* Fitur Manajemen Reward */}
        <Route path="/rewards/:id" element={<RewardManager />} />

        {/* 👇 ROUTE BARU: Edit Stage */}
        <Route path="/edit-stage/:id" element={<EditStage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;