import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api';

export default function Patient() {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [explanations, setExplanations] = useState({});

  async function load() {
    const [d, a, p, r] = await Promise.all([
      api.get('/doctors'),
      api.get('/appointments'),
      api.get('/prescriptions'),
      api.get('/records'),
    ]);
    setDoctors(d.data);
    setAppointments(a.data);
    setPrescriptions(p.data);
    setRecords(r.data);
  }

  useEffect(() => { load(); }, []);

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function book(e) {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      await api.post('/appointments', form);
      setMsg('Appointment booked successfully');
      setForm({ doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not book appointment');
    }
  }

  async function cancel(id) {
    await api.patch(`/appointments/${id}/status`, { status: 'cancelled' });
    load();
  }

  async function download(id, name) {
    const res = await api.get(`/records/${id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function explain(id) {
    setExplanations((prev) => ({ ...prev, [id]: 'Thinking...' }));
    try {
      const res = await api.post('/ai/explain', { prescription_id: id });
      setExplanations((prev) => ({ ...prev, [id]: res.data.explanation }));
    } catch (err) {
      setExplanations((prev) => ({
        ...prev,
        [id]: err.response?.data?.message || 'Could not get an explanation',
      }));
    }
  }

  return (
    <Layout role="patient">
      <div className="grid">
        <div>
          <div className="panel">
            <h3>My appointments</h3>
            <table>
              <thead>
                <tr><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.appointment_id}>
                    <td>{a.doctor_name}</td>
                    <td>{a.appointment_date}</td>
                    <td>{a.appointment_time}</td>
                    <td><span className={`badge ${a.status}`}>{a.status}</span></td>
                    <td>
                      {a.status === 'booked' && (
                        <button className="link-btn" onClick={() => cancel(a.appointment_id)}>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {appointments.length === 0 && <p className="muted">No appointments yet.</p>}
          </div>

          <div className="panel">
            <h3>My prescriptions</h3>
            <table>
              <thead>
                <tr><th>Medicines</th><th>Dosage</th><th>Notes</th><th>Doctor</th><th>Date</th><th></th></tr>
              </thead>
              <tbody>
                {prescriptions.map((p) => (
                  <tr key={p.prescription_id}>
                    <td>{p.medicines}</td>
                    <td>{p.dosage_instructions}</td>
                    <td>{p.notes}</td>
                    <td>{p.doctor_name}</td>
                    <td>{String(p.created_at).slice(0, 10)}</td>
                    <td>
                      <button className="link-btn" onClick={() => explain(p.prescription_id)}>
                        Explain in simple words
                      </button>
                      {explanations[p.prescription_id] && (
                        <p className="muted" style={{ marginTop: 8 }}>{explanations[p.prescription_id]}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {prescriptions.length === 0 && <p className="muted">No prescriptions yet.</p>}
          </div>

          <div className="panel">
            <h3>My medical records</h3>
            <table>
              <thead>
                <tr><th>File</th><th>Doctor</th><th>Uploaded</th><th></th></tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.record_id}>
                    <td>{r.file_name}</td>
                    <td>{r.doctor_name}</td>
                    <td>{String(r.uploaded_at).slice(0, 10)}</td>
                    <td><button className="link-btn" onClick={() => download(r.record_id, r.file_name)}>Download</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {records.length === 0 && <p className="muted">No documents yet.</p>}
          </div>
        </div>

        <div className="panel">
          <h3>Book appointment</h3>
          {msg && <div className="success">{msg}</div>}
          {error && <div className="error">{error}</div>}
          <form onSubmit={book}>
            <label>Doctor
              <select name="doctor_id" value={form.doctor_id} onChange={change} required>
                <option value="">Select a doctor</option>
                {doctors.map((d) => (
                  <option key={d.doctor_id} value={d.doctor_id}>
                    {d.name} ({d.specialization})
                  </option>
                ))}
              </select>
            </label>
            <label>Date<input type="date" name="appointment_date" value={form.appointment_date} onChange={change} required /></label>
            <label>Time<input type="time" name="appointment_time" value={form.appointment_time} onChange={change} required /></label>
            <label>Reason<input name="reason" value={form.reason} onChange={change} /></label>
            <button type="submit">Book now</button>
          </form>
        </div>
      </div>
    </Layout>
  );
}