import { Link } from "react-router-dom";

const card = {
  background: "white",
  padding: "20px",
  borderRadius: "10px",
  width: "240px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};

const btn = {
  padding: "12px 28px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  margin: "0 8px",
};

export default function Landing() {
  return (
    <div style={{ fontFamily: "Arial", background: "#f4f8fb", minHeight: "100vh" }}>
      <div style={{ background: "#0a6ebd", color: "white", padding: "70px 20px", textAlign: "center" }}>
        <h1>Cloud-Based Hospital Management System</h1>
        <p>Book appointments, manage prescriptions and records, all in one place.</p>
        <Link to="/login" style={{ ...btn, background: "white", color: "#0a6ebd" }}>Login</Link>
        <Link to="/register" style={{ ...btn, border: "2px solid white", color: "white" }}>Register</Link>
      </div>

      <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap", padding: "40px 20px" }}>
        <div style={card}><h3>Patients</h3><p>Register, book appointments, and view prescriptions and records.</p></div>
        <div style={card}><h3>Doctors</h3><p>Manage appointments, view patient info, and write prescriptions.</p></div>
        <div style={card}><h3>Admins</h3><p>Manage doctors, patients, and all appointments.</p></div>
      </div>
    </div>
  );
}