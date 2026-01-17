import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  
  // --- BAGIAN PENGAMAN (SAFE MODE) ---
  let admin = { name: "Admin", email: "admin@nusa.com" }; // Default dummy
  try {
    const savedAdmin = localStorage.getItem("admin");
    if (savedAdmin && savedAdmin !== "undefined") {
      admin = JSON.parse(savedAdmin);
    }
  } catch (error) {
    console.error("Gagal baca data admin:", error);
    // Jika error, biarkan pakai data default agar tidak blank
  }

  const handleLogout = () => {
    localStorage.clear(); // Hapus semua data login
    navigate("/");
  };

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "70px",
      background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(10px)",
      borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 40px", boxSizing: "border-box",
      zIndex: 1000
    }}>
      {/* KIRI */}
      <div 
        onClick={() => navigate("/dashboard")} 
        style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1e293b", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
      >
        🏝️ Nusantara Quest <span style={{ fontSize: "0.75rem", background: "#eff6ff", color: "#3b82f6", padding: "2px 8px", borderRadius: "4px" }}>Admin Panel</span>
      </div>

      {/* KANAN */}
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#334155" }}>{admin?.name || "Admin User"}</div>
          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{admin?.email || "admin@nusa.com"}</div>
        </div>
        <button 
          onClick={handleLogout} 
          style={{ background: "#ef4444", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}