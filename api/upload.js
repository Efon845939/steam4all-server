// Parses multipart/form-data and uploads to Cloudinary.
// Accepts fields: studentName, projectFile (file input name must be "projectFile")
// Returns: { success, url, public_id, studentName }

export const config = {
  api: { bodyParser: false } // harmless here; useful if ever moved into Next.js
};

export default async function handler(req, res) {
  // CORS (open for testing; we can tighten later)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  // ⤵ dynamic imports (avoid bundler issues)
  const { v2: cloudinary } = await import('cloudinary');
  const formidable = (await import('formidable')).default;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  try {
    const form = new formidable.IncomingForm({ multiples: false, keepExtensions: true });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
    });

    const studentName = (fields.studentName || 'Unknown').toString();

    const fileObj = files.projectFile || files.file || files.upload;
    const filepath =
      (fileObj && fileObj.filepath) ||
      (Array.isArray(fileObj) && fileObj[0] && fileObj[0].filepath);

    if (!filepath) {
      return res.status(400).json({ success: false, message: 'No file uploaded (expected field "projectFile")' });
    }

    const folder = process.env.CLOUDINARY_FOLDER || 'steam4all';
    const uploadResult = await cloudinary.uploader.upload(filepath, {
      folder,
      resource_type: 'auto',
      context: { studentName }
    });

    res.status(200).json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      studentName
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: 'Upload failed', error: String(err) });
  }
}
