import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    date_of_birth: '', gender: '', blood_group: '', address: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', form);
      alert('Registered successfully. Please sign in.');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not connect to the server');
    }
  }

  return (
    <div className="login-page">
      <form className="card" onSubmit={handleSubmit}>
        <h2>Create patient account</h2>
        <p className="muted">Fill in your details</p>
        {error && <div className="error">{error}</div>}
        <label>Full name<input name="name" value={form.name} onChange={change} required /></label>
        <label>Email<input name="email" type="email" value={form.email} onChange={change} required /></label>
        <label>Password<input name="password" type="password" value={form.password} onChange={change} required /></label>
        <label>Phone<input name="phone" value={form.phone} onChange={change} /></label>
        <label>Date of birth<input name="date_of_birth" type="date" value={form.date_of_birth} onChange={change} /></label>
        <label>Gender
          <select name="gender" value={form.gender} onChange={change}>
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </label>
        <label>Blood group<input name="blood_group" value={form.blood_group} onChange={change} placeholder="e.g. O+" /></label>
        <label>Address<input name="address" value={form.address} onChange={change} /></label>
        <button className="full" type="submit">Register</button>
        <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
          Already registered? <Link to="/">Sign in</Link>
        </p>
      </form>
    </div>
  );
}