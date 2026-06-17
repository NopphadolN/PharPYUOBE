import { useState, useEffect } from 'react';
import api from '../../services/api';
import InstructorMenu from '../../components/InstructorMenu';
import { Radar } from 'react-chartjs-2';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function ReportPage() {

  const [students, setStudents] = useState([]);
  const [plos, setPlos] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [cloResults, setCloResults] = useState([]);
  const [courseResults, setCourseResults] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [clos, setClos] = useState([]);

  /* ================= LOAD ================= */
useEffect(() => {
  (async () => {
    try {

      const stuRes = await api.get('/student/all');
      const ploRes = await api.get('/plos');
      const mapRes = await api.get('/mapping');
      
      let cloRes = { data: [] };
      let courseRes = { data: [] };

      try {
        cloRes = await api.get('/instructor/clo-results');
      } catch (e) {
        console.log("CLO error", e.message);
      }

      try {
        courseRes = await api.get('/instructor/course-results');
      } catch (e) {
        console.log("COURSE error", e.message);
      }


      // ✅ สำคัญ: set ก่อน แม้ API อื่นพัง
      setStudents(stuRes.data);
      setPlos(ploRes.data);
      setMappings(mapRes.data);
      setCloResults(cloRes.data);
      setCourseResults(courseRes.data);

    } catch (err) {
      console.log("MAIN ERROR:", err.message);
    }
  })();
}, []);

useEffect(() => {
  if (!selectedCourse) return;
  const instanceId = getInstanceFromCourse(selectedCourse);
  if (!instanceId) {
    console.log("❌ instance not found");
    return;
  }
  (async () => {
    try {
      const res = await api.get('/instructor/clos', {
        params: {
          course_instance_id: instanceId
        }
      });
      setClos(res.data);
    } catch (err) {
      console.log("CLO LOAD ERROR:", err.message);
    }
  })();
}, [selectedCourse]);

  /* ================= PASS COURSE ================= */
  const checkStudentPassCourse = (studentId, courseId) => {
    return courseResults.some(r =>
      String(r.student_id) === String(studentId) &&
      String(r.course_id) === String(courseId) &&
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
  const values = plo.indicators.map(ind => {
    const val = getIndicatorPercent(studentId, ind.code);
    return val !== null ? val : 0;   // ✅ เอาทุก indicator
  });
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

  /* ================= COURSES ================= */
  const getCoursesOfStudent = (studentId) => {

    return courseResults
      .filter(r => String(r.student_id) === String(studentId))
      .map(r => r.course_id)
      .filter((v, i, arr) => arr.indexOf(v) === i);
  };

  /* ================= CLO LIST ================= */
const getClosByCourse = (courseId) => {
  return [...new Set(
    cloResults
      .filter(r => String(r.course_id) === String(courseId))
      .map(r => r.clo_code)
  )];
};

  /* ================= CLO % ================= */
const getStudentCLOPercent = (studentId, courseId, cloCode) => {
  const result = cloResults.find(r =>
    String(r.student_id) === String(studentId) &&
    String(r.course_id) === String(courseId) &&
    String(r.clo_code) === String(cloCode)
  );
  return Number(result?.percent ?? 0);
};

  /* ================= PLO CHART ================= */
const ploChartData = selectedStudent ? {
  labels: plos.map(p => p.code),
  datasets: [{
    label: 'PLO %',
    data: plos.map(p => {
      const val = getPloAvg(selectedStudent.id, p);
      return Number((val ?? 0).toFixed(2));
    }),
    backgroundColor: 'rgba(0, 204, 255, 0.2)',
    borderColor: '#00bbff'
  }]
} : null;
  /* ================= CLO CHART ================= */
  const cloList = selectedCourse
    ? getClosByCourse(selectedCourse)
    : [];
const isStudentCLOPass = (studentId, courseId, cloCode) => {
  const result = cloResults.find(r =>
    String(r.student_id) === String(studentId) &&
    String(r.course_id) === String(courseId) &&
    String(r.clo_code) === String(cloCode)
  );
  return result?.is_pass ?? false;
};
const cloChartData = selectedCourse ? {
  labels: cloList,
  datasets: [{
    label: 'CLO %',
    data: cloList.map(c => {
      const val = getStudentCLOPercent(
        selectedStudent.id,
        selectedCourse,
        c
      );
      return Number((val ?? 0).toFixed(2));
    }),

    backgroundColor: 'rgba(168, 230, 207, 0.2)',
    borderColor: '#A8E6CF',

    // ✅ ใช้ is_pass ตัดสินสี
    pointBackgroundColor: cloList.map(c => {
      const pass = isStudentCLOPass(
        selectedStudent.id,
        selectedCourse,
        c
      );
      return pass ? '#5af4bb' : '#ff6f61'; // coral red
    }),

    pointBorderColor: cloList.map(c => {
      const pass = isStudentCLOPass(
        selectedStudent.id,
        selectedCourse,
        c
      );
      return pass ? '#5af4bb' : '#cc0000';
    }),

    pointRadius: 6
  }]
} : null;

const radarOptions = {
  scales: {
    r: {
      min: 0,
      max: 100,
      ticks: { stepSize: 20 }
    }
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.label}: ${ctx.raw}%`
      }
    },
    legend: {
      display: true
    }
  }
};

const getCourseInfo = (courseId) => {
  const m = mappings.find(m =>
    String(m.course_id) === String(courseId)
  );
  return m
    ? `${m.code_en} - ${m.name_th}`
    : `Course ${courseId}`;
};

const getInstanceFromCourse = (courseId) => {
  const r = cloResults.find(r =>
    String(r.course_id) === String(courseId)
  );
  return r?.course_instance_id;
};

  /* ================= UI ================= */
  return (
<div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-white">
  <InstructorMenu />
  <div className="flex-1 p-6 space-y-6">    
    {/* HEADER */}
    <div className="bg-white rounded-2xl shadow p-5">
      <h2 className="text-xl font-bold">
        📊 รายงานผลการเรียนรู้นักศึกษา
      </h2>
    </div>

        {/* SEARCH */}
<Card>
  <h3 className="font-semibold mb-3">ค้นหานักศึกษา</h3>

  <div className="relative w-80">

    <Input
      placeholder="ค้นหารหัสนักศึกษา..."
      value={search}
      onChange={e => setSearch(e.target.value)}
    />

    {search && (
      <div className="absolute w-full bg-white border rounded-lg shadow mt-1 z-10">

        {students
          .filter(st => st.user_code.includes(search))
          .map(st => (
            <div
              key={st.id}
              onClick={() => {
                setSelectedStudent(st);
                setSearch('');
                setSelectedCourse(null);
              }}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {st.user_code} - {st.name_th}
            </div>
        ))}

      </div>
    )}

  </div>
</Card>

          {/* PLO CHART */}
{selectedStudent && (
  <Card>
    <h3 className="text-lg font-semibold">
      {selectedStudent.user_code} - {selectedStudent.name_th}
    </h3>
  </Card>
)}

{selectedStudent && (
  <Card>

    <div className="flex gap-6 flex-wrap h-auto">

      {/* ✅ LEFT: CHART */}
      <div className="w-full max-w-md">
        <h4 className="font-medium mb-2">PLO Achievement</h4>
        <Radar data={ploChartData} options={radarOptions} />
      </div>

      {/* ✅ RIGHT: LIST */}
      <div className="flex-1 space-y-2">

        {plos
          .sort((a, b) => a.code.localeCompare(b.code))
          .map(p => (
            <div
              key={p.code}
              className="bg-gray-50 p-3 rounded-lg border"
            >
              <div className="text-sm text-gray-600">
                <b>{p.code}</b>-{p.description ?? p.name_th}
              </div>
            </div>
        ))}

      </div>

    </div>

  </Card>
)}

{selectedStudent && (
  <Card>
    <h4 className="font-semibold mb-3">รายวิชา</h4>

    <div className="flex flex-wrap gap-2">

      {getCoursesOfStudent(selectedStudent.id).map(c => (
        <button
          key={c}
          onClick={() => setSelectedCourse(c)}
          className="px-3 py-1 border rounded-lg hover:bg-blue-50"
        >
          {getCourseInfo(c)}
        </button>
      ))}

    </div>
  </Card>
)}

{selectedCourse && (
  <Card>
    <div className="flex gap-6 flex-wrap h-auto">

      {/* ✅ LEFT: CHART */}
      <div className="w-full max-w-md">
        <h4 className="font-medium mb-2">
          CLO ({getCourseInfo(selectedCourse)})
        </h4>
        <Radar data={cloChartData} options={radarOptions} />
      </div>

      {/* ✅ RIGHT: CLO LIST */}
      <div className="flex-1 space-y-2">
        {clos.length > 0 ? (
          clos
            .sort((a, b) => a.code.localeCompare(b.code))
            .map(clo => (
              <div
                key={clo.id}
                className="bg-gray-50 p-3 rounded-lg border"
              >
                <div className="font-semibold text-blue-600">
                  {clo.code}
                </div>

                <div className="text-sm mb-2">
                  {clo.description}
                </div>

                <div className="text-xs text-gray-600">
                  <b>ตัวชี้วัด</b>

                  {clo.indicators.length > 0 ? (
                    <ul className="list-disc ml-4 mt-1">
                      {clo.indicators.map((ind, i) => (
                        <li key={i}>
                          {ind.description} (target {ind.target}%)
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-400">
                      ไม่มีตัวชี้วัด
                    </div>
                  )}

                </div>
              </div>
        ))
        ) : (
          <div>ไม่มีข้อมูล CLO</div>
        )}
      </div>
    </div>
  </Card>
)}
    </div>
  </div>
)}