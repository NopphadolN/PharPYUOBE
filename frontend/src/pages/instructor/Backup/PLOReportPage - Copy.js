import { useState, useEffect } from 'react';
import api from '../../services/api';
import InstructorMenu from '../../components/InstructorMenu';

export default function PLOPage() {

  const [year, setYear] = useState('');
  const [students, setStudents] = useState([]);
  const [plos, setPlos] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [manualChecks, setManualChecks] = useState({});
  const [cloResults, setCloResults] = useState([]);
  const [courseResults, setCourseResults] = useState([]);

  /* ================= LOAD DATA ================= */
useEffect(() => {

  (async () => {
    try {
      const stuRes = await api.get('/student/all');
      const ploRes = await api.get('/plos');
      const mapRes = await api.get('/mapping');
      const cloRes = await api.get('/instructor/clo-results');
      const courseRes = await api.get('/instructor/course-results');

      console.log("API STU:", stuRes.data);
      console.log("API PLO:", ploRes.data);
      console.log("API MAP:", mapRes.data);
      console.log("API CLO:", cloRes.data);
      console.log("API COURSE:", courseRes.data);

      setStudents(stuRes.data);
      setPlos(ploRes.data);
      setMappings(mapRes.data);
      setCloResults(cloRes.data);
      setCourseResults(courseRes.data);

    } catch (err) {
      console.log("ERROR:", err.response?.data || err.message);
    }
  })();
}, []);

useEffect(() => {
  console.log("✅ students updated:", students);
}, [students]);

useEffect(() => {
  console.log("✅ cloResults updated:", cloResults);
}, [cloResults]);

  /* ================= FILTER ================= */
  const filteredStudents = students.filter(st =>
    year && String(st.user_code).startsWith(year.slice(-2))
  );
  /* ================= CHECK PASS COURSE ================= */
  const checkStudentPassCourse = (studentId, courseId) => {
  return courseResults.some(r =>
    r.student_id === studentId &&
    r.course_id === courseId &&
    r.is_pass === true
  );
};

  /* ================= INDICATOR % ================= */
const getIndicatorPercent = (studentId, indicatorCode) => {
  const mappedCourses = mappings.filter(m =>
    String(m.indicator_code).toLowerCase() === String(indicatorCode).toLowerCase()
  );
  if (mappedCourses.length === 0) return null;
  let pass = 0;
  mappedCourses.forEach(m => {
    if (checkStudentPassCourse(studentId, m.course_id)) {
      pass++;
    }
  });
  return (pass / mappedCourses.length) * 100;
};

  /* ================= PLO AVG ================= */
const getPloAvg = (studentId, plo) => {
  const values = [];
  plo.indicators.forEach(ind => {
    let val = getIndicatorPercent(studentId, ind.code);
    // ✅ ไม่มี mapping → ใช้ manual
    if (val === null) {
      val = manualChecks?.[studentId]?.[ind.id] ? 100 : 0;
    }
    values.push(val);
  });
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

  /* ================= SAVE ================= */
  const handleSave = async () => {
    await api.post('/instructor/plo-result', {
      year,
      data: manualChecks
    });
    alert('✅ บันทึกแล้ว');
  };  

  /* ================= UI ================= */
  return (
    <div>
      <InstructorMenu />
      <div style={{ padding: 20 }}>
        <h2>📊 PLO Assessment</h2>

        {/* ✅ ปี */}
        <select
          value={year}
          style={{ height: 30, width: 80 }}
          onChange={e => setYear(e.target.value)}
        >
          <option value="">เลือกรหัส</option>
          <option>2568</option>
          <option>2569</option>
          <option>2570</option>
          <option>2571</option>
          <option>2572</option>
          <option>2573</option>
        </select>
        <hr />

        <table border="1" cellPadding="5">
          <thead>
            {/* HEADER 1 */}
            <tr>
              <th rowSpan="2">รหัสนักศึกษา</th>
              <th rowSpan="2">ชื่อ-สกุล</th>
              {plos.map(plo => (
                <th key={plo.id} colSpan={plo.indicators.length + 1}>
                  {plo.code}
                </th>
              ))}
            </tr>
            {/* HEADER 2 */}
            <tr>
              {plos.map(plo => (
                <>
                  {plo.indicators.map(ind => (
                    <th key={ind.id}>
                      {ind.code || ind.id}
                    </th>
                  ))}
                  <th>avg</th>
                </>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(st => (
              <tr key={st.id}>
                <td>{st.user_code}</td>
                <td>{st.name_th}</td>
                {plos.map(plo => {
                  const avg = getPloAvg(st.id, plo);
                  return (
                    <>
                      {plo.indicators.map(ind => {
                        console.log("indicator:", ind);
                        const percent = getIndicatorPercent(st.id, ind.code);

                        // ✅ ไม่มี mapping → checkbox
                        if (percent === null) {
                          return (
                            <td key={ind.id}>
                              <input
                                type="checkbox"
                                checked={manualChecks?.[st.id]?.[ind.id] || false}
                                onChange={(e) => {
                                  setManualChecks({
                                    ...manualChecks,
                                    [st.id]: {
                                      ...manualChecks[st.id],
                                      [ind.id]: e.target.checked
                                    }
                                  });
                                }}
                              />
                            </td>
                          );
                        }
                        return (
                          <td key={ind.id}>
                            {percent.toFixed(2)}%
                          </td>
                        );
                      })}
                      {/* ✅ AVG */}
                      <td style={{
                        color: avg === 100 ? 'green' : 'red',
                        fontWeight: 'bold'
                      }}>
                        {avg.toFixed(2)}%
                      </td>
                    </>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <br />

        <button onClick={handleSave}>
          💾 บันทึก
        </button>

      </div>
    </div>
  );

}