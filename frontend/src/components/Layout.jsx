import { useNavigate, Navigate } from 'react-router-dom';

export default function Layout({ role, children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!user || !localStorage.getItem('token') || user.role !== role) {
    return <Navigate to="/" />;
  }

  function logout() {
    localStorage.clear();
    navigate('/');
  }

  return (
    <div>
      <div className="topbar">
        <strong>CloudCare HMS</strong>
        <span>
          {user.name} ({user.role})
          <button onClick={logout} style={{ marginLeft: 12 }}>Log out</button>
        </span>
      </div>
      <div className="container">{children}</div>
    </div>
  );
}