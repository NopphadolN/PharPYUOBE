import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import InstructorMenu from '../../components/InstructorMenu';
import { Radar } from 'react-chartjs-2';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';


import { Bar } from 'react-chartjs-2';

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  BarElement,
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
  const [courses, setCourses] = useState([]);
  const [clos, setClos] = useState([]);
  const [courseYear, setCourseYear] = useState('');
  const [courseSemester, setCourseSemester] = useState('');
  const [yloResults, setYloResults] = useState([]);
  const [indicatorScores, setIndicatorScores] = useState([]);

  /* ================= LOAD ================= */
useEffect(() => {
  (async () => {
    try {
      const stuRes = await api.get('/student/all');
      const ploRes = await api.get('/plos');
      const mapRes = await api.get('/mapping');
    
let cloRes = { data: [] };
let courseResultRes = { data: [] };
let courseMasterRes = { data: [] };
let indicatorRes = { data: [] };

try {
  cloRes = await api.get('/instructor/clo-results');
} catch (e) {
  console.log("CLO error", e.message);
}
try {
  courseResultRes = await api.get('/instructor/course-results');
} catch (e) {
  console.log("COURSE RESULT error", e.message);
}
try {
  courseMasterRes = await api.get('/instructor/courses');
} catch (e) {
  console.log("COURSE MASTER error", e.message);
}
try {
  indicatorRes = await api.get('/instructor/clo-indicator-scores-all');
} catch(e){
  console.log('INDICATOR ERROR', e.message);
}

      // ✅ สำคัญ: set ก่อน แม้ API อื่นพัง
      setStudents(stuRes.data);
      setPlos(ploRes.data);
      setMappings(mapRes.data);
      setCloResults(cloRes.data);
      setCourseResults(courseResultRes.data);
      setCourses(courseMasterRes.data);
      setIndicatorScores(indicatorRes.data);

    } catch (err) {
      console.log("MAIN ERROR:", err.message);
    }
  })();
}, []);

const getInstanceFromCourse = useCallback((courseId) => {
  const r = cloResults.find(r =>
    String(r.course_id) === String(courseId)
  );
  return r?.course_instance_id;
}, [cloResults]);

useEffect(() => {
  const currentYear = new Date().getFullYear() + 543;
  setCourseYear(String(currentYear));
}, []);

useEffect(() => {
  setSelectedCourse(null);
}, [courseYear, courseSemester]);

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
}, [selectedCourse, getInstanceFromCourse]);

useEffect(() => {
  if (!selectedStudent) return;
  api.get('/admin/ylo-results', {
    params: {
      student_id: selectedStudent.id
    }
  })
  .then(res => setYloResults(res.data))
  .catch(err => console.log(err.message));
}, [selectedStudent]);

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
    .filter(r =>
      String(r.student_id) === String(studentId) &&
      (!courseYear || String(r.year) === courseYear) &&
      (!courseSemester || String(r.semester) === courseSemester)
    )
    .map(r => r.course_id)
    .filter((v, i, arr) => arr.indexOf(v) === i);
};

const getStudentIndicatorPercent = (studentId, indicatorId) => {
  const rows = indicatorScores.filter(r =>
    String(r.student_id) === String(studentId) &&
    String(r.indicator_id) === String(indicatorId)
    );
  if (!rows.length) {
    return 0;
  }
  const totalScore = rows.reduce((sum,row) => sum + Number(row.score || 0), 0);
  const totalFull = rows.reduce((sum,row) => sum + Number(row.full_score || 0), 0);
  if (totalFull === 0) {
    return 0;
  }
  return (totalScore / totalFull) * 100;
};

  /* ================= CLO % ================= */

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
const indicatorBarData = selectedCourse? {
labels:
  clos.flatMap(clo =>
    (clo.indicators || [])
      .map(
        (ind,idx) => [
          clo.code,
          `ID${idx + 1}`
        ]
      )
  ),
  datasets: [
    {
      label: 'Indicator Achievement (%)',
      data: clos.flatMap(clo =>
          (clo.indicators || [])
          .map(ind => Number(getStudentIndicatorPercent
            (selectedStudent.id, ind.id)
            ))),
      backgroundColor: clos.flatMap(clo =>
          (clo.indicators || [])
            .map(ind => getStudentIndicatorPercent(
            selectedStudent.id, ind.id) >=
              Number( ind.target || 50)
              ? 'rgba(34,197,94,0.8)'
              : 'rgba(239,68,68,0.8)'
            )
        )
    }
  ]
}
: null;

