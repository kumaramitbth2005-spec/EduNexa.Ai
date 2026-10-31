const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const Notification = require('../models/Notification');

// @GET /api/courses
exports.getCourses = async (req, res, next) => {
  try {
    const { category, level, search, page = 1, limit = 12, semester, sortBy = '-createdAt' } = req.query;
    const query = { isPublished: true, isArchived: false };

    if (category) query.category = category;
    if (level) query.level = level;
    if (semester) query.semester = Number(semester);
    if (search) query.$text = { $search: search };

    const courses = await Course.find(query)
      .populate('teacher', 'name avatar college')
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Course.countDocuments(query);

    res.status(200).json({ success: true, total, page: Number(page), courses });
  } catch (error) {
    next(error);
  }
};

// @GET /api/courses/:id
exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name avatar bio college')
      .populate('subjects');

    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    const lessons = await Lesson.find({ course: course._id, isPublished: true }).sort('order');
    let isEnrolled = false;
    if (req.user) {
      const enrollment = await Enrollment.findOne({ student: req.user.id, course: course._id });
      isEnrolled = !!enrollment;
    }

    res.status(200).json({ success: true, course, lessons, isEnrolled });
  } catch (error) {
    next(error);
  }
};

// @POST /api/courses
exports.createCourse = async (req, res, next) => {
  try {
    const courseData = { ...req.body, teacher: req.user.id };
    if (req.file) courseData.thumbnail = req.file.path;

    const course = await Course.create(courseData);
    res.status(201).json({ success: true, course });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/courses/:id
exports.updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this course.' });
    }

    if (req.file) req.body.thumbnail = req.file.path;

    course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, course });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/courses/:id
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Course deleted.' });
  } catch (error) {
    next(error);
  }
};

