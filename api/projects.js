// Lists uploaded assets from Cloudinary (optionally filtered by ?studentName=...)
// GET /api/projects
// GET /api/projects?studentName=Alice

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = async (req, res) => {
  // CORS (relax for testing; later restrict to your Squarespace domain)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const folder = process.env.CLOUDINARY_FOLDER || 'steam4all';
    const studentName = (req.query.studentName || '').toString().trim();

    // Search by folder; fetch latest first
    // You can paginate more with .max_results and .next_cursor if needed.
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
      studentName: r.context && r.context.custom && r.context.custom.studentName
        ? r.context.custom.studentName
        : null
    }));

    if (studentName) {
      items = items.filter(i => (i.studentName || '').toLowerCase() === studentName.toLowerCase());
    }

    res.status(200).json({ success: true, count: items.length, items });
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ success: false, message: 'Could not list projects', error: String(err) });
  }
};
