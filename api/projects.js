// Lists uploaded assets from Cloudinary (optionally filtered by ?studentName=...)
// GET /api/projects
// GET /api/projects?studentName=Alice

export default async function handler(req, res) {
  // CORS (open for testing; we can tighten later)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

  // ⤵ dynamic imports (avoid bundler issues)
  const { v2: cloudinary } = await import('cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  try {
    const folder = process.env.CLOUDINARY_FOLDER || 'steam4all';
    const studentName = (req.query.studentName || '').toString().trim();

    const search = cloudinary.search
      .expression(`folder:${folder}`)
      .sort_by('created_at', 'desc')
      .max_results(100);

    const result = await search.execute();

    let items = (result.resources || []).map(r => ({
      public_id: r.public_id,
      url: r.secure_url,
      format: r.format,
      resource_type: r.resource_type,
      bytes: r.bytes,
      created_at: r.created_at,
      studentName: r.context?.custom?.studentName ?? null
    }));

    if (studentName) {
      items = items.filter(i => (i.studentName || '').toLowerCase() === studentName.toLowerCase());
    }

    res.status(200).json({ success: true, count: items.length, items });
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ success: false, message: 'Could not list projects', error: String(err) });
  }
}
