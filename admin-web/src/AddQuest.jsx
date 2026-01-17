import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

export default function AddQuest() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // 1. State Data Form
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
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  // --- TAMBAHAN: State untuk Stamp ---
  const [stampImage, setStampImage] = useState(null);
  const [stampPreview, setStampPreview] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  // --- TAMBAHAN: Handler untuk Stamp ---
  const handleStampChange = (e) => {
    const file = e.target.files[0];
    setStampImage(file);
    if (file) {
      setStampPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!image) {
      alert("Harap upload gambar cover/thumbnail!");
      setIsLoading(false);
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });

    // Append thumbnail (Key 'thumbnail' sesuai backend)
    data.append("thumbnail", image);

    // --- TAMBAHAN: Append stamp (Key 'stamp' sesuai backend) ---
    if (stampImage) {
      data.append("stamp", stampImage);
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Sesi habis, silakan login ulang!");
      navigate("/");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/admin/quests", data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      alert("✨ Quest Berhasil Dibuat!");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Terjadi kesalahan server";
      alert("Gagal: " + msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div
        className="main-content"
        style={{ maxWidth: "800px", margin: "100px auto 50px", padding: "0 20px" }}
      >
        <div style={{ marginBottom: "30px" }}>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-outline"
            style={{ marginBottom: "15px", cursor: "pointer" }}
          >
            &larr; Batal & Kembali
          </button>
          <h1 style={{ margin: 0, fontSize: "2rem", color: "#1e293b" }}>Buat Quest Baru</h1>
          <p style={{ color: "#64748b", margin: "5px 0 0" }}>
            Isi detail misi di bawah ini untuk memulai petualangan baru.
          </p>
        </div>

        <div className="card" style={{ borderTop: "5px solid #10B981" }}>
          <form onSubmit={handleSubmit}>
            
            <h3 style={{ color: "#10B981", marginTop: 0, marginBottom: "20px" }}>
              ℹ️ Informasi Dasar
            </h3>

            <div style={{ marginBottom: "20px" }}>
              <label>Judul Quest</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Contoh: Menyingkap Misteri Candi Sewu"
                required
                style={{ fontSize: "1.1rem", padding: "12px" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <label>Kategori</label>
                <select name="category" value={formData.category} onChange={handleChange} style={{ height: "48px" }}>
                  <option value="HISTORY">📜 Sejarah</option>
                  <option value="CULINARY">🍜 Kuliner</option>
                  <option value="MYSTERY">👻 Misteri</option>
                  <option value="NATURE">🌳 Alam</option>
                </select>
              </div>
              <div>
                <label>Tingkat Kesulitan</label>
                <select name="difficulty" value={formData.difficulty} onChange={handleChange} style={{ height: "48px" }}>
                  <option value="EASY">🟢 Mudah</option>
                  <option value="MEDIUM">🟡 Sedang</option>
                  <option value="HARD">🔴 Sulit</option>
                </select>
              </div>
              <div>
                <label>Hadiah XP (Poin)</label>
                <input type="number" name="reward_xp" value={formData.reward_xp} onChange={handleChange} required style={{ height: "48px" }} />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label>Deskripsi Singkat</label>
              <textarea name="description" value={formData.description} onChange={handleChange} required style={{ height: "80px" }} />
            </div>

            <div style={{ marginBottom: "30px" }}>
              <label>✨ Highlights (Poin Menarik)</label>
              <textarea name="highlights" value={formData.highlights} onChange={handleChange} style={{ height: "80px", backgroundColor: "#f0f9ff", borderColor: "#bae6fd" }} />
            </div>

            <hr style={{ border: "0", borderTop: "1px solid #e2e8f0", margin: "30px 0" }} />

            <h3 style={{ color: "#10B981", marginBottom: "20px" }}>🗺️ Lokasi & Navigasi</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div><label>📍 Nama Lokasi Start</label><input type="text" name="start_location_name" value={formData.start_location_name} onChange={handleChange} /></div>
              <div><label>🏁 Nama Lokasi Finish</label><input type="text" name="finish_location_name" value={formData.finish_location_name} onChange={handleChange} /></div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div><label>⏱️ Durasi (Menit)</label><input type="number" name="est_duration" value={formData.est_duration} onChange={handleChange} required /></div>
              <div><label>📏 Jarak Total (KM)</label><input type="number" step="0.1" name="total_dist" value={formData.total_dist} onChange={handleChange} required /></div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
              <div><label>🌐 Latitude</label><input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} required /></div>
              <div><label>🌐 Longitude</label><input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} required /></div>
            </div>

            {/* --- BAGIAN 3: MEDIA (THUMBNAIL & STAMP) --- */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
              
              {/* Upload Thumbnail */}
              <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "12px", border: "2px dashed #cbd5e1", textAlign: "center" }}>
                <label style={{ fontSize: "0.9rem", marginBottom: "10px", display: "block", color: "#64748b", fontWeight: "600" }}>
                  📸 Upload Thumbnail
                </label>
                <input type="file" accept="image/*" onChange={handleFileChange} required style={{ fontSize: "0.8rem" }} />
                {preview && <img src={preview} alt="Preview" style={{ width: "100%", marginTop: "15px", borderRadius: "8px" }} />}
              </div>

              {/* --- TAMBAHAN: Upload Stamp --- */}
              <div style={{ backgroundColor: "#fffbeb", padding: "20px", borderRadius: "12px", border: "2px dashed #f59e0b", textAlign: "center" }}>
                <label style={{ fontSize: "0.9rem", marginBottom: "10px", display: "block", color: "#b45309", fontWeight: "600" }}>
                  🎖️ Upload Stamp (Paspor)
                </label>
                <input type="file" accept="image/*" onChange={handleStampChange} style={{ fontSize: "0.8rem" }} />
                <p style={{ fontSize: "0.7rem", color: "#b45309", marginTop: "5px" }}>*Jika kosong, akan mengikuti thumbnail</p>
                {stampPreview && (
                  <img src={stampPreview} alt="Stamp Preview" style={{ width: "80px", height: "80px", objectFit: "cover", marginTop: "15px", borderRadius: "50%", border: "3px solid #f59e0b" }} />
                )}
              </div>

            </div>

            <button
              type="submit"
              className="btn-success"
              disabled={isLoading}
              style={{
                width: "100%", fontSize: "1.1rem", padding: "16px", fontWeight: "600",
                backgroundColor: isLoading ? "#94a3b8" : "#10B981", cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? "⏳ Sedang Mengupload..." : "🚀 Terbitkan Quest"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}