import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";

export default function RewardManager() {
  const { id } = useParams(); // Quest ID
  const navigate = useNavigate();
  
  const [quest, setQuest] = useState(null); 
  const [rewards, setRewards] = useState([]);
  
  // State Form
  const [type, setType] = useState("STORY"); 
  const [contentText, setContentText] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [audioFile, setAudioFile] = useState(null);

  // 1. AMBIL TOKEN DARI LOCAL STORAGE
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Proteksi jika user belum login
    if (!token) {
        alert("Sesi habis. Silakan login kembali.");
        navigate("/");
        return;
    }
    fetchQuestAndRewards();
  }, [id]);

  const fetchQuestAndRewards = async () => {
    try {
      // 2. FETCH QUEST (Gunakan Endpoint Admin + Header Auth)
      const resQuest = await axios.get(`http://localhost:5000/api/admin/quests/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const questData = resQuest.data;
      setQuest(questData);

      // Logika Penentuan Tipe Reward (Sesuai SRS)
      if (questData.category === 'CULINARY') {
        setType('VOUCHER'); 
      } else if (questData.category === 'MYSTERY') {
        setType('STORY');   
      } else if (questData.category === 'HISTORY') {
        setType('AUDIO');   
      }

      // 3. FETCH REWARDS
      // Perhatikan URL: /api/admin/rewards/quest/:id (Sesuai route backend)
      const resRewards = await axios.get(`http://localhost:5000/api/admin/rewards/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRewards(resRewards.data);

    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) navigate("/");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("quest_id", id);
    formData.append("type", type);
    
    if (type === "STORY") formData.append("content_text", contentText);
    if (type === "VOUCHER") formData.append("voucher_code", voucherCode);
    
    // 4. PERBAIKAN PENTING: Ganti 'audioFile' menjadi 'media'
    // Backend (rewardRoutes.js) menggunakan: upload.single('media')
    if (type === "AUDIO" && audioFile) {
        formData.append("media", audioFile);
    }

    try {
      await axios.post("http://localhost:5000/api/admin/rewards", formData, {
        headers: { 
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}` // Jangan lupa token!
        }
      });
      
      alert("🎁 Hadiah Berhasil Disimpan!");
      
      // Reset Form
      setContentText(""); 
      setVoucherCode(""); 
      setAudioFile(null);
      
      fetchQuestAndRewards(); // Refresh list

    } catch (err) {
      alert("Gagal: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (rewardId) => {
    if(!confirm("Yakin hapus hadiah ini?")) return;
    
    try {
        await axios.delete(`http://localhost:5000/api/admin/rewards/${rewardId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchQuestAndRewards();
    } catch (err) {
        alert("Gagal menghapus reward.");
    }
  };

  const getCategoryLabel = (cat) => {
    if (cat === 'HISTORY') return '📜 Sejarah (History)';
    if (cat === 'CULINARY') return '🍜 Kuliner (Culinary)';
    if (cat === 'MYSTERY') return '👻 Misteri (Mystery)';
    return cat;
  };

  if (!quest) return <div style={{textAlign:"center", marginTop:"100px"}}>Loading Data...</div>;

  return (
    <>
      <Navbar />
      <div className="main-content" style={{ maxWidth: "900px", margin: "100px auto 50px", padding: "0 20px" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
            <button onClick={() => navigate("/dashboard")} className="btn-outline" style={{ marginBottom: "15px" }}>
                &larr; Kembali ke Dashboard
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <h1 style={{ margin: 0, fontSize: "2rem" }}>Manajemen Hadiah</h1>
                <span className="badge" style={{ fontSize: "1rem", padding: "6px 12px", background: "#e2e8f0", color: "#334155" }}>
                  Quest: {quest.title}
                </span>
            </div>
            
            <div style={{ marginTop: "15px", padding: "10px 15px", background: "#eff6ff", borderLeft: "4px solid #3b82f6", color: "#1e40af", borderRadius: "4px" }}>
              ℹ️ Karena ini Quest kategori <b>{getCategoryLabel(quest.category)}</b>, sistem otomatis menyesuaikan tipe hadiah yang cocok.
            </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "30px" }}>
          
          <div className="card" style={{ borderTop: "5px solid #8b5cf6" }}>
            <h3 style={{ marginTop: 0, color: "#8b5cf6", marginBottom: "20px" }}>🎁 Tambah Hadiah Baru</h3>
            
            <form onSubmit={handleSubmit}>
              
              <div style={{ marginBottom: "20px" }}>
                <label>Tipe Hadiah (Otomatis)</label>
                
                {quest.category === 'HISTORY' ? (
                   <select value={type} onChange={(e) => setType(e.target.value)} style={{ height: "48px", fontSize: "1rem", fontWeight: "bold" }}>
                      <option value="AUDIO">🎧 Audio Guide (Rekomendasi)</option>
                      <option value="STORY">📖 Story / Cerita Sejarah</option>
                   </select>
                ) : (
                   <input 
                      type="text" 
                      value={type === 'VOUCHER' ? '🎟️ VOUCHER (Kuliner)' : '📖 STORY (Misteri)'} 
                      disabled 
                      style={{ background: "#f1f5f9", cursor: "not-allowed", fontWeight: "bold", color: "#64748b" }} 
                   />
                )}
              </div>

              <div style={{ backgroundColor: "#f8fafc", padding: "25px", borderRadius: "12px", marginBottom: "25px", border: "2px dashed #cbd5e1" }}>
                
                {type === "STORY" && (
                  <div>
                    <label>Isi Cerita / Legenda:</label>
                    <textarea 
                      value={contentText} 
                      onChange={(e) => setContentText(e.target.value)} 
                      placeholder={`Tuliskan cerita ${quest.category === 'MYSTERY' ? 'misteri' : 'sejarah'} di sini...`}
                      style={{ height: "150px" }}
                      required 
                    />
                  </div>
                )}

                {type === "VOUCHER" && (
                  <div style={{ textAlign: "center" }}>
                    <label>Kode Voucher Diskon:</label>
                    <input 
                      type="text" 
                      value={voucherCode} 
                      onChange={(e) => setVoucherCode(e.target.value)} 
                      placeholder="Contoh: MAKANGRATIS123" 
                      required 
                      style={{ fontSize: "1.5rem", letterSpacing: "3px", fontWeight: "bold", color: "#db2777", textAlign: "center", padding: "15px" }}
                    />
                    <small style={{ display: "block", marginTop: "10px", color: "#64748b" }}>
                      Voucher ini akan muncul di menu "My Rewards" pengguna.
                    </small>
                  </div>
                )}

                {type === "AUDIO" && (
                  <div style={{ textAlign: "center" }}>
                    <label style={{ marginBottom: "15px", display: "block" }}>Upload Narasi Audio (MP3):</label>
                    <input 
                      type="file" 
                      accept="audio/*" 
                      onChange={(e) => setAudioFile(e.target.files[0])} 
                      required 
                      style={{ margin: "0 auto" }}
                    />
                  </div>
                )}
              </div>

              <button type="submit" className="btn-primary" style={{ width: "100%", padding: "15px", backgroundColor: "#8b5cf6", fontSize: "1.1rem", fontWeight: "600" }}>
                Simpan Hadiah
              </button>
            </form>
          </div>

          <div>
            <h3 style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", marginBottom: "20px" }}>Daftar Hadiah Tersedia</h3>
            {rewards.length === 0 ? <p style={{color: "#94a3b8"}}>Belum ada hadiah.</p> : (
                rewards.map((r) => (
                   <div key={r.reward_id} className="card" style={{ padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                     <div>
                       {r.type === 'STORY' && <span>📖 {r.content_text.substring(0,60)}...</span>}
                       {r.type === 'VOUCHER' && <span style={{color:"#db2777", fontWeight:"bold"}}>🎟️ Kode: {r.voucher_code}</span>}
                       {r.type === 'AUDIO' && <span>🎧 File: {r.media_url}</span>}
                     </div>
                     <button onClick={() => handleDelete(r.reward_id)} className="btn-danger">Hapus</button>
                   </div>
                ))
            )}
           </div>

        </div>
      </div>
    </>
  );
}