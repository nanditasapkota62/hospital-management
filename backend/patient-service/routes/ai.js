const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Try each model in turn; give up on a model after 12 seconds
async function askGemini(prompt) {
  const models = [
    ...new Set([process.env.GEMINI_MODEL, 'gemini-3.7-flash', 'gemini-3.5-flash'].filter(Boolean)),
  ];
  let lastError = 'unknown error';

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: AbortSignal.timeout(12000),
        }
      );
      const data = await response.json();

      if (response.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
        lastError = 'empty answer';
        continue;
      }
      lastError = data.error?.message || 'unknown error';
      console.error(model, '-', lastError);
    } catch (err) {
      lastError = 'timeout or network problem';
      console.error(model, '-', err.message);
    }
  }
  throw new Error(lastError);
}

// Explain a prescription in simple words (patient only, own prescriptions only)
router.post('/explain', authenticate, authorize('patient'), async (req, res) => {
  try {
    const { prescription_id } = req.body;
    const [p] = await pool.query('SELECT patient_id FROM patients WHERE user_id = ?', [req.user.user_id]);
    const [rows] = await pool.query(
      'SELECT medicines, dosage_instructions, notes FROM prescriptions WHERE prescription_id = ? AND patient_id = ?',
      [prescription_id, p[0].patient_id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    const rx = rows[0];
    // Only the medicine text is sent to the AI, never the patient's name or email
    const prompt = `Explain this prescription to a patient in very simple words, in at most 5 short sentences. Say what each medicine is generally used for and how to take it exactly as written. Do not change the dose. End with: "This is only a simple explanation, not medical advice. Follow your doctor's instructions."
Medicines: ${rx.medicines}
Dosage: ${rx.dosage_instructions || 'not given'}
Notes: ${rx.notes || 'none'}`;

    try {
      const explanation = await askGemini(prompt);
      res.json({ explanation });
    } catch (err) {
      res.status(503).json({ message: 'AI is busy or unavailable right now. Please try again in a minute.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;