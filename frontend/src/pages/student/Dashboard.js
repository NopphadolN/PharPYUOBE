import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Radar, Bar } from 'react-chartjs-2';
import Card from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {

  const [me, setMe] = useState(null);
  const [plos, setPlos] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [cloResults, setCloResults] = useState([]);
  const [courseResults, setCourseResults] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [clos, setClos] = useState([]);
  const [courseYear, setCourseYear] = useState('');
  const [courseSemester, setCourseSemester] = useState('');
  const [indicatorScores, setIndicatorScores] = useState([]);
  const [yloResults, setYloResults] = useState([]);
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  /* ================= LOAD ================= */
  useEffect(() => {
    (async () => {

      const meRes = await api.get('/student/me');
      const ploRes = await api.get('/plos');
      const mapRes = await api.get('/mapping');
      const cloRes = await api.get('/instructor/clo-results');
      const courseRes = await api.get('/instructor/course-results');
      const coursesRes = await api.get('/instructor/courses');
      const indicatorRes = await api.get('/instructor/clo-indicator-scores-all');
      const yloRes = await api.get('/admin/ylo-results',
        {
          params:{student_id: meRes.data.id}
        }
        );
      setMe(meRes.data); // ✅ ตัวเองเท่านั้น
      setPlos(ploRes.data);
      setMappings(mapRes.data);
      setCloResults(cloRes.data);
      setCourseResults(courseRes.data);
      setCourses(coursesRes.data);
      setIndicatorScores(indicatorRes.data);
      setYloResults(yloRes.data);
    })();
  }, []);

useEffect(() => {
  const currentYear = new Date().getFullYear() + 543;
  setCourseYear(String(currentYear));
}, []);

useEffect(() => {
  setSelectedCourse(null);
}, [courseYear, courseSemester]);

useEffect(() => {
  if (!selectedCourse) return;

  const instanceRow = cloResults.find(r =>
    String(r.course_id) === String(selectedCourse)
  );

  const instanceId = instanceRow?.course_instance_id;

  console.log("instanceId:", instanceId);

  if (!instanceId) {
    console.log("❌ instanceId not found");
    setClos([]);
    return;
  }

  (async () => {
    try {
      const res = await api.get('/instructor/clos', {
        params: { course_instance_id: instanceId }
      });

      console.log("✅ CLO:", res.data);

      setClos(res.data);

    } catch (err) {
      console.log("CLO LOAD ERROR:", err.message);
    }
  })();

}, [selectedCourse, cloResults]);

  /* ================= FILTER ================= */

const myCourses = courseResults
  .filter(r =>
    r.student_id === me?.id &&
    (!courseYear || String(r.year) === courseYear) &&
    (!courseSemester || String(r.semester) === courseSemester)
  )
  .map(r => r.course_id)
  .filter((v, i, arr) => arr.indexOf(v) === i);

  const allCourses = courseResults
  .filter(r => r.student_id === me?.id)
  .map(r => r.course_id)
  .filter((v, i, arr) => arr.indexOf(v) === i);

  const allPassedCourses = courseResults
  .filter(r =>
    r.student_id === me?.id &&
    r.is_pass
  )
  .map(r => r.course_id)
  .filter((v, i, arr) => arr.indexOf(v) === i);

  const passedCourses = courseResults.filter(r =>
    r.student_id === me?.id && r.is_pass
  );

  /* ================= PLO ================= */

  const getIndicatorPercent = (indicatorCode) => {
    const mappedCourses = mappings.filter(m =>
      m.indicator_code === indicatorCode
    );
    if (mappedCourses.length === 0) return 0;
    let pass = 0;
    mappedCourses.forEach(m => {
      if (passedCourses.some(c => c.course_id === m.course_id)) {
        pass++;
      }
    });
    return (pass / mappedCourses.length) * 100;
  };

  const getPloAvg = (plo) => {
    const values = plo.indicators.map(ind =>
      getIndicatorPercent(ind.code)
    );
    if (!values.length) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  /* ✅ summary */
  const ploPassed = plos.filter(p => getPloAvg(p) >= 50).length;

  /* ================= YLO ================= */
const yloMap = {}; yloResults.forEach(r => {
  if (!yloMap[r.code]) {
    yloMap[r.code] = Number(r.percent);
  }
});  
const sortedYLO = Object.keys(yloMap)
    .sort((a, b) => {
      const numA = parseInt(a.replace('YLO', ''));
      const numB = parseInt(b.replace('YLO', ''));
      return numB - numA;
    });

const yloBarData = {
  labels: sortedYLO,
  datasets:[{
      label:'YLO (%)',      
      data: sortedYLO.map(code => yloMap[code]),
      backgroundColor:
        'rgba(75,192,192,0.8)'
    }
  ]
};

  /* ================= CLO ================= */
const getStudentIndicatorPercent = (indicatorId) => {
  const rows = indicatorScores.filter(r =>
        String(r.student_id) === String(me?.id)
        &&
        String(r.indicator_id) === String(indicatorId)
    );
  if (!rows.length) {
    return 0;
  }
  const totalScore = rows.reduce((sum,row) =>sum + Number(row.score || 0), 0);
  const totalFull = rows.reduce((sum,row) =>sum + Number(row.full_score || 0), 0);
  if (totalFull === 0) {
    return 0;
  }
  return (totalScore / totalFull) * 100;
};

const getCourseInfo = (courseId) => {
  const course =
    courses.find(c =>
      String(c.id) ===
      String(courseId)
    );
  if (!course) {
    return `Course ${courseId}`;
  }
  return `${course.code_en} - ${course.name_th}`;
};
  
  /* ================= CHART ================= */

  const ploChartData = {
    labels: plos.map(p => p.code),
    datasets: [{
      label: 'PLO %',
      data: plos.map(p => {
      const val = getPloAvg(p);
      return Number((val ?? 0).toFixed(2));
    }),
      backgroundColor: 'rgba(0,200,255,0.2)',
      borderColor: '#00bbff'
    }]
  };

const indicatorChartData = selectedCourse? {
  labels:
    clos.flatMap(clo =>(clo.indicators || [])
        .map((ind,index) => [clo.code, `ID${index+1}`])
    ),
  datasets:[
    {
      label: 'Indicator Achievement (%)',
      data: clos.flatMap(clo =>(clo.indicators || [])
            .map(ind =>Number(getStudentIndicatorPercent(ind.id).toFixed(2)))
        ),
      backgroundColor: clos.flatMap(clo =>
          (clo.indicators || []).map(ind =>
              getStudentIndicatorPercent(ind.id)>=
              Number(ind.target || 50)
              ? 'rgba(34,197,94,0.8)'
              : 'rgba(239,68,68,0.8)'
            )
        )
    }
  ]
}
: null;

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
          return `${ctx.label}: ${Number(ctx.raw).toFixed(2)}%`; 
        }
      }
    },legend: {display: true}
  }
};