// @POST /api/courses/:id/enroll
exports.enrollCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    if (!course.isPublished) return res.status(400).json({ success: false, message: 'Course is not currently available for enrollment.' });

    let existing = await Enrollment.findOne({ student: req.user.id, course: course._id });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'You are already enrolled in this course.',
        enrollment: existing,
        alreadyEnrolled: true,
      });
    }

    const {
      personalInfo = {},
      academicInfo = {},
      courseInfo = {},
      declarationConfirmed = true,
    } = req.body;

    // Generate unique verifiable enrollment ID
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const enrollmentId = `ENX-ENR-2026-${randomHex}`;

    const enrollment = await Enrollment.create({
      enrollmentId,
      student: req.user.id,
      course: course._id,
      personalInfo: {
        fullName: personalInfo.fullName || req.user.name,
        email: personalInfo.email || req.user.email,
        mobile: personalInfo.mobile || req.user.phone || '',
        profilePicture: personalInfo.profilePicture || req.user.avatar || '',
      },
      academicInfo: {
        college: academicInfo.college || req.user.college || 'Engineering Institute',
        degree: academicInfo.degree || req.user.degree || 'Bachelor of Technology',
        branch: academicInfo.branch || req.user.branch || 'Computer Science & Engineering',
        currentYear: academicInfo.currentYear || '3rd Year',
        currentSemester: academicInfo.currentSemester || (req.user.semester ? `Semester ${req.user.semester}` : 'Semester 5'),
        studentId: academicInfo.studentId || '',
      },
      courseInfo: {
        selectedCourse: course.title,
        courseCategory: course.category,
        learningLevel: courseInfo.learningLevel || course.level || 'beginner',
        learningGoal: courseInfo.learningGoal || 'Mastery and Certification',
        preferredLanguage: courseInfo.preferredLanguage || course.language || 'en',
      },
      declarationConfirmed: !!declarationConfirmed,
    });

    await Course.findByIdAndUpdate(course._id, { $inc: { enrollmentCount: 1 } });

    // Notify teacher
    if (course.teacher) {
      await Notification.create({
        recipient: course.teacher,
        sender: req.user.id,
        type: 'course_enrolled',
        title: 'New Student Enrolled',
        body: `${req.user.name} has enrolled in "${course.title}".`,
        link: `/teacher/courses/${course._id}`,
      }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: 'Course enrollment confirmed successfully!',
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/courses/:id/curriculum
exports.getCourseCurriculum = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name avatar college bio');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    const lessons = await Lesson.find({ course: course._id, isPublished: true })
      .sort('moduleIndex order');

    let completedLessonIds = [];
    let enrollment = null;
    if (req.user) {
      enrollment = await Enrollment.findOne({ student: req.user.id, course: course._id });
      if (enrollment) {
        completedLessonIds = (enrollment.completedLessons || []).map((id) => id.toString());
      }
    }

    // Build hierarchical module structure
    const moduleMap = new Map();

    lessons.forEach((lesson) => {
      const modIdx = lesson.moduleIndex || 1;
      const modTitle = lesson.moduleTitle || `Module ${modIdx}`;

      if (!moduleMap.has(modIdx)) {
        moduleMap.set(modIdx, {
          moduleIndex: modIdx,
          title: modTitle,
          topics: [],
        });
      }

      const isCompleted = completedLessonIds.includes(lesson._id.toString());
      moduleMap.get(modIdx).topics.push({
        _id: lesson._id,
        topicIndex: lesson.topicIndex || lesson.order || 1,
        title: lesson.title,
        description: lesson.description || '',
        completionTime: lesson.completionTime || 15,
        type: lesson.type,
        isFree: lesson.isFree,
        isCompleted,
      });
    });

    const modules = Array.from(moduleMap.values()).sort((a, b) => a.moduleIndex - b.moduleIndex);

    const totalTopics = lessons.length;
    const completedTopics = completedLessonIds.length;
    const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    res.status(200).json({
      success: true,
      course: {
        _id: course._id,
        title: course.title,
        category: course.category,
        level: course.level,
        duration: course.duration,
        instructor: course.teacher,
        instructorSource: course.instructorSource || 'EduNexa Academic Standards Board',
        thumbnail: course.thumbnail,
      },
      modules,
      stats: {
        totalModules: modules.length,
        totalTopics,
        completedTopics,
        progress,
        isEnrolled: !!enrollment,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/courses/:id/enrollment
exports.getEnrollmentDetails = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({ student: req.user.id, course: req.params.id })
      .populate('course');

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment record not found for this course.' });
    }

    res.status(200).json({
      success: true,
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/courses/:id/progress
exports.getCourseProgress = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({ student: req.user.id, course: req.params.id });
    if (!enrollment) return res.status(404).json({ success: false, message: 'Not enrolled.' });

    const totalLessons = await Lesson.countDocuments({ course: req.params.id, isPublished: true });
    const completed = enrollment.completedLessons.length;
    const progress = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

    enrollment.progress = progress;
    enrollment.isCompleted = progress === 100;
    if (progress === 100 && !enrollment.completedAt) enrollment.completedAt = new Date();
    await enrollment.save();

    res.status(200).json({ success: true, progress, completed, total: totalLessons, enrollment });
  } catch (error) {
    next(error);
  }
};

// @GET /api/courses/:id/lessons/:lessonId
exports.getLessonDetails = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    const lesson = await Lesson.findOne({ _id: req.params.lessonId, course: course._id });
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson topic not found.' });

    let isCompleted = false;
    let isEnrolled = false;
    if (req.user) {
      const enrollment = await Enrollment.findOne({ student: req.user.id, course: course._id });
      if (enrollment) {
        isEnrolled = true;
        isCompleted = (enrollment.completedLessons || []).some(
          (id) => id.toString() === lesson._id.toString()
        );
      }
    }

    // Find next and previous lessons for seamless navigation
    const allLessons = await Lesson.find({ course: course._id, isPublished: true })
      .select('_id title moduleIndex topicIndex order')
      .sort('moduleIndex order');

    const currentIndex = allLessons.findIndex((l) => l._id.toString() === lesson._id.toString());
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    res.status(200).json({
      success: true,
      lesson,
      course: {
        _id: course._id,
        title: course.title,
        category: course.category,
        level: course.level,
      },
      navigation: {
        prevLesson,
        nextLesson,
        currentIndex: currentIndex + 1,
        totalLessons: allLessons.length,
      },
      status: {
        isEnrolled,
        isCompleted,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/courses/:id/lessons/:lessonId/complete
exports.completeLesson = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({ student: req.user.id, course: req.params.id });
    if (!enrollment) return res.status(404).json({ success: false, message: 'Not enrolled.' });

    const lessonId = req.params.lessonId;
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }
    enrollment.lastAccessedAt = new Date();

    const totalLessons = await Lesson.countDocuments({ course: req.params.id, isPublished: true });
    enrollment.progress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);
    enrollment.isCompleted = enrollment.progress === 100;
    if (enrollment.isCompleted && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
    }

    await enrollment.save();

    res.status(200).json({ success: true, progress: enrollment.progress, enrollment });
  } catch (error) {
    next(error);
  }
};

// @GET /api/courses/teacher/my-courses
exports.getTeacherCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ teacher: req.user.id }).sort('-createdAt');
    res.status(200).json({ success: true, courses });
  } catch (error) {
    next(error);
  }
};

// @GET /api/courses/student/enrolled
exports.getEnrolledCourses = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user.id })
      .populate({ path: 'course', populate: { path: 'teacher', select: 'name avatar' } })
      .sort('-lastAccessedAt');

    res.status(200).json({ success: true, enrollments });
  } catch (error) {
    next(error);
  }
};

