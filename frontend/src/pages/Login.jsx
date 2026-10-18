import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/' + res.data.user.role);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not connect to the server');
    }
  }

  return (
    <div className="login-page">
      <form className="card" onSubmit={handleSubmit}>
        <h2>CloudCare HMS</h2>
        <p className="muted">Sign in to your account</p>
        {error && <div className="error">{error}</div>}
        <label>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button className="full" type="submit">Sign in</button>
        <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
          New patient? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}