const pool = require('../db');

async function recalculateStudent(
  courseInstanceId,
  studentId
) {

  const client = await pool.connect();

  try {

    await client.query('BEGIN');

    const cloRes = await client.query(`
  SELECT
    c.id,
    c.course_instance_id,
    ci.course_id
  FROM clos c
  JOIN course_instances ci
    ON ci.id = c.course_instance_id
  WHERE c.course_instance_id = $1
`, [courseInstanceId]);

    for(const clo of cloRes.rows){

      const indRes = await client.query(`
        SELECT
          ci.id,
          ci.target,
          cis.percent
        FROM clo_indicators ci
        LEFT JOIN clo_indicator_scores cis
          ON cis.indicator_id = ci.id
          AND cis.student_id = $1
        WHERE ci.clo_id = $2
      `,[studentId, clo.id]);

      const indicators = indRes.rows;

      const passedIndicators =
        indicators.filter(i =>
          Number(i.percent||0) >= Number(i.target||50)
        ).length;

      const totalIndicators = indicators.length;

      const avg = indicators.length
        ?
        indicators.reduce
        ((sum,i)=>sum+Number(i.percent||0),0) / indicators.length:0;

      const cloPass = passedIndicators === totalIndicators;
      await client.query(`
        INSERT INTO clo_results
        (
          course_instance_id,
          student_id,
          course_id,
          clo_id,
          percent,
          is_pass,
          passed_indicators,
          total_indicators
        )
        VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8)

        ON CONFLICT
        (
          course_instance_id,
          student_id,
          clo_id
        )

        DO UPDATE SET
          percent = EXCLUDED.percent,
          is_pass = EXCLUDED.is_pass,
          passed_indicators = EXCLUDED.passed_indicators,
          total_indicators = EXCLUDED.total_indicators
      `,
      [
        courseInstanceId,
        studentId,
        clo.course_id,
        clo.id,
        avg,
        cloPass,
        passedIndicators,
        totalIndicators
      ]);
    }

    // COURSE RESULT
    const cloResultRes = await client.query(`
        SELECT *
        FROM clo_results
        WHERE
          course_instance_id = $1
          AND student_id = $2
      `,
      [
        courseInstanceId,
        studentId
      ]);
    const passedClos = cloResultRes.rows.filter(
        r => r.is_pass
      ).length;
    const totalClos = cloResultRes.rows.length;
    const coursePass = totalClos > 0 && passedClos === totalClos;
    await client.query(`
      UPDATE course_results
      SET
        is_pass = $1,
        passed_clos = $2,
        total_clos = $3
      WHERE
        course_instance_id = $4
        AND student_id = $5
    `,
    [
      coursePass,
      passedClos,
      totalClos,
      courseInstanceId,
      studentId
    ]);

    await client.query('COMMIT');

  } catch(err){

    await client.query('ROLLBACK');
    throw err;

  } finally{
    client.release();
  }
}

module.exports = {
  recalculateStudent
};