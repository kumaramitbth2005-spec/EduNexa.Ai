/**
 * studyTaskController.js
 * CRUD for StudyTask — the structured study planner connected to DB.
 */

const StudyTask = require('../models/StudyTask');

// @GET /api/planner/tasks
exports.getTasks = async (req, res, next) => {
  try {
    const { status, date, startDate, endDate } = req.query;
    const filter = { user: req.user.id };

    if (status) filter.status = status;
    if (date) {
      const d = new Date(date);
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      filter.scheduledDate = { $gte: d, $lt: next };
    } else if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate);
    }

    const tasks = await StudyTask.find(filter)
      .populate('relatedDocument', 'title mimeType')
      .populate('relatedExam', 'title')
      .sort('scheduledDate priority');

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
};

// @POST /api/planner/tasks
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, topic, subject, priority, estimatedMinutes, scheduledDate, source, relatedDocument, relatedExam, isRecurring, recurrenceDays } = req.body;

    if (!title || !scheduledDate) {
      return res.status(400).json({ success: false, message: 'title and scheduledDate are required.' });
    }

    const task = await StudyTask.create({
      user: req.user.id,
      title,
      description: description || '',
      topic: topic || '',
      subject: subject || '',
      priority: priority || 'medium',
      estimatedMinutes: estimatedMinutes || 30,
      scheduledDate: new Date(scheduledDate),
      source: source || 'manual',
      relatedDocument: relatedDocument || null,
      relatedExam: relatedExam || null,
      isRecurring: isRecurring || false,
      recurrenceDays: recurrenceDays || [],
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/planner/tasks/:id
exports.updateTask = async (req, res, next) => {
  try {
    const task = await StudyTask.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        ...req.body,
        // Set completedAt if marking done
        ...(req.body.status === 'done' ? { completedAt: new Date() } : {}),
      },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    res.status(200).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/planner/tasks/:id
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await StudyTask.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    res.status(200).json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    next(error);
  }
};

// @GET /api/planner/stats
exports.getStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayTasks, totalTasks, completedTasks, pendingTasks] = await Promise.all([
      StudyTask.countDocuments({ user: req.user.id, scheduledDate: { $gte: today, $lt: tomorrow } }),
      StudyTask.countDocuments({ user: req.user.id }),
      StudyTask.countDocuments({ user: req.user.id, status: 'done' }),
      StudyTask.countDocuments({ user: req.user.id, status: 'pending' }),
    ]);

    res.status(200).json({
      success: true,
      stats: { todayTasks, totalTasks, completedTasks, pendingTasks },
    });
  } catch (error) {
    next(error);
  }
};

