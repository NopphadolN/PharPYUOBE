import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import AdminMenu from '../../components/AdminMenu';
import { Fragment } from 'react';

export default function AdminPLOPage() {

  const [year, setYear] = useState('');
  const [students, setStudents] = useState([]);
  const [plos, setPlos] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [courseResults, setCourseResults] = useState([]);
  const [manual, setManual] = useState({});

  /* ================= LOAD ================= */
  useEffect(() => {
    (async () => {
      const stu = await api.get('/student/all');
      const plo = await api.get('/plos');
      const map = await api.get('/mapping');
      const course = await api.get('/instructor/course-results');

      setStudents(stu.data);
      setPlos(plo.data);
      setMappings(map.data);
      setCourseResults(course.data);
    })();
  }, []);

  /* ✅ load manual */
  useEffect(() => {
    if (!year) return;

    (async () => {
      const res = await api.get('/admin/plo-manual', {
        params: { year }
      });

      const map = {};
      res.data.forEach(r => {
        if (!map[r.student_id]) map[r.student_id] = {};
        map[r.student_id][r.indicator_id] = r.is_pass;
      });

      setManual(map);
    })();

  }, [year]);

  /* ================= FILTER ================= */
  const filteredStudents = year
    ? students.filter(st =>
        String(st.user_code).startsWith(year.slice(-2))
      )
    : [];

  /* ================= LOGIC ================= */

  const checkStudentPassCourse = (studentId, courseId) => {
    return courseResults.some(r =>
      r.student_id === studentId &&
      r.course_id === courseId &&
      r.is_pass === true
    );
  };

  const getIndicatorPercent = (studentId, indicatorCode) => {
    const mappedCourses = mappings.filter(m =>
      String(m.indicator_code) === String(indicatorCode)
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

  /* ================= SAVE ================= */
  const handleSave = async () => {
    await api.post('/admin/plo-manual', {
      year,
      data: manual
    });

    alert('✅ saved');
  };

  /* ================= UI ================= */
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminMenu />
    <div className="p-6 space-y-6">

      {/* YEAR */}
      <Card>
        <Select value={year} onChange={e => setYear(e.target.value)}>
          <option value="">เลือกปี</option>
          {[2568,2569,2570,2571,2572,2573].map(y => (
            <option key={y}>{y}</option>
          ))}
        </Select>
      </Card>

      {/* TABLE */}
      <Card>
        <h3 className="font-semibold mb-3">PLO Manual Assessment</h3>

        {!year && (
          <div className="text-gray-400">กรุณาเลือกปี</div>
        )}

        {year && (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm border">

              {/* HEADER */}
<thead className="bg-gray-100 text-gray-700">

  {/* ✅ ROW 1: PLO GROUP */}
  <tr>
    <th rowSpan="2" className="border px-3 py-2">รหัส</th>
    <th rowSpan="2" className="border px-3 py-2">ชื่อ</th>
{plos.map(plo => (
  <th
    key={plo.id}
    colSpan={plo.indicators.length + 1} // ✅ +1 เพราะมี avg
    className="border text-center bg-blue-50"
  >
    {plo.code}
  </th>
))}
  </tr>

  {/* ✅ ROW 2: indicators */}
  <tr>
{plos.map(plo => (
  <Fragment key={plo.id}>
    {plo.indicators.map(ind => (
      <th key={ind.id} className="border text-xs">
        {ind.code}
      </th>
    ))}

    {/* ✅ avg */}
    <th className="border text-xs text-green-600">
      avg
    </th>
  </Fragment>
))}
  </tr>
</thead>

              {/* BODY */}
<tbody>
  {filteredStudents.map(st => (

    <tr key={st.id} className="border-t">

      <td className="border px-2">{st.user_code}</td>
      <td className="border px-2">{st.name_th}</td>

      {/* ✅ LOOP PLO */}
      {plos.map(plo => {

        let ploValues = [];

        return (
          <Fragment key={plo.id}>

            {/* ✅ indicator ของ PLO นี้ */}
            {plo.indicators.map(ind => {

              const percent = getIndicatorPercent(st.id, ind.code);

              const hasMapping = mappings.some(m =>
                String(m.indicator_code) === String(ind.code)
              );

              let val;

              if (hasMapping && percent !== null) {
                val = percent;
              } else {
                val = manual?.[st.id]?.[ind.id] ? 100 : 0;
              }

              ploValues.push(val);

              return (
                <td
                  key={ind.id}
                  className="border text-center px-2"
                >
                  {hasMapping
                    ? val.toFixed(2) + '%'
                    : (
                      <input
                        type="checkbox"
                        checked={val === 100}
                        onChange={(e) => {
                          setManual({
                            ...manual,
                            [st.id]: {
                              ...manual[st.id],
                              [ind.id]: e.target.checked
                            }
                          });
                        }}
                      />
                    )
                  }
                </td>
              );
            })}

            {/* ✅ ✅ ✅ AVG ของ PLO นี้ */}
            <td className="border text-center font-semibold text-green-600">
              {
                ploValues.length > 0
                  ? (
                      ploValues.reduce((a,b)=>a+b,0) /
                      ploValues.length
                    ).toFixed(2) + '%'
                  : '0%'
              }
            </td>

          </Fragment>
        );
      })}

    </tr>

  ))}
</tbody>

            </table>
          </div>
        )}
      </Card>

      {/* SAVE */}
      {year && (
        <Button onClick={handleSave}>
          💾 Save
        </Button>
      )}

    </div>
    </div>
  );
}