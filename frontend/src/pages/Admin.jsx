import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api';

const emptyDoctor = {
  name: '', email: '', password: '', phone: '',
  specialization: '', qualification: '', available_days: '',
};

export default function Admin() {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState(emptyDoctor);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const [d, p, a] = await Promise.all([
      api.get('/doctors'),
      api.get('/patients'),
      api.get('/appointments'),
    ]);
    setDoctors(d.data);
    setPatients(p.data);
    setAppointments(a.data);
  }

  useEffect(() => { load(); }, []);

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function addDoctor(e) {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      await api.post('/doctors', form);
      setMsg('Doctor added successfully');
      setForm(emptyDoctor);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add doctor');
    }
  }

  async function removeDoctor(id) {
    if (!window.confirm('Remove this doctor?')) return;
    setMsg('');
    setError('');
    try {
      await api.delete(`/doctors/${id}`);
      setMsg('Doctor removed');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove doctor');
    }
  }

  async function removePatient(id) {
    if (!window.confirm('Remove this patient and all their records?')) return;
    setMsg('');
    setError('');
    try {
      await api.delete(`/patients/${id}`);
      setMsg('Patient removed');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove patient');
    }
  }

  async function cancelAppointment(id) {
    await api.patch(`/appointments/${id}/status`, { status: 'cancelled' });
    load();
  }

  return (
    <Layout role="admin">
      <div className="stats">
        <div className="panel"><span className="muted">Doctors</span><p className="stat-num">{doctors.length}</p></div>
        <div className="panel"><span className="muted">Patients</span><p className="stat-num">{patients.length}</p></div>
        <div className="panel"><span className="muted">Appointments</span><p className="stat-num">{appointments.length}</p></div>
      </div>

      {msg && <div className="success">{msg}</div>}
      {error && <div className="error">{error}</div>}

      <div className="grid">
        <div>
          <div className="panel">
            <h3>Doctors</h3>
            <table>
              <thead>
                <tr><th>Name</th><th>Specialization</th><th>Days</th><th></th></tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.doctor_id}>
                    <td>{d.name}</td>
                    <td>{d.specialization}</td>
                    <td>{d.available_days}</td>
                    <td><button className="link-btn" onClick={() => removeDoctor(d.doctor_id)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <h3>Patients</h3>
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Gender</th><th>Blood</th><th></th></tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.patient_id}>
                    <td>{p.name}</td>
                    <td>{p.email}</td>
                    <td>{p.gender}</td>
                    <td>{p.blood_group}</td>
                    <td><button className="link-btn" onClick={() => removePatient(p.patient_id)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <h3>All appointments</h3>
            <table>
              <thead>
                <tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.appointment_id}>
                    <td>{a.patient_name}</td>
                    <td>{a.doctor_name}</td>
                    <td>{a.appointment_date}</td>
                    <td>{a.appointment_time}</td>
                    <td><span className={`badge ${a.status}`}>{a.status}</span></td>
                    <td>
                      {a.status === 'booked' && (
                        <button className="link-btn" onClick={() => cancelAppointment(a.appointment_id)}>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h3>Add doctor</h3>
          <form onSubmit={addDoctor}>
            <label>Full name<input name="name" value={form.name} onChange={change} required /></label>
            <label>Email<input name="email" type="email" value={form.email} onChange={change} required /></label>
            <label>Password<input name="password" type="password" value={form.password} onChange={change} required /></label>
            <label>Phone<input name="phone" value={form.phone} onChange={change} /></label>
            <label>Specialization<input name="specialization" value={form.specialization} onChange={change} /></label>
            <label>Qualification<input name="qualification" value={form.qualification} onChange={change} /></label>
            <label>Available days<input name="available_days" value={form.available_days} onChange={change} placeholder="Mon, Wed, Fri" /></label>
            <button type="submit">Add doctor</button>
          </form>
        </div>
      </div>
    </Layout>
  );
}