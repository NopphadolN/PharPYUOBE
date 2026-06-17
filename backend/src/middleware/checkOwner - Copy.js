const db = require('../db');

const checkOwner = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const courseId =
      req.params.courseId ||
      req.body.courseId ||
      req.query.courseId;

    if (!courseId) {
      return res.status(400).json({ message: 'courseId required' });
    }

    const [rows] = await db.query(
      'SELECT owner_id FROM course_instance WHERE id = ?',
      [courseId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const course = rows[0];

    // ✅ ถ้ายังไม่มี owner → ห้ามทุก action
    if (!course.owner_id) {
      return res.status(403).json({
        message: 'Course has no owner yet. Please assign in Step2'
      });
    }

    if (course.owner_id !== userId) {
      return res.status(403).json({
        message: 'You are not course owner'
      });
    }

    req.course = course;
    next();

  } catch (err) {
    next(err);
  }
};

module.exports = checkOwner;