const handleLogout = () => {
  localStorage.removeItem('token');
  navigate('/');
};

  /* ================= UI ================= */

  if (!me) return <div>Loading...</div>;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="flex-1 p-6 space-y-6">

        {/* ✅ HEADER */}
<Card>
  {/* ✅ header row */}
  <div className="flex justify-between items-start">
    <div>
      <h2 className="text-xl font-bold">
        {me.user_code} - {me.name_th}
      </h2>
      <div className="mt-2 text-m text-gray-600">
        ✅ PLOs ผ่าน: {ploPassed} / {plos.length}<br />
        ✅ รายวิชาที่ลงทะเบียน ผ่าน: {allPassedCourses.length} / {allCourses.length}
      </div>
    </div>

    {/* ✅ LOGOUT BUTTON */}
    <button
      onClick={handleLogout}
      className="
        text-m text-white font-semibold
        bg-red-500
        px-3 py-2 rounded-lg
        hover:bg-red-600 transition
      "
    >
      Logout
    </button>
  </div>
</Card>
        {/* ✅ PLO */}
        <Card>
          <h3 className="font-semibold mb-3">PLOs Achievement</h3>
          <div className="flex gap-6">
            <div className="w-full max-w-md">
              <Radar data={ploChartData} options={radarOptions}/>
            </div>
            <div className="flex-1 space-y-2">
              {plos.map(p => (
                <div key={p.code} className="border p-2 rounded">
                  <b>{p.code}</b> - {p.description}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ✅ YLO */}
        <Card>
          <h3 className="font-semibold mb-3">YLO Achievement</h3>
            <div className="w-full max-w-l">
            <Bar
            data={yloBarData}
            options={{indexAxis:'y'}}
            />
            </div>
        </Card>

        {/* ✅ COURSE */}
<Card>
  {/* ✅ HEADER + FILTER */}
  <div className="flex justify-between items-center mb-3">
    <div>
      <h3 className="font-semibold">📚 รายวิชา</h3>
      <div className="text-m px-3 py-1 text-gray-500">
        จำนวน {myCourses.length} วิชา
      </div>
    </div>
    <div className="flex gap-2">

      <select
        value={courseYear}
        onChange={e => setCourseYear(e.target.value)}
        className="border rounded-lg px-3 py-1 text-m"
      >
        <option value="">ทุกปี</option>
        {[2568,2569,2570,2571,2572,2573].map(y => (
          <option key={y}>{y}</option>
        ))}
      </select>

      <select
        value={courseSemester}
        onChange={e => setCourseSemester(e.target.value)}
        className="border rounded-lg px-3 py-1 text-m"
      >
        <option value="">ทุกเทอม</option>
        <option value="1">เทอม 1</option>
        <option value="2">เทอม 2</option>
      </select>
    </div>
  </div>

  {/* ✅ COURSE LIST */}
  <div className="flex flex-wrap gap-2">
    {myCourses.length > 0 ? (
      myCourses.map(c => (
        <button
          key={c}
          onClick={() => setSelectedCourse(c)}
          className="px-3 py-1 border rounded-lg hover:bg-blue-50"
        >
          {getCourseInfo(c)}
        </button>
      ))
    ) : (
      <div className="text-gray-400 text-sm">
        ไม่มีรายวิชาในช่วงนี้
      </div>
    )}
  </div>
</Card>

        {/* ✅ CLO */}
        {selectedCourse && (
          <Card>
            <div className="flex gap-6">
              <div className="w-full max-w-md">
              <Bar
                data={indicatorChartData}
                options={{
                  responsive:true,
                  scales:{y:{min:0, max:100}
                  },
                  plugins:{
                    legend:{display:false}
                  }
                }}
              />
              </div>
              <div className="flex-1 space-y-2">
                {clos.map(clo => (
                  <div key={clo.id} className="border p-2 rounded">
                    <b>{clo.code}</b> - {clo.description}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}