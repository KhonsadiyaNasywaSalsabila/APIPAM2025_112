// src/EditStage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";

export default function EditStage() {
  const { id } = useParams(); // Ini adalah stage_id
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [questId, setQuestId] = useState(null); // Untuk tombol kembali

  // State Form
  const [form, setForm] = useState({
    stage_seq: 1,
    location_name: "",
    riddle_text: "",
    latitude: "",
    longitude: "",
    radius: 50,
    correct_answer: ""
  });

  // State Hints
  const [hints, setHints] = useState([]);

  // --- STYLES (Sama dengan QuestDetail agar konsisten) ---
  const styles = {
    container: {
      minHeight: "100vh", backgroundColor: "#f8fafc",
      backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)", backgroundSize: "20px 20px",
      fontFamily: "'Inter', sans-serif", paddingBottom: "50px"
    },
    wrapper: { maxWidth: "900px", margin: "0 auto", padding: "20px" },
    card: {
      backgroundColor: "white", borderRadius: "16px", padding: "30px",
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", borderTop: "5px solid #f59e0b", // Oranye untuk Edit
      marginTop: "20px"
    },
    label: { display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#475569", marginBottom: "8px" },
    input: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", marginBottom: "20px" },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
    btnSave: {
      width: "100%", padding: "14px", backgroundColor: "#f59e0b", color: "white",
      border: "none", borderRadius: "10px", fontSize: "1rem", fontWeight: "700", cursor: "pointer"
    }
  };

  useEffect(() => {
    fetchStageDetail();
  }, [id]);

  const fetchStageDetail = async () => {
    try {
      // Panggil API Backend (Pastikan route GET /api/admin/stages/:id sudah dibuat)
      const res = await axios.get(`http://localhost:5000/api/admin/stages/detail/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = res.data;
      setQuestId(data.quest_id); // Simpan ID Quest induk untuk navigasi balik

      setForm({
        stage_seq: data.stage_seq,
        location_name: data.location_name || "",
        riddle_text: data.riddle_text,
        latitude: data.latitude,
        longitude: data.longitude,
        radius: data.radius || 50,
        correct_answer: data.correct_answer || ""
      });

      // Jika ada hints dari backend, masukkan. Jika tidak, beri array kosong.
      // Catatan: Logic update hint di backend harus support ini.
      if (data.hints && data.hints.length > 0) {
          setHints(data.hints.map(h => ({ text: h.hint_text, cost: h.hint_cost })));
      } else {
          setHints([{ text: "", cost: 10 }]);
      }
      
      setLoading(false);
    } catch (err) {
      alert("Gagal memuat data stage: " + err.message);
      navigate("/dashboard");
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Logic Hint Sederhana (Untuk MVP, edit hint mungkin perlu endpoint khusus atau delete-insert)
  // Di sini kita hanya update state lokal, backend harus menangani array hints ini saat PUT.
  const handleHintChange = (index, field, value) => {
    const newHints = [...hints];
    newHints[index][field] = value;
    setHints(newHints);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        quest_id: questId, // Sertakan quest_id meski tidak diubah
        sequence: form.stage_seq,
        location_name: form.location_name,
        riddle_text: form.riddle_text,
        lat: form.latitude,
        lon: form.longitude,
        radius: form.radius,
        correct_answer: form.correct_answer,
        hints: hints // Kirim hints terbaru
      };

      // Panggil API PUT
      await axios.put(`http://localhost:5000/api/admin/stages/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Stage Berhasil Diupdate!");
      navigate(`/quest/${questId}`); // Kembali ke halaman QuestDetail
    } catch (err) {
      alert("❌ Gagal update: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div style={{textAlign:"center", padding:"50px"}}>Memuat data...</div>;

  return (
    <div style={styles.container}>
      <Navbar />
      <div style={styles.wrapper}>
        
        <button 
            onClick={() => navigate(`/quest/${questId}`)} 
            style={{ background: "none", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", color: "#64748b" }}
        >
            &larr; Batal & Kembali
        </button>

        <div style={styles.card}>
            <h2 style={{ margin: "0 0 20px 0", color: "#d97706" }}>✏️ Edit Stage</h2>
            
            <form onSubmit={handleSubmit}>
                <div style={styles.grid2}>
                    <div>
                        <label style={styles.label}>Urutan (Seq)</label>
                        <input style={styles.input} type="number" name="stage_seq" value={form.stage_seq} onChange={handleChange} />
                    </div>
                    <div>
                        <label style={styles.label}>Radius (meter)</label>
                        <input style={styles.input} type="number" name="radius" value={form.radius} onChange={handleChange} />
                    </div>
                </div>

                <label style={styles.label}>Nama Lokasi</label>
                <input style={styles.input} type="text" name="location_name" value={form.location_name} onChange={handleChange} required />

                <label style={styles.label}>Riddle Text</label>
                <textarea style={{ ...styles.input, height: "100px" }} name="riddle_text" value={form.riddle_text} onChange={handleChange} required />

                <label style={styles.label}>Kunci Jawaban (Opsional)</label>
                <input style={styles.input} type="text" name="correct_answer" value={form.correct_answer} onChange={handleChange} />

                <div style={styles.grid2}>
                    <div><label style={styles.label}>Latitude</label><input style={styles.input} type="number" step="any" name="latitude" value={form.latitude} onChange={handleChange} required /></div>
                    <div><label style={styles.label}>Longitude</label><input style={styles.input} type="number" step="any" name="longitude" value={form.longitude} onChange={handleChange} required /></div>
                </div>

                {/* EDIT HINTS SECTION */}
                <div style={{ backgroundColor: "#fffbeb", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "1px dashed #d97706" }}>
                    <label style={{...styles.label, color: "#b45309"}}>💡 Edit Hints</label>
                    {hints.map((hint, i) => (
                        <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                            <input style={{ ...styles.input, marginBottom: 0, flex: 1 }} value={hint.text} onChange={e => handleHintChange(i, "text", e.target.value)} />
                            <input style={{ ...styles.input, marginBottom: 0, width: "80px" }} type="number" value={hint.cost} onChange={e => handleHintChange(i, "cost", e.target.value)} />
                        </div>
                    ))}
                    <small style={{ color: "#b45309" }}>*Menambah/menghapus hint belum didukung di mode edit cepat ini. Silakan update teks/harga saja.</small>
                </div>

                <button type="submit" style={styles.btnSave}>Simpan Perubahan</button>
            </form>
        </div>
      </div>
    </div>
  );
}