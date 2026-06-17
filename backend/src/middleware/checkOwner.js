const pool = require('../db');

module.exports = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const courseId =
      req.body.course_instance_id ||
      req.query.course_instance_id ||
      req.params.id;

    if (!courseId) {
      return res.status(400).json({ error: "course_instance_id required" });
    }

    const result = await pool.query(
      `SELECT owner_id FROM course_instances WHERE id = $1`,
      [courseId]
    );

    const ownerId = result.rows[0]?.owner_id;

    if (ownerId && ownerId !== userId) {
      return res.status(403).json({ error: "not owner" });
    }

    next();

  } catch (err) {
    console.error(err);
    res.status(500).send("owner check error");
  }
};