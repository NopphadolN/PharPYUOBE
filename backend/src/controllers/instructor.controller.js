const service = require('../services/instructor.service');
const repo = require('../repositories/instructor.repo');
const pool = require('../db'); 

exports.getCourses = async (req, res) => {
  try {
    const data = await service.getCourses();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Load courses error');
  }
};

exports.getUsers = async (req, res) => {
  try {
    const data = await service.getUsers();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Load users error');
  }
};

exports.getMe = async (req, res) => {
  try {
    const data = await service.getMe(req.user.id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('User error');
  }
};

exports.getStudents = async (req, res) => {
  try {
    const { course_instance_id } = req.query;
    const data = await service.getStudents(course_instance_id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Load students error');
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const data = await service.getDashboard(req.user);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Dashboard error');
  }
};

exports.getDashboardByTerm = async (req, res) => {
  try {
    const data = await service.getDashboardByTerm(req.query, req.user);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
};

exports.getDashboardFull = async (req, res) => {
  try {
    const data = await service.getDashboardFull(req.query, req.user);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('dashboard error');
  }
};

// ================= GET CLO =================
exports.getClos = async (req, res) => {
  try {
    const data = await service.getClos(req.query.course_instance_id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading CLO');
  }
};

// ================= SAVE CLO =================
exports.saveClos = async (req, res) => {
  try {
    const { course_instance_id, clos } = req.body;
    await service.saveClos(
      course_instance_id,
      clos,
      req.user.id
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('save clo error');
  }
};

// ================= GET EVALUATIONS =================
exports.getEvaluations = async (req, res) => {
  try {
    const data = await service.getEvaluations(req.query.course_instance_id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('load evaluations error');
  }
};

// ================= SAVE EVALUATIONS =================
exports.saveEvaluations = async (req, res) => {
  try {
    const { course_instance_id, evaluations } = req.body;
    await service.saveEvaluations(
      course_instance_id,
      evaluations,
      req.user.id
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('save evaluations error');
  }
};

// ================= SAVE CloScores =================
exports.saveCloScores = async (req, res) => {
  try {
    console.log('START SAVE');
    const { course_instance_id, scores } = req.body;
    await service.saveCloScores(
      course_instance_id,
      scores
    );
    console.log('DONE SAVE');
    return res.json({ ok: true });
  } catch (err) {
    console.error('ERROR OCCURRED:', err);
    res.status(500).send('save error');
  }
};

// ================= LOAD CloScores =================
exports.getCloScores = async (req, res) => {
  try {
    const data = await service.getCloScores(
      req.query.course_instance_id
    );
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('load error');
  }
};

// ================= SAVE Instance =================
exports.saveInstance = async (req, res) => {
  try {
    const instanceId = await service.saveInstance(
      req.body,
      req.user.id
    );
    return res.json({ id: instanceId });
  } catch (err) {
    console.error(err);
    res.status(500).send('save instance error');
  }
};

// ================= GET Instance =================
exports.getInstance = async (req, res) => {
  try {
    const { course_id, year, semester } = req.query;

    // ✅ 1. instance
    const instanceRes = await pool.query(`
      SELECT * FROM course_instances
      WHERE course_id=$1 AND year=$2 AND semester=$3
    `, [course_id, year, semester]);

    if (instanceRes.rows.length === 0) {
      return res.json(null);
    }

    const instance = instanceRes.rows[0];
    const instanceId = instance.id;

    // ✅ 2. instructors
    const instructors = await repo.getInstructors(instanceId);

    // ✅ 3. contents
    const contentRes = await pool.query(`
      SELECT
  id,
  course_instance_id,
  type,
  TO_CHAR(date, 'YYYY-MM-DD') AS date, 
  topic,
  hours,
  instructor_id,
  guest_teacher_name,
  "order",
  exam_score,
  work_score,
  clo_ids
      FROM course_contents
      WHERE course_instance_id=$1
      ORDER BY "order"
    `, [instanceId]);

    const contents = contentRes.rows.map(c => ({
      ...c,
      clo_ids: typeof c.clo_ids === 'string'
        ? JSON.parse(c.clo_ids)
        : (c.clo_ids || [])
    }));

    // ✅ 4. evaluations (ใช้ function ที่คุณมี!)
    const evaluations = await repo.getEvaluations(instanceId);

    // ✅ 5. owner
    let owner = null;
    if (instance.owner_id) {
      const userRes = await pool.query(`
        SELECT id, name_th FROM users WHERE id=$1
      `, [instance.owner_id]);
      owner = userRes.rows[0];
    }

    // ✅ ✅ ✅ FINAL RESPONSE
    res.json({
      ...instance,

      instructors,
      contents,
      evaluations,
      owner,

      // ✅ parse JSON fields
      guestTeachers: typeof instance.guest_teachers === 'string'
        ? JSON.parse(instance.guest_teachers)
        : (instance.guest_teachers || []),

      books: typeof instance.books === 'string'
        ? JSON.parse(instance.books)
        : (instance.books || []),

      grading: typeof instance.grading === 'string'
        ? JSON.parse(instance.grading)
        : (instance.grading || [])
    });

  } catch (err) {
    console.error("GET INSTANCE ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
};

// ================= GET Instructors =================
exports.getInstructors = async (req, res) => {
  try {
    const data = await service.getInstructors(req.query.course_instance_id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('load instructors error');
  }
};

// ================= SAVE Instructors =================
exports.saveInstructors = async (req, res) => {
  try {
    const { course_instance_id, instructors } = req.body;
    await service.saveInstructors(course_instance_id, instructors);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('save instructors error');
  }
};

exports.saveContents = async (req, res) => {
  try {
    const { course_instance_id, contents } = req.body;
    await service.saveContents(course_instance_id, contents);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('save contents error');
  }
};