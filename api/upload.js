// Parses multipart/form-data and uploads to Cloudinary.
// Accepts fields: studentName, file (input name must be "projectFile")
// Returns: { success, url, public_id, studentName }

const cloudinary = require('cloudinary').v2;
const formidable = require('formidable');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = async (req, res) => {
  // CORS (relax for testing; later restrict to your Squarespace domain)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const form = new formidable.IncomingForm({ multiples: false });
    // Ensure formidable keeps the file on disk temporarily
    form.keepExtensions = true;

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
    });

    const studentName = (fields.studentName || 'Unknown').toString();

    const fileObj =
      files.projectFile ||
      files.file ||
      files.upload;
    if (!fileObj || !fileObj.filepath) {
      res.status(400).json({ success: false, message: 'No file uploaded (expected field "projectFile")' });
      return;
    }

    const folder = process.env.CLOUDINARY_FOLDER || 'steam4all';
    const uploadResult = await cloudinary.uploader.upload(fileObj.filepath, {
      folder,
      resource_type: 'auto',              // handles images/videos
      context: { studentName },           // attach metadata
      public_id: undefined                // let Cloudinary generate
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
};