const cloBarOptions = {
  responsive: true,
  scales: {
    y: {
      min: 0,
      max: 100
    }
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          return `${Number(ctx.raw).toFixed(2)}%`;
        }
      }
    }
  }
}
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
        label: (ctx) => {
          const ploCode = ctx.label;
          const plo = plos.find(p => p.code === ploCode);
          const desc = plo?.description || '';
          return [
            `ค่า: ${Number(ctx.raw).toFixed(2)}%`,
            desc
          ];
        }
      }
    },
    legend: { display: true }
  }
};

/* ================= YLO ================= */
const yloMap = {};
yloResults.forEach(r => {
  if (!yloMap[r.code]) {
    yloMap[r.code] = Number(r.percent);
  }
});
const sortedYLO = Object.keys(yloMap)
  .sort((a, b) => {
    const numA = parseInt(a.replace('YLO', ''));
    const numB = parseInt(b.replace('YLO', ''));
    return numA - numB;
  });

/* ================= YLO CHART ================= */
const yloBarData = {
  labels: sortedYLO,
  datasets: [{
    label: 'YLO (%)',
    data: sortedYLO.map(code => yloMap[code]),
    backgroundColor: 'rgba(75,192,192,0.8)',
    barThickness: 22   // ✅ เพิ่มความหนา
  }]
};
const yloBarOptions = {
  indexAxis: 'y', 
  scales: {
    x: { min: 0, max: 100 }
  }
};

const getCourseInfo = (courseId) => {
  const course =
    courses.find(
      c =>
        String(c.id) ===
        String(courseId)
    );
  if (!course) {
    return `Course ${courseId}`;
  }
  return `${course.code_en} - ${course.name_th}`;
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
  <h3 className="font-semibold mb-4">📊 Program Overview</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

    {/* PLO */}
      <div className="w-full max-w-md">
        <h4 className="font-medium mb-2">PLO Achievement</h4>
        <Radar data={ploChartData} options={radarOptions} />
      </div>

    {/* YLO */}
    <div>
      <h4 className="text-sm font-semibold mb-2">YLO</h4>
      <Bar data={yloBarData} options={yloBarOptions} />
    </div>

  </div>
</Card>
)}

<div className="flex flex-col lg:flex-row gap-4 mb-3">
{selectedStudent && (
<Card>
  {/* ✅ HEADER ROW */}
  <div className="flex mb-3 gap-10 h-auto w-auto">
    <h4 className="font-semibold">📚 รายวิชา</h4>
    <div className="flex gap-2">
<div className="px-2 py-1 border rounded-lg text-sm">
  จำนวน {getCoursesOfStudent(selectedStudent.id).length} วิชา
</div>
      <select
        value={courseYear}
        onChange={e => setCourseYear(e.target.value)}
        className="px-3 py-1 border rounded-lg text-m"
      >
        <option value="">ทุกปี</option>
        {[2568,2569,2570,2571,2572,2573].map(y => (
          <option key={y}>{y}</option>
        ))}
      </select>

      <select
        value={courseSemester}
        onChange={e => setCourseSemester(e.target.value)}
        className="px-3 py-1 border rounded-lg text-m"
      >
        <option value="">ทุกเทอม</option>
        <option value="1">1</option>
        <option value="2">2</option>
      </select>
    </div>
  </div>
{getCoursesOfStudent(selectedStudent.id).length === 0 && (
  <div className="text-gray-400 text-m">
    ไม่มีรายวิชาในช่วงนี้
  </div>
)}

  {/* ✅ COURSE LIST */}
  <div className="flex flex-col gap-2">
    {getCoursesOfStudent(selectedStudent.id).map(c => (
      <button
        key={c}
        onClick={() => setSelectedCourse(c)}
        className="px-3 py-1 border rounded-lg hover:bg-blue-50 text-left"
      >
        {getCourseInfo(c)}
      </button>
    ))}
  </div>
</Card>
)}

{selectedCourse && (
  <Card>
    <div className="w-auto max-w-xl">
      {/* ✅ CHART */}
      <div className="w-auto items-center h-auto">
        <h4 className="font-medium mb-2">
          CLO ({getCourseInfo(selectedCourse)})
        </h4>
        <Bar data={indicatorBarData} options={cloBarOptions} />
      </div>

      {/* ✅ CLO LIST */}
      <div className="flex-1 space-y-2 w-auto h-auto">
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
</div>
)}