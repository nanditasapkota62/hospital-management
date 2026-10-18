import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api';

export default function Doctor() {
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [rx, setRx] = useState({ appointment_id: '', medicines: '', dosage_instructions: '', notes: '' });
  const [upload, setUpload] = useState({ patient_id: '', file: null });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const [a, p] = await Promise.all([api.get('/appointments'), api.get('/prescriptions')]);
    setAppointments(a.data);
    setPrescriptions(p.data);
  }

  useEffect(() => { load(); }, []);

  const patients = [...new Map(appointments.map((a) => [a.patient_id, a.patient_name])).entries()];

  async function setStatus(id, status) {
    await api.patch(`/appointments/${id}/status`, { status });
    load();
  }

  async function savePrescription(e) {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      await api.post('/prescriptions', rx);
      setMsg('Prescription saved');
      setRx({ appointment_id: '', medicines: '', dosage_instructions: '', notes: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save prescription');
    }
  }

  async function uploadDoc(e) {
    e.preventDefault();
    const form = e.target;
    setMsg('');
    setError('');
    if (!upload.file) {
      setError('Please choose a file');
      return;
    }
    const data = new FormData();
    data.append('patient_id', upload.patient_id);
    data.append('file', upload.file);
    try {
      await api.post('/records', data);
      setMsg('Document uploaded successfully');
      setUpload({ patient_id: '', file: null });
      form.reset();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload document');
    }
  }

  return (
    <Layout role="doctor">
      <div className="grid">
        <div>
          <div className="panel">
            <h3>My appointments</h3>
            <table>
              <thead>
                <tr><th>Patient</th><th>Date</th><th>Time</th><th>Reason</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.appointment_id}>
                    <td>{a.patient_name}</td>
                    <td>{a.appointment_date}</td>
                    <td>{a.appointment_time}</td>
                    <td>{a.reason}</td>
                    <td><span className={`badge ${a.status}`}>{a.status}</span></td>
                    <td>
                      {a.status === 'booked' && (
                        <>
                          <button className="link-btn" onClick={() => setStatus(a.appointment_id, 'completed')}>Complete</button>
                          {' · '}
                          <button className="link-btn" onClick={() => setStatus(a.appointment_id, 'cancelled')}>Cancel</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {appointments.length === 0 && <p className="muted">No appointments yet.</p>}
          </div>

          <div className="panel">
            <h3>Prescriptions I wrote</h3>
            <table>
              <thead>
                <tr><th>Patient</th><th>Medicines</th><th>Dosage</th><th>Date</th></tr>
              </thead>
              <tbody>
                {prescriptions.map((p) => (
                  <tr key={p.prescription_id}>
                    <td>{p.patient_name}</td>
                    <td>{p.medicines}</td>
                    <td>{p.dosage_instructions}</td>
                    <td>{String(p.created_at).slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {prescriptions.length === 0 && <p className="muted">No prescriptions yet.</p>}
          </div>
        </div>

        <div>
          {msg && <div className="success">{msg}</div>}
          {error && <div className="error">{error}</div>}

          <div className="panel">
            <h3>New prescription</h3>
            <form onSubmit={savePrescription}>
              <label>Appointment
                <select value={rx.appointment_id} onChange={(e) => setRx({ ...rx, appointment_id: e.target.value })} required>
                  <option value="">Select appointment</option>
                  {appointments.filter((a) => a.status !== 'cancelled').map((a) => (
                    <option key={a.appointment_id} value={a.appointment_id}>
                      {a.patient_name} - {a.appointment_date} {a.appointment_time}
                    </option>
                  ))}
                </select>
              </label>
              <label>Medicines
                <textarea rows="2" value={rx.medicines} onChange={(e) => setRx({ ...rx, medicines: e.target.value })} required />
              </label>
              <label>Dosage instructions
                <input value={rx.dosage_instructions} onChange={(e) => setRx({ ...rx, dosage_instructions: e.target.value })} />
              </label>
              <label>Notes
                <input value={rx.notes} onChange={(e) => setRx({ ...rx, notes: e.target.value })} />
              </label>
              <button type="submit">Save prescription</button>
            </form>
          </div>

          <div className="panel">
            <h3>Upload medical document</h3>
            <form onSubmit={uploadDoc}>
              <label>Patient
                <select value={upload.patient_id} onChange={(e) => setUpload({ ...upload, patient_id: e.target.value })} required>
                  <option value="">Select patient</option>
                  {patients.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </label>
              <label>File (PDF, PNG or JPG, max 5 MB)
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setUpload({ ...upload, file: e.target.files[0] })} />
              </label>
              <button type="submit">Upload</button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}