const StudyMaterial = require('../models/StudyMaterial');

// @GET /api/materials
exports.getMaterials = async (req, res, next) => {
  try {
    const { course, type, semester, search, page = 1, limit = 20, sortBy = '-createdAt' } = req.query;
    const query = { isPublic: true, isApproved: true };
    if (course) query.course = course;
    if (type) query.type = type;
    if (semester) query.semester = Number(semester);
    if (search) query.$text = { $search: search };

    const materials = await StudyMaterial.find(query)
      .populate('uploadedBy', 'name avatar')
      .populate('course', 'title')
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await StudyMaterial.countDocuments(query);
    res.status(200).json({ success: true, total, materials });
  } catch (error) {
    next(error);
  }
};

// @GET /api/materials/:id
exports.getMaterial = async (req, res, next) => {
  try {
    const material = await StudyMaterial.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('uploadedBy', 'name avatar').populate('course', 'title');

    if (!material) return res.status(404).json({ success: false, message: 'Material not found.' });
    res.status(200).json({ success: true, material });
  } catch (error) {
    next(error);
  }
};

// @POST /api/materials
exports.uploadMaterial = async (req, res, next) => {
  try {
    if (!req.file && !req.body.fileUrl) {
      return res.status(400).json({ success: false, message: 'File or URL required.' });
    }

    const materialData = {
      ...req.body,
      uploadedBy: req.user.id,
      fileUrl: req.file ? req.file.path : req.body.fileUrl,
      fileName: req.file ? req.file.originalname : req.body.fileName,
      fileSize: req.file ? req.file.size : undefined,
      mimeType: req.file ? req.file.mimetype : undefined,
    };

    const material = await StudyMaterial.create(materialData);
    res.status(201).json({ success: true, material });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/materials/:id
exports.updateMaterial = async (req, res, next) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found.' });
    if (material.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    const updated = await StudyMaterial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, material: updated });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/materials/:id
exports.deleteMaterial = async (req, res, next) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found.' });
    if (material.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    await StudyMaterial.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Material deleted.' });
  } catch (error) {
    next(error);
  }
};

// @POST /api/materials/:id/download
exports.trackDownload = async (req, res, next) => {
  try {
    await StudyMaterial.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

