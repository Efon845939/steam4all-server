// api/health.js
export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: 'steam4all-server',
    time: new Date().toISOString()
  });
}
