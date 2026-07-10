const repo = require('../repositories/instructor.repo');

exports.getCourses = async () => {
  return await repo.getCourses();
};

exports.getUsers = async () => {
  return await repo.getUsers();
};

exports.getMe = async (userId) => {
  return await repo.getMe(userId);
};

exports.getStudents = async (courseInstanceId) => {
  return await repo.getStudents(courseInstanceId);
};

exports.getDashboard = async (user) => {
  const userId = user.id;
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = month >= 6
    ? now.getFullYear()
    : now.getFullYear() - 1;
  return await repo.getDashboard(userId, year);
};

exports.getDashboardByTerm = async ({ year, semester }, user) => {
  if (!year || !semester) {
    return [];
  }
  return await repo.getDashboardByTerm(year, semester, user.id);
};

exports.getDashboardFull = async ({ year, semester }, user) => {
  if (!year || !semester) {
    return {
      teaching: [],
      responsible: []
    };
  }
  return await repo.getDashboardFull(year, semester, user.id);
};

// ================= GET CLO =================
exports.getClos = async (course_instance_id) => {
  return await repo.getClos(course_instance_id);
};

// ================= SAVE CLO =================
exports.saveClos = async (course_instance_id, clos, userId) => {
  const ownerId = await repo.getOwner(course_instance_id);
  const user = await repo.getUserById(userId);
  const canEditAll =
    user?.can_edit_all_courses === true;
  if (
    !canEditAll &&
    (!ownerId || ownerId !== userId)
  ) {
    throw new Error("No permission");
  }
  await repo.upsertClos(course_instance_id, clos);
};

// ================= GET Evaluations =================
exports.getEvaluations = async (course_instance_id) => {
  return await repo.getEvaluations(course_instance_id);
};

// ================= SAVE Evaluations =================
exports.saveEvaluations = async (
  course_instance_id,
  evaluations,
  userId
) => {
  const ownerId = await repo.getOwner(course_instance_id);
  const user = await repo.getUserById(userId);
  const canEditAll =
    user?.can_edit_all_courses === true;
  if (
    !canEditAll &&
    (!ownerId || ownerId !== userId)
  ) {
    throw new Error("No permission");
  }
  await repo.upsertEvaluations(
    course_instance_id,
    evaluations
  );
};

// ================= SAVE CloScores =================
exports.saveCloScores = async (course_instance_id, scores) => {
  await repo.saveCloScores(course_instance_id, scores);
};

// ================= LOAD CloScores =================
exports.getCloScores = async (course_instance_id) => {
  return await repo.getCloScores(course_instance_id);
};

// ================= SAVE Instance =================
exports.saveInstance = async (data, userId) => {
  return await repo.upsertInstance(data, userId);
};

// ================= GET Instructors =================
exports.getInstructors = async (course_instance_id) => {
  return await repo.getInstructors(course_instance_id);
};

// ================= SAVE Instructors =================
exports.saveInstructors = async (course_instance_id, instructors) => {
  await repo.upsertInstructors(course_instance_id, instructors);
};

// ================= SAVE Contents =================
exports.saveContents = async (course_instance_id, contents) => {
  await repo.upsertContents(course_instance_id, contents);
};