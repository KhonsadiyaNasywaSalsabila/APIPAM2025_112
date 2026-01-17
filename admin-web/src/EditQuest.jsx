import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar";

export default function EditQuest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    highlights: "",
    category: "HISTORY",
    difficulty: "EASY",
    reward_xp: "100",
    start_location_name: "",
    finish_location_name: "",
    est_duration: "",
    total_dist: "",
    latitude: "",
    longitude: "",
  });

  // State untuk Thumbnail
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);

  // --- TAMBAHAN: State untuk Stamp ---
  const [stamp, setStamp] = useState(null);
  const [stampPreview, setStampPreview] = useState(null);

  // 1. AMBIL DATA LAMA
  useEffect(() => {
    fetchQuestData();
  }, [id]);

  const fetchQuestData = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/quests/${id}`);
      const data = res.data;

      setFormData({
        title: data.title,
        description: data.description,
        highlights: data.highlights || "",
        category: data.category,
        difficulty: data.difficulty,
        reward_xp: data.reward_xp || "100",
        start_location_name: data.start_location_name || "",
        finish_location_name: data.finish_location_name || "",
        est_duration: data.est_duration,
        total_dist: data.total_dist,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      // Set Pratinjau Gambar dari Server
      if (data.thumbnail_url) {
        setThumbPreview(`http://localhost:5000/uploads/${data.thumbnail_url}`);
      }
      if (data.stamp_url) {
        setStampPreview(`http://localhost:5000/uploads/${data.stamp_url}`);
      }
    } catch (err) {
      alert("Gagal mengambil data quest");
      navigate("/dashboard");
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    setThumbnail(file);
    if (file) setThumbPreview(URL.createObjectURL(file));
  };

  // --- TAMBAHAN: Handler Stamp ---
  const handleStampChange = (e) => {
    const file = e.target.files[0];
    setStamp(file);
    if (file) setStampPreview(URL.createObjectURL(file));
  };

  // 2. SIMPAN PERUBAHAN
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));

    // Append File jika ada perubahan
    if (thumbnail) data.append("thumbnail", thumbnail);
    if (stamp) data.append("stamp", stamp);

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Login expired!");
      return navigate("/");
    }

    try {
      await axios.put(`http://localhost:5000/api/admin/quests/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      alert("✨ Quest Berhasil Diupdate!");
      navigate("/dashboard");
    } catch (error) {
      alert("Gagal update: " + error.response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="main-content" style={{ maxWidth: "900px", margin: "100px auto 50px", padding: "0 20px" }}>
        
        <div style={{ marginBottom: "30px" }}>
          <button onClick={() => navigate("/dashboard")} className="btn-outline" style={{ marginBottom: "15px" }}>
            &larr; Batal
          </button>
          <h1 style={{ margin: 0 }}>✏️ Edit Quest</h1>
          <p style={{ color: "#64748b" }}>Perbarui informasi misi #{id}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "25px", alignItems: "start" }}>
            
            {/* KOLOM KIRI: DATA TEKNIS */}
            <div className="card" style={{ borderTop: "5px solid #f59e0b" }}>
              <h3 style={{ color: "#f59e0b", marginTop: 0, marginBottom: "20px" }}>ℹ️ Detail Misi</h3>
              
              <div style={{ marginBottom: "20px" }}>
                <label>Judul Quest</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required style={{ fontSize: "1.1rem" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "20px" }}>
                <div>
                  <label>Kategori</label>
                  <select name="category" value={formData.category} onChange={handleChange}>
                    <option value="HISTORY">📜 Sejarah</option>
                    <option value="CULINARY">🍜 Kuliner</option>
                    <option value="MYSTERY">👻 Misteri</option>
                  </select>
                </div>
                <div>
                  <label>Kesulitan</label>
                  <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
                    <option value="EASY">🟢 Mudah</option>
                    <option value="MEDIUM">🟡 Sedang</option>
                    <option value="HARD">🔴 Sulit</option>
                  </select>
                </div>
                <div>
                  <label>Hadiah XP</label>
                  <input type="number" name="reward_xp" value={formData.reward_xp} onChange={handleChange} />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label>Deskripsi</label>
                <textarea name="description" value={formData.description} onChange={handleChange} style={{ height: "100px" }} required />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div><label>📍 Start Loc</label><input type="text" name="start_location_name" value={formData.start_location_name} onChange={handleChange} /></div>
                <div><label>🏁 Finish Loc</label><input type="text" name="finish_location_name" value={formData.finish_location_name} onChange={handleChange} /></div>
              </div>
            </div>

            {/* KOLOM KANAN: MEDIA */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* EDIT THUMBNAIL */}
              <div className="card" style={{ textAlign: "center", borderTop: "5px solid #3b82f6" }}>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "10px" }}>🖼️ Ganti Thumbnail</label>
                <div style={{ border: "2px dashed #cbd5e1", padding: "10px", borderRadius: "10px" }}>
                  {thumbPreview && <img src={thumbPreview} alt="Thumb" style={{ width: "100%", borderRadius: "8px", marginBottom: "10px" }} />}
                  <input type="file" accept="image/*" onChange={handleThumbnailChange} style={{ fontSize: "0.8rem" }} />
                </div>
              </div>

              {/* --- TAMBAHAN: EDIT STAMP --- */}
              <div className="card" style={{ textAlign: "center", borderTop: "5px solid #F59E0B" }}>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "10px" }}>🎖️ Ganti Stempel</label>
                <div style={{ border: "2px dashed #F59E0B", padding: "15px", borderRadius: "50%", width: "100px", height: "100px", margin: "0 auto 15px", overflow: "hidden" }}>
                  {stampPreview ? (
                    <img src={stampPreview} alt="Stamp" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    "🏵️"
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleStampChange} style={{ fontSize: "0.8rem", width: "100%" }} />
                <small style={{ color: "#94a3b8", display: "block", marginTop: "5px" }}>*Biarkan jika tidak ingin diubah</small>
              </div>

              <button type="submit" className="btn-success" disabled={isLoading} style={{ padding: "15px", backgroundColor: "#f59e0b" }}>
                {isLoading ? "⏳ Menyimpan..." : "💾 Simpan Perubahan"}
              </button>
            </div>

          </div>
        </form>
      </div>
    </>
  );
}