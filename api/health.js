export default function handler(req, res) {
  res.status(200).json({ ok: true, route: 'health', time: new Date().toISOString() });
}
