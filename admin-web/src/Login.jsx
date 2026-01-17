import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Tambahan status loading
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 1. TEMBAK ENDPOINT BARU (Sesuai Backend)
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      // 2. AMBIL DATA DARI STRUKTUR BARU
      // Struktur Backend: { status: 'success', data: { token, role, ... } }
      const responseData = res.data.data;

      // 3. VALIDASI DATA & ROLE
      if (responseData && responseData.token) {
        
        // Cek apakah dia ADMIN?
        if (responseData.role === 'ADMIN' || responseData.role === 'SUPER_ADMIN') {
            
            // Simpan Token & Data User
            localStorage.setItem("token", responseData.token);
            localStorage.setItem("user", JSON.stringify(responseData)); // Ganti 'admin' jadi 'user' biar umum

            // Redirect ke Dashboard
            navigate("/dashboard");
        } else {
            setError("⛔ Akses Ditolak! Akun ini bukan Admin. Silakan login di Aplikasi Mobile.");
        }

      } else {
        setError("Format data dari server tidak dikenali.");
      }

    } catch (err) {
      console.error(err);
      // Menangkap pesan error dari backend (misal: "Password salah!" atau "Email tidak ditemukan")
      setError(err.response?.data?.message || "Gagal masuk. Pastikan Server Backend menyala!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      height: "100vh", width: "100vw", display: "flex", 
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: "relative", overflow: "hidden"
    }}>
      
      {/* BACKGROUND (Blurry) */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: 'url("https://images.unsplash.com/photo-1596402184320-417e7178b2cd?q=80&w=1470&auto=format&fit=crop")',
        backgroundSize: "cover", backgroundPosition: "center",
        filter: "blur(3px)", transform: "scale(1.05)"
      }}></div>

      {/* OVERLAY (Soft Dark) */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.4)" }}></div>

      {/* GLASS CARD */}
      <div style={{
        position: "relative", width: "100%", maxWidth: "420px", padding: "40px",
        borderRadius: "24px", background: "rgba(255, 255, 255, 0.15)",
        backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)", color: "white"
      }}>
        
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", padding: "8px 15px", borderRadius: "20px", marginBottom: "10px" }}>
            🏝️ NUSANTARA QUEST
          </div>
          <h2 style={{ fontSize: "2rem", fontWeight: "800", margin: "0" }}>Welcome Back!</h2>
          <p style={{ opacity: 0.8, marginTop: "5px" }}>Login Administrator</p>
        </div>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.8)", padding: "12px", borderRadius: "8px", marginBottom: "20px", textAlign: "center", fontSize: "0.9rem", border: "1px solid #fca5a5" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem" }}>Email</label>
            <input 
              type="email" 
              placeholder="admin@nusa.com" // Hint domain admin
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              disabled={isLoading}
              style={{ 
                width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.3)", 
                background: "rgba(0, 0, 0, 0.2)", color: "white", outline: "none", fontSize: "1rem"
              }}
            />
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem" }}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              disabled={isLoading}
              style={{ 
                width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.3)", 
                background: "rgba(0, 0, 0, 0.2)", color: "white", outline: "none", fontSize: "1rem"
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              width: "100%", padding: "16px", borderRadius: "12px", border: "none",
              background: isLoading ? "#94a3b8" : "#3b82f6", // Abu-abu jika loading
              color: "white", fontWeight: "bold", fontSize: "1rem", 
              cursor: isLoading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
              transition: "all 0.3s ease"
          }}>
            {isLoading ? "Memproses..." : "Masuk Dashboard 🚀"}
          </button>
        </form>

      </div>
    </div>
  );
}