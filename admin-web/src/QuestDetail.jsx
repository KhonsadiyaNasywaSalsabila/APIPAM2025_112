// src/QuestDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";

export default function QuestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [stages, setStages] = useState([]);
  
  // State Form Tambah Baru
  const [form, setForm] = useState({
    stage_seq: 1,
    location_name: "",
    riddle_text: "",
    latitude: "",
    longitude: "",
    radius: 50,
    correct_answer: ""
  });

  const [hints, setHints] = useState([{ text: "", cost: 10 }]);

  // --- STYLES ---
  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
      backgroundSize: "20px 20px",
      fontFamily: "'Inter', system-ui, sans-serif",
      paddingBottom: "50px"
    },
    wrapper: { maxWidth: "900px", margin: "0 auto", padding: "20px" },
    header: { marginBottom: "30px", paddingTop: "30px" },
    backBtn: {
      background: "none", border: "1px solid #cbd5e1", borderRadius: "8px",
      padding: "8px 16px", cursor: "pointer", color: "#64748b",
      marginBottom: "15px", fontWeight: "500"
    },
    card: {
      backgroundColor: "white", borderRadius: "16px",
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", padding: "30px",
      borderTop: "5px solid #10b981", marginBottom: "40px"
    },
    sectionTitle: { fontSize: "1.25rem", fontWeight: "700", color: "#1e293b", marginBottom: "20px" },
    label: { display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#475569", marginBottom: "8px" },
    input: {
      width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1",
      fontSize: "0.95rem", color: "#1e293b", outline: "none"
    },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" },
    hintBox: { backgroundColor: "#fffbeb", border: "1px dashed #f59e0b", borderRadius: "12px", padding: "20px", marginBottom: "25px" },
    btnSave: {
      width: "100%", padding: "14px", backgroundColor: "#10b981", color: "white",
      border: "none", borderRadius: "10px", fontSize: "1rem", fontWeight: "700", cursor: "pointer"
    }
  };

  // --- LOGIC ---
  useEffect(() => {
    if (!token) {
        alert("Sesi habis, silakan login kembali.");
        navigate("/login");
    } else {
        fetchStages();
    }
  }, [id]);

  const fetchStages = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/stages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStages(res.data);
      // Auto increment sequence untuk form tambah baru
      setForm(prev => ({ ...prev, stage_seq: res.data.length + 1 }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleHintChange = (index, field, value) => {
    const newHints = [...hints];
    newHints[index][field] = value;
    setHints(newHints);
  };

  const addHintField = () => setHints([...hints, { text: "", cost: 10 }]);
  const removeHintField = (index) => setHints(hints.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        quest_id: id,
        sequence: form.stage_seq,
        location_name: form.location_name,
        riddle_text: form.riddle_text,
        lat: form.latitude,
        lon: form.longitude,
        radius: form.radius,
        correct_answer: form.correct_answer,
        hints: hints
      };

      await axios.post("http://localhost:5000/api/admin/stages", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Stage Berhasil Disimpan!");
      setForm({
        stage_seq: stages.length + 2,
        location_name: "", riddle_text: "", latitude: "", longitude: "",
        radius: 50, correct_answer: ""
      });
      setHints([{ text: "", cost: 10 }]);
      fetchStages(); 
    } catch (err) {
      alert("❌ Gagal: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (stageId) => {
    if (!confirm("⚠️ Hapus stage ini?")) return;
    try {
        await axios.delete(`http://localhost:5000/api/admin/stages/${stageId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchStages();
    } catch (err) {
        alert("Gagal hapus");
    }
  };

  return (
    <div style={styles.container}>
      <Navbar />
      <div style={styles.wrapper}>
        
        {/* HEADER */}
        <div style={styles.header}>
            <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>&larr; Dashboard</button>
            <h1 style={{ margin: "10px 0 0", fontSize: "2rem", color: "#0f172a" }}>Manajemen Stage (Quest #{id})</h1>
        </div>

        {/* === FORM TAMBAH STAGE === */}
        <div style={styles.card}>
            <h3 style={styles.sectionTitle}>✨ Tambah Stage Baru</h3>
            <form onSubmit={handleSubmit}>
                <div style={styles.grid2}>
                    <div>
                        <label style={styles.label}>Urutan (Seq)</label>
                        <input style={{ ...styles.input, backgroundColor: "#f1f5f9" }} type="number" value={form.stage_seq} readOnly />
                    </div>
                    <div>
                        <label style={styles.label}>Radius (m)</label>
                        <input style={styles.input} type="number" name="radius" value={form.radius} onChange={handleChange} />
                    </div>
                </div>
                <div style={{ marginBottom: "20px" }}>
                    <label style={styles.label}>Nama Lokasi</label>
                    <input style={styles.input} type="text" name="location_name" value={form.location_name} onChange={handleChange} required />
                </div>
                <div style={{ marginBottom: "20px" }}>
                    <label style={styles.label}>Riddle</label>
                    <textarea style={{ ...styles.input, height: "100px" }} name="riddle_text" value={form.riddle_text} onChange={handleChange} required />
                </div>
                <div style={{ marginBottom: "20px" }}>
                    <label style={styles.label}>Kunci Jawaban (Opsional)</label>
                    <input style={styles.input} type="text" name="correct_answer" value={form.correct_answer} onChange={handleChange} />
                </div>
                <div style={styles.grid2}>
                    <div><label style={styles.label}>Latitude</label><input style={styles.input} type="number" step="any" name="latitude" value={form.latitude} onChange={handleChange} required /></div>
                    <div><label style={styles.label}>Longitude</label><input style={styles.input} type="number" step="any" name="longitude" value={form.longitude} onChange={handleChange} required /></div>
                </div>

                {/* HINTS */}
                <div style={styles.hintBox}>
                    <label style={styles.label}>💡 Hints</label>
                    {hints.map((hint, i) => (
                        <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                            <input style={{ ...styles.input, flex: 1 }} placeholder="Isi Hint..." value={hint.text} onChange={e => handleHintChange(i, "text", e.target.value)} />
                            <input style={{ ...styles.input, width: "80px" }} type="number" placeholder="XP" value={hint.cost} onChange={e => handleHintChange(i, "cost", e.target.value)} />
                            {hints.length > 1 && <button type="button" onClick={() => removeHintField(i)} style={{ background: "#fee2e2", color: "red", border: "none", borderRadius: "8px", padding: "0 10px" }}>X</button>}
                        </div>
                    ))}
                    <button type="button" onClick={addHintField} style={{ background: "none", border: "none", color: "#b45309", fontWeight: "bold", cursor: "pointer" }}>+ Tambah Hint</button>
                </div>

                <button type="submit" style={styles.btnSave}>💾 Simpan Stage</button>
            </form>
        </div>

        {/* === LIST STAGES === */}
        <h3 style={styles.sectionTitle}>Timeline Petualangan</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {stages.map((stage) => (
                <div key={stage.stage_id} style={{ 
                    display: "flex", gap: "20px", backgroundColor: "white", padding: "20px", 
                    borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" 
                }}>
                    <div style={{ 
                        width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#3b82f6", 
                        color: "white", display: "flex", alignItems: "center", justifyContent: "center", 
                        fontWeight: "800", fontSize: "1.5rem", flexShrink: 0 
                    }}>
                        {stage.stage_seq}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <h4 style={{ margin: "0 0 8px 0" }}>{stage.location_name}</h4>
                            <div style={{ display: "flex", gap: "8px" }}>
                                {/* 👇 TOMBOL EDIT BARU */}
                                <button 
                                    onClick={() => navigate(`/edit-stage/${stage.stage_id}`)}
                                    style={{ background: "#fef3c7", color: "#d97706", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDelete(stage.stage_id)} 
                                    style={{ background: "#fee2e2", color: "#ef4444", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                        <p style={{ color: "#475569", margin: "0 0 8px 0" }}>"{stage.riddle_text}"</p>
                        <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                            📍 {stage.latitude}, {stage.longitude} | Radius: {stage.radius}m
                        </div>
                    </div>
                </div>
            ))}
        </div>

      </div>
    </div>
  );
}