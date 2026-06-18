import { useState, useEffect, useMemo, Fragment, useCallback } from 'react';
import api from '../../services/api';
import InstructorMenu from '../../components/InstructorMenu';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { Bar } from 'react-chartjs-2';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export default function PLOPage() {

  const [year, setYear] = useState('');
  const [students, setStudents] = useState([]);
  const [plos, setPlos] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [manualChecks, setManualChecks] = useState({});
  const [cloResults, setCloResults] = useState([]);
  const [courseResults, setCourseResults] = useState([]);
  const [yloResults, setYloResults] = useState([]);
  const [viewMode, setViewMode] = useState('plo'); 

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

useEffect(() => {
  if (!year) return;
  api.get('/admin/ylo-results', {
    params: { year }
  })
  .then(res => setYloResults(res.data));
}, [year]);


useEffect(() => {
  if (!year) return;
  (async () => {
    try {
      const res = await api.get('/admin/plo-manual', {
        params: { year }
      });
      const map = {};
      res.data.forEach(r => {
        if (!map[r.student_id]) map[r.student_id] = {};
        map[r.student_id][r.indicator_id] = r.is_pass;
      });
      setManualChecks(map);
    } catch (err) {
      console.log('manual load error', err.message);
    }
  })();
}, [year]);

  /* ================= FILTER ================= */
  const filteredStudents = students.filter(st =>
    year && String(st.user_code).startsWith(year.slice(-2))
  );

/* ================= CHECK PASS COURSE ================= */
const checkStudentPassCourse = useCallback((studentId, courseId) => {
  return courseResults.some(r =>
    r.student_id === studentId &&
    r.course_id === courseId &&
    r.is_pass === true
  );
}, [courseResults]);

/* ================= INDICATOR % ================= */
const getIndicatorPercent = useCallback((studentId, indicatorCode) => {
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
}, [mappings, checkStudentPassCourse]);

/* ================= PLO AVG ================= */
const getPloAvg = useCallback((studentId, plo) => {
  const values = plo.indicators.map(ind => {
    let val = getIndicatorPercent(studentId, ind.code);
    if (val === null) {
      val = manualChecks?.[studentId]?.[ind.id]
        ? 100
        : 0;
    }
    return val ?? 0;
  });
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}, [manualChecks, getIndicatorPercent]);

/* ================= CHART DATA ================= */
const ploAvgData = useMemo(() => {
  const result = {};
  plos.forEach(plo => {
    const values = filteredStudents.map(st =>
      getPloAvg(st.id, plo)
    );
    const avg = values.length
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;
    result[plo.code] = Number(avg.toFixed(2));
  });
  return result;
}, [plos, filteredStudents, getPloAvg]);

/* ================= BAR CONFIG ================= */
const barData = {
  labels: Object.keys(ploAvgData),
  datasets: [
    {
      label: 'PLO (%)',
      data: Object.values(ploAvgData),
      backgroundColor: 'rgba(54,162,235,0.7)'
    }
  ]
};
const barOptions = {
  indexAxis: 'y',
  scales: {
    x: { min: 0, max: 100 }
  }
};

  /* ================= UI ================= */
  return (
<div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-white">
  <InstructorMenu />
  <div className="flex-1 p-6 space-y-6">
    {/* HEADER */}
    <div className="bg-white rounded-2xl shadow p-5">
      <h2 className="text-xl font-bold">📊 PLO/YLO results by Year</h2>
    </div>

        {/* ✅ ปี */}
<Card>
  <div className="flex justify-between items-center mb-4">  
    <Select
      value={year}
      onChange={e => setYear(e.target.value)}
    >
      <option value="">นักศึกษารหัส</option>
      {[2568,2569,2570,2571,2572,2573].map(y => (
        <option key={y}>{y}</option>
      ))}
    </Select>
  
    <div className="flex gap-3">
    <button
      onClick={() => setViewMode('plo')}
      className={`px-4 py-2 rounded ${
        viewMode === 'plo'
          ? 'bg-blue-500 text-white'
          : 'bg-gray-200'
      }`}
    >
      PLO
    </button>
    <button
      onClick={() => setViewMode('ylo')}
      className={`px-4 py-2 rounded ${
        viewMode === 'ylo'
          ? 'bg-green-500 text-white'
          : 'bg-gray-200'
      }`}
    >
      YLO
    </button>
    </div>
  </div>
  {!year && (
  <div className="text-gray-400">
    เช่น นักศึกษารหัส 69xxx ให้เลือกปี 2569
  </div>
  )}

</Card>

{/* CHART */}
{viewMode === 'plo' && (
<Card>
  <h3 className="font-semibold mb-3">📊 PLO Overview</h3>
  <div className="max-w-xl">
    <Bar data={barData} options={barOptions} />
  </div>
</Card>
)}
{/* TABLE */}
{viewMode === 'plo' && (
<Card>
  <h3 className="font-semibold mb-3">PLO Results</h3>
  <div className="overflow-x-auto">
    <table className="text-sm border border-gray-400 border-collapse min-w-max">
           
            {/* HEADER 1 */}
<thead className="bg-gray-100 text-gray-700">

<tr>
  <th rowSpan="2" className="border px-3">รหัส</th>
  <th rowSpan="2" className="border px-3">ชื่อ-สกุล</th>

  {plos.map(plo => (
    <th
      key={plo.id}
      colSpan={plo.indicators.length + 1}
      className="border text-center bg-blue-50"
    >
      {plo.code}
    </th>
  ))}
</tr>

<tr>
  {plos.map(plo => (
    <Fragment key={plo.id}>

      {plo.indicators.map(ind => (
        <th key={ind.id} className="border text-xs 
        text-center cursor-help hover:bg-yellow-100"          
  title={`${ind.description || ''}${
    ind.target ? ` (เป้า: ${ind.target})` : ''
  }`}
>
          {ind.code}
        </th>
      ))}

      <th className="border text-blue-600 text-xs">
        avg
      </th>

    </Fragment>
  ))}
</tr>

</thead>

<tbody>
{filteredStudents.map(st => (
  <tr key={st.id} className="border-t border text-center px-2 
  hover:bg-gray-50">
    <td className="px-3 py-2">{st.user_code}</td>
    <td className="px-3 py-2">{st.name_th}</td>
    {plos.map(plo => {
      const avg = getPloAvg(st.id, plo);
      return (
        <>
          {plo.indicators.map(ind => {
            const percent = getIndicatorPercent(st.id, ind.code);
            let val = percent;
              if (val === null) {
                val = manualChecks?.[st.id]?.[ind.id]
                ? 100
                : 0;
            }
            return (
              <td key={ind.id} 
                className={`border-t text-center ${
                      val
                      ? Number(val) === 100
                      ? 'text-green-600'
                      : ''
                      : ''
                    }`}
                    >
                {val.toFixed(2)}%
              </td>
            );
          })}
          {/* AVG */}
          <td
            className={`text-center font-semibold ${
              avg === 100
                ? 'text-green-600'
                : 'text-red-500'
            }`}
          >
            {avg.toFixed(2)}%
          </td>
        </>
      );
    })}
  </tr>
))}
</tbody>
</table>
</div>
</Card>
)}

{viewMode === 'ylo' && (
<Card>
  <h3 className="font-semibold mb-3">YLO Results</h3>
  <table className="w-full text-sm border-t border-gray-300 border-collapse">
    {/* HEADER */}
    <thead className="bg-gray-100">
      <tr>
        <th className="px-2">รหัส</th>
        <th className="px-2">ชื่อ</th>
        {[...new Set(yloResults.map(y => y.code))].map(code => (
          <th key={code} className="px-2 text-center">
            {code}
          </th>
        ))}
      </tr>
    </thead>

    {/* BODY */}
    <tbody>
      {filteredStudents.map(st => {
        const studentYLO = yloResults.filter(r =>
          r.student_id === st.id
        );
        return (
          <tr key={st.id}>
            <td className="border-t px-2">{st.user_code}</td>
            <td className="border-t px-2">{st.name_th}</td>
            {[...new Set(yloResults.map(y => y.code))].map(code => {
              const y = studentYLO.find(x => x.code === code);
              return (
                <td key={code}                 
                    className={`border-t text-center ${
                      y
                      ? Number(y.percent) === 100
                      ? 'text-green-600 font-semibold'
                      : Number(y.percent) > 0
                      ? 'text-red-600'
                      : ''
                      : ''
                    }`}
                    >
                  {y ? Number(y.percent).toFixed(2) + '%' : '-'}
                </td>
              );
            })}
          </tr>
        );
      })}
    </tbody>
  </table>
</Card>
)}
      </div>
    </div>
  );
}