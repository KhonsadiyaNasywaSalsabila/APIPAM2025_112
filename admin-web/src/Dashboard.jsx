import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

export default function Dashboard() {
  const navigate = useNavigate();
  const [quests, setQuests] = useState([]);
  const [adminName, setAdminName] = useState("");

  // --- 1. CEK OTENTIKASI SAAT LOAD ---
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      // Jika tidak ada data login
      if (!token || !userStr) {
        alert("Sesi habis. Silakan login kembali.");
        navigate("/");
        return;
      }

      const user = JSON.parse(userStr);

      // Jika Role BUKAN Admin
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        alert("⛔ Akses Ditolak! Halaman ini khusus Administrator.");
        localStorage.clear();
        navigate("/");
        return;
      }

      setAdminName(user.full_name);
      fetchQuests(token);
    };

    checkAuth();
  }, [navigate]);

  // --- 2. AMBIL DATA QUEST (CRUD ADMIN) ---
  const fetchQuests = async (token) => {
    try {
      const authToken = token || localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/admin/quests", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setQuests(res.data);
    } catch (err) {
      console.error("Gagal ambil data quest:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert("Sesi tidak valid. Harap login ulang.");
        localStorage.clear(); // Bersihkan sesi
        navigate("/");
      }
    }
  };

  // --- 3. FUNGSI HAPUS QUEST ---
  const handleDelete = async (id, title) => {
    if (
      confirm(
        `⚠️ PERINGATAN KERAS!\n\nYakin ingin menghapus Quest: "${title}"?\nSemua Stage, Hint, dan Hadiah di dalamnya akan ikut TERHAPUS PERMANEN.`
      )
    ) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:5000/api/admin/quests/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        alert("Quest berhasil dihapus.");
        fetchQuests(token);
      } catch (err) {
        alert("Gagal menghapus: " + (err.response?.data?.message || err.message));
      }
    }
  };

  // Helper untuk warna badge kategori
  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'HISTORY': return 'badge-history'; // Kuning
      case 'MYSTERY': return 'badge-mystery'; // Ungu
      case 'NATURE': return 'badge-nature';   // Hijau (Tambah CSS class ini di index.css jika belum ada)
      case 'CULINARY': return 'badge-culinary'; // Merah Muda
      default: return 'badge-primary'; // Biru Default
    }
  };

  return (
    <>
      <Navbar />

      <div
        className="main-content"
        style={{
          maxWidth: "1200px",
          margin: "100px auto 50px",
          padding: "0 20px",
        }}
      >
        {/* === HEADER SECTION === */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "40px",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "2rem", color: "#1e293b" }}>
              Dashboard Misi
            </h2>
            <p style={{ margin: "5px 0 0", color: "#64748b" }}>
              Halo, <b>{adminName}</b>! Kelola konten petualangan Nusantara Quest di sini.
            </p>
          </div>
          <button
            onClick={() => navigate("/add-quest")}
            className="btn-success"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              fontSize: "1rem",
              boxShadow: "0 4px 6px rgba(16, 185, 129, 0.2)",
            }}
          >
            <span>+</span> Buat Quest Baru
          </button>
        </div>

        {/* === CONTENT SECTION === */}
        {quests.length === 0 ? (
          // Tampilan jika Kosong
          <div
            className="card"
            style={{
              textAlign: "center",
              padding: "60px",
              border: "2px dashed #cbd5e1",
              background: "transparent",
            }}
          >
            <h3 style={{ color: "#94a3b8" }}>Belum ada Misi 😢</h3>
            <p style={{ color: "#94a3b8" }}>
              Yuk mulai buat misi pertamamu sekarang!
            </p>
          </div>
        ) : (
          // Grid Layout Card
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "25px",
            }}
          >
            {quests.map((quest) => (
              <div
                key={quest.quest_id}
                className="card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s",
                  border: "1px solid #e2e8f0",
                }}
              >
                {/* --- GAMBAR THUMBNAIL & OVERLAY --- */}
                <div
                  style={{
                    height: "180px",
                    backgroundColor: "#e2e8f0",
                    backgroundImage: `url(http://localhost:5000/uploads/${quest.thumbnail_url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    position: "relative",
                  }}
                >
                  {/* Badge Kategori & XP (Kanan Atas) */}
                  <div
                    style={{
                      position: "absolute",
                      top: "15px",
                      right: "15px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "5px",
                    }}
                  >
                    <span className={`badge ${getCategoryColor(quest.category)}`}>
                      {quest.category}
                    </span>
                    {/* Badge XP Baru */}
                    <span
                      className="badge"
                      style={{
                        backgroundColor: "#F59E0B", // Warna Amber/Emas
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      ⭐ {quest.reward_xp || 100} XP
                    </span>
                  </div>

                  {/* Tombol Aksi Cepat (Kiri Atas) */}
                  <div
                    style={{
                      position: "absolute",
                      top: "15px",
                      left: "15px",
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    {/* EDIT (Kuning) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/edit-quest/${quest.quest_id}`);
                      }}
                      style={{
                        background: "rgba(245, 158, 11, 0.9)",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "35px",
                        height: "35px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backdropFilter: "blur(4px)",
                      }}
                      title="Edit Informasi Quest"
                    >
                      ✏️
                    </button>

                    {/* HAPUS (Merah) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(quest.quest_id, quest.title);
                      }}
                      style={{
                        background: "rgba(239, 68, 68, 0.9)",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "35px",
                        height: "35px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backdropFilter: "blur(4px)",
                      }}
                      title="Hapus Quest Permanen"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* --- KONTEN CARD --- */}
                <div
                  style={{
                    padding: "25px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "1.25rem",
                      lineHeight: "1.4",
                      color: "#1e293b",
                    }}
                  >
                    {quest.title}
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      gap: "15px",
                      fontSize: "0.85rem",
                      color: "#64748b",
                      marginBottom: "20px",
                    }}
                  >
                    <span title="Estimasi Waktu">⏱️ {quest.est_duration} Min</span>
                    <span title="Total Jarak">📍 {quest.total_dist} KM</span>
                    <span title="Tingkat Kesulitan">🔥 {quest.difficulty}</span>
                  </div>

                  {/* Tombol Navigasi Bawah */}
                  <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                    {/* Tombol STAGE (Biru) */}
                    <button
                      onClick={() => navigate(`/quest/${quest.quest_id}`)}
                      className="btn-primary"
                      style={{
                        flex: 1,
                        padding: "10px",
                        fontSize: "0.9rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "5px",
                      }}
                    >
                      ⚙️ Atur Stage
                    </button>

                    {/* Tombol HADIAH (Ungu) */}
                    <button
                      onClick={() => navigate(`/rewards/${quest.quest_id}`)}
                      className="btn-primary"
                      style={{
                        flex: 1,
                        padding: "10px",
                        fontSize: "0.9rem",
                        backgroundColor: "#8b5cf6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "5px",
                      }}
                    >
                      🎁 Hadiah
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}