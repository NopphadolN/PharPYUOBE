import React,{ useState, useEffect } from 'react';
import api from '../../services/api';
import InstructorMenu from '../../components/InstructorMenu';
import { Bar } from 'react-chartjs-2';
import Card from '../../components/ui/Card';

import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

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

export default function CLOPage() {
  const [savingKey, setSavingKey] = useState(0);
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [courseId, setCourseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [instanceId, setInstanceId] = useState(null);

  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  const [clos, setClos] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [contents, setContents] = useState([]);
  const [scores, setScores] = useState({});
  const [inputScores, setInputScores] = useState({});
  const [pasteText, setPasteText] = useState('');

  const [owner, setOwner] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
  api.get('/instructor/me')
    .then(res => setUser(res.data))
    .catch(console.error);
}, []);

  /* ================= LOAD COURSE ================= */
  useEffect(() => {
    api.get('/instructor/courses').then(res => setCourses(res.data));
  }, []);

  /* ================= LOAD DATA ================= */
useEffect(() => {
  if (!courseId || !year || !semester) return;
  (async () => {
    try {
      const inst = await api.get('/instructor/instance', {
        params: { course_id: courseId, year, semester }
      });
      // ✅ ❗ เช็คก่อน
      if (!inst.data) {
        alert('❌ ยังไม่มีการบันทึกวิชานี้ กรุณาสร้างวิชาก่อน');
        // ✅ reset state กันค้าง
        setClos([]);
        setStudents([]);
        setContents([]);
        setEvaluations([]);
        setScores({});
        setOwner(null);
        setInstanceId(null);
        return; // ✅ หยุดเลย
      }
      // ✅ ดึง owner
      setOwner(inst.data.owner);
      setInstanceId(inst.data.id);
      const instanceIdLocal = inst.data.id;
      const cloRes = await api.get('/instructor/clos', {
        params: { course_instance_id: instanceIdLocal }
      });
      const stuRes = await api.get('/student/course-students', {
        params: { course_instance_id: instanceIdLocal }
      });
      setClos(cloRes.data);
      setStudents(stuRes.data);
      setContents(
        (inst.data.contents || []).map(c => ({
          ...c,
          order: c.order || '',
          examScore: Number(c.exam_score || 0),
          workScore: Number(c.work_score || 0),
          cloIds: Array.isArray(c.clo_ids)
            ? c.clo_ids.map(String)
            : []
        }))
      );

      setEvaluations(
        (inst.data.evaluations || []).map((e, i) => ({
          ...e,
          id: e.id ?? i + 1,
          lectureIds: (e.content_ids_lecture || []).map(String),
          labIds: (e.content_ids_lab || []).map(String),
          cloIds: (e.clo_ids || []).map(String)
        }))
      );

      // ✅ load scores
      const scoreRes = await api.get('/instructor/clo-scores', {
        params: { course_instance_id: instanceIdLocal }
      });

      const loaded = {};

      scoreRes.data.forEach(r => {
        if (!loaded[r.student_id]) loaded[r.student_id] = {};
        if (!loaded[r.student_id][r.clo_id]) loaded[r.student_id][r.clo_id] = {};
        loaded[r.student_id][r.clo_id][r.evaluation_id] = Number(r.score);
      });

      setScores(loaded);

    } catch (err) {
      console.error("LOAD ERROR:", err);
      alert('❌ โหลดข้อมูลไม่สำเร็จ');
    }

  })();

}, [courseId, year, semester]);

  /* ================= MAP EVAL → CLO ================= */
const getEvalByCLO = (cloId) => {
  return evaluations.filter(e =>
    (e.cloIds || [])
      .map(String)
      .includes(String(cloId))
  );
};

  /* ================= MAX CLO ================= */
  const getCloMax = (cloId) => {
    const evals = getEvalByCLO(cloId);
    return evals.reduce((sum, e) => 
    sum + getEvalScoreForCLO(e, cloId)
  , 0);
  };

  /* ================= % ================= */
  const getPercent = (studentId, cloId) => {

    const evals = getEvalByCLO(cloId);

    const total = evals.reduce((sum, e) =>
      sum + Number(scores?.[studentId]?.[cloId]?.[e.id] || 0)
    , 0);

    const max = getCloMax(cloId);

    if (max === 0) return 0;

    return (total / max) * 100;
  };

  /* ================= APPLY SCORE ================= */
  const handleApplyScore = () => {

    const cloId = document.getElementById('cloSelect').value;
    const evalId = document.getElementById('evalSelect').value;

    if (!cloId || !evalId) {
      alert('เลือก CLO และ วิธีประเมิน');
      return;
    }

    const updated = { ...scores };

    Object.keys(inputScores).forEach(stId => {
      const val = Number(inputScores[stId]);
      if (isNaN(val)) return;

      if (!updated[stId]) updated[stId] = {};
      if (!updated[stId][cloId]) updated[stId][cloId] = {};

      updated[stId][cloId][evalId] = val;
    });

    setScores({ ...updated });
  };

  /* ================= PASS ================= */
  const isStudentPassAllCLO = (studentId) => {
    return clos.every(clo => {
      const percent = getPercent(studentId, clo.id);
      const target = clo.indicators?.length
        ? Math.max(...clo.indicators.map(i => Number(i.target || 50)))
        : 50;
      return percent >= target;
    });
  };

  /* ================= SAVE ================= */
// ✅ STEP 1
const saveScores = async (course_instance_id) => {
  console.log("STEP 1: save scores");
  const res = await api.post('/instructor/clo-scores', {
    course_instance_id,
    scores
  });
  return res;
};

// ✅ STEP 2
const saveCLOResults = async (course_instance_id) => {
  console.log("STEP 2: save CLO results");
  let cloDetail = buildCLODetails(course_instance_id);
  cloDetail = cloDetail.filter(r =>
    r &&
    r.clo_id &&
    !isNaN(Number(r.clo_id)) &&
    r.student_id &&
    !isNaN(Number(r.student_id))
  );
  const res = await api.post('/instructor/save-clo-results', {
    course_instance_id,
    data: cloDetail
  });
  return res;
};

// ✅ STEP 3
const saveCourseResults = async (course_instance_id) => {
  console.log("STEP 3: save course results");

  const results = students.map(st => ({
    course_instance_id,
    student_id: st.id,
    course_id: courseId,
    year,
    semester,
    is_pass: clos.every(clo => {
      const percent = getStudentPercent(st.id, clo.id);
      const target = clo.indicators?.length
        ? Math.max(...clo.indicators.map(i => Number(i.target || 50)))
        : 50;

      return percent >= target;
    })
  }));

  const res = await api.post('/instructor/save-course-results', {
    course_instance_id,
    results
  });
  return res;
};

  const handleSave = async () => {
  if (loading) return;
  if (!instanceId) {
    alert('❌ กรุณาเลือกวิชาก่อน');
    return;
  }
  setLoading(true);
  try {
    const course_instance_id = instanceId;
    // ✅ run ทีละ step
    await saveScores(course_instance_id);
    await saveCLOResults(course_instance_id);
    await saveCourseResults(course_instance_id);
    alert('✅ บันทึกครบ (คะแนน + CLO + PASS)');
  } catch (err) {
    console.error("❌ SAVE ERROR:", err);
    alert(
      '❌ บันทึกไม่สำเร็จ: ' +
      (err.response?.data?.detail || err.message)
    );
  } finally {         
      setLoading(false);
      setSavingKey(prev => prev + 1);
  }
};

  // getEvalScoreForCLO
const getEvalScoreForCLO = (e, cloId) => {
  const selectedClos = e.cloIds || [];
  if (
    !selectedClos
      .map(String)
      .includes(String(cloId))
  ) {
    return 0;
  }
  const allIds = [
    ...(e.lectureIds || []),
    ...(e.labIds || [])
  ];
  const relatedContents = contents.filter(c =>
    allIds.includes(String(c.id))
  );
  const cloHours = {};
  selectedClos.forEach(id => {
    cloHours[id] = 0;
  });
  relatedContents.forEach(content => {
    const matchedClos =
      (content.cloIds || []).filter(id =>
        selectedClos
          .map(String)
          .includes(String(id))
      );
    if (!matchedClos.length) return;
    const shareHours =
      Number(content.hours || 0) /
      matchedClos.length;
    matchedClos.forEach(id => {
      cloHours[id] += shareHours;
    });
  });
  const totalHours =
    Object.values(cloHours)
      .reduce((a, b) => a + b, 0);
  if (!totalHours) return 0;
  return Number(e.total || 0) *
    (cloHours[cloId] / totalHours);
};

// buildCLODetails
const buildCLODetails = (course_instance_id) => {
  const results = [];
  students.forEach(st => {
    clos.forEach(clo => {
      const percent = getStudentPercent(st.id, clo.id);
      results.push({
        course_instance_id,
        student_id: st.id,
        course_id: courseId,
        clo_id: clo.id,
        percent,
        is_pass: percent >= (
          clo.indicators?.length
            ? Math.max(...clo.indicators.map(i => Number(i.target || 50)))
            : 50
        )
      });
    });
  });
  return results;
};

  /* ===== helper ===== */
const getStudentTotal = (studentId, cloId) => {
  const evals = getEvalByCLO(cloId);
  return evals.reduce((sum, e) =>
    sum + Number(scores?.[studentId]?.[cloId]?.[e.id] || 0)
  , 0);
};

const getStudentPercent = (studentId, cloId) => {
  const evals = getEvalByCLO(cloId);
  const total = getStudentTotal(studentId, cloId);
  const max = evals.reduce((sum, e) =>
    sum + getEvalScoreForCLO(e, cloId)   // ✅ ใช้เหมือน TABLE
  , 0);
  if (max === 0) return 0;
  return (total / max) * 100;
};

const handleImport = () => {
  const rows = pasteText.trim().split('\n');
  const cloId = document.getElementById('cloSelect').value;
  const evalId = document.getElementById('evalSelect').value;
  if (!cloId || !evalId) {
    alert('เลือก CLO และ วิธีประเมินก่อน');
    return;
  }
  const updated = { ...scores };
  rows.forEach((row, index) => {
    const cols = row.split(/\t|,/);
    let studentCode, score;
    if (cols.length >= 2) {
      studentCode = cols[0];
      score = Number(cols[1]);
    } else {
      const st = students[index];
      if (!st) return;
      studentCode = st.user_code;
      score = Number(cols[0]);
    }
    const student = students.find(s => s.user_code === studentCode);
    if (!student) return;
    if (!updated[student.id]) updated[student.id] = {};
    if (!updated[student.id][cloId]) updated[student.id][cloId] = {};
    updated[student.id][cloId][evalId] = score;
  });
  setScores({ ...updated });
  alert('✅ นำเข้าคะแนนแล้ว');
};

// คำนวนกราฟ
const getClassAvgCLO = () => {
  const result = {};
  clos.forEach(clo => {
    const values = students.map(st =>
      getStudentPercent(st.id, clo.id)
    );
    const avg = values.length
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;
    result[clo.code] = Number(avg.toFixed(2));
  });
  return result;
};

// สร้างกราฟ
const avgData = getClassAvgCLO();
const barData = {
  labels: Object.keys(avgData),
  datasets: [
    {
      label: 'Average CLO (%)',
      data: Object.values(avgData),
      backgroundColor: Object.values(avgData).map(v =>
        v >= 60
          ? 'rgba(75,192,192,0.8)'   // ✅ ผ่าน = เขียว
          : 'rgba(255,99,132,0.8)'   // ❌ ไม่ผ่าน = แดง
      )
    }
  ]
};
const barOptions = {
  indexAxis: 'y', // ✅ แนวนอน
  scales: {
    x: {
      min: 0,
      max: 100
    }
  }
};

const isOwner = user && owner && user.id === owner.id;

console.log("BTN STATE:", {
  loading,
  instanceId,
  isOwner
});
  /* ================= UI ================= */
  return (
<div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-white">

  <InstructorMenu />

  <div className="flex-1 p-6 space-y-6">

    {/* HEADER */}
    <div className="bg-white rounded-2xl shadow p-5">
      <h2 className="text-xl font-bold">📊 CLO Assessment</h2>

      {owner && (
        <div className="text-sm text-gray-600">
          👑 ผู้รับผิดชอบ: {owner.name_th}
        </div>
      )}

      {!isOwner && (
        <div className="text-red-500 text-sm mt-2">
          🔒 คุณไม่มีสิทธิ์แก้ไข
        </div>
      )}
    </div>

        {/* FILTER */}
<Card>
  <div className="flex flex-wrap gap-3">

    <Select onChange={e => setYear(e.target.value)}>
      <option value="">ปี</option>
      {[2569,2570,2571,2572,2573].map(y => (
        <option key={y}>{y}</option>
      ))}
    </Select>

    <Select onChange={e => setSemester(e.target.value)}>
      <option>เทอม</option>
      <option>1</option>
      <option>2</option>
    </Select>

    <Select onChange={e => setCourseId(e.target.value)}>
      <option>วิชา</option>
      {courses.map(c => (
        <option key={c.id} value={c.id}>
          {c.code_en} - {c.name_th}
        </option>
      ))}
    </Select>

  </div>
</Card>

    {/* CLO Chart */}
{clos.length > 0 && students.length > 0 && (
  <Card>
    <h3 className="font-semibold mb-3">📊 Average CLO (Class)</h3>

    <div className="w-full max-w-xl">
      <Bar data={barData} options={barOptions} />
    </div>
  </Card>
)}

        {/* CONTROL */}
<Card>
  <h3 className="font-semibold mb-3">นำเข้าคะแนน</h3>

  <div className="flex flex-wrap gap-3 items-start">

    <Select id="cloSelect" disabled={!isOwner}>
      <option value="">เลือก CLO</option>
      {clos.map(c => (
        <option key={c.id} value={c.id}>{c.code}</option>
      ))}
    </Select>

    <Select id="evalSelect" disabled={!isOwner}>
      <option>เลือกวิธีประเมิน</option>
      {evaluations.map(e => (
        <option key={e.id} value={e.id}>{e.name}</option>
      ))}
    </Select>

    <textarea
      disabled={!isOwner}
      rows={4}
      className="border rounded-lg p-2 w-[300px]"
      placeholder="วางคะแนนจาก Excel รหัสนศ|คะแนน"
      value={pasteText}
      onChange={(e) => setPasteText(e.target.value)}
    />

    <Button disabled={!isOwner} onClick={handleImport}>
      📥 นำเข้าคะแนน
    </Button>

  </div>
</Card>

{/* ================= TABLE ================= */}
<Card>
  <h3 className="font-semibold mb-4">ตารางคะแนน</h3>

  {!clos.length && (
    <div className="text-red-500 mb-3">
      ❌ ยังไม่มีข้อมูล CLO
    </div>
  )}

  <div className="overflow-x-auto">
    <table className="text-sm border-collapse min-w-max table-fixed">

      {/* HEADER */}
      <thead className="bg-gray-100 text-gray-700">

        {/* ROW 1 */}
        <tr>
          <th rowSpan="3" className="px-3 py-2 border">รหัส</th>
          <th rowSpan="3" className="px-3 py-2 border">ชื่อ</th>

          <th rowSpan="3" className="px-3 py-2 border">
            กรอกคะแนน <br />
            <button
              disabled={!isOwner}
              onClick={handleApplyScore}
              className="text-blue-500"
            >
              ➕
            </button>
          </th>

          {clos.map(clo => {
            const evals = getEvalByCLO(clo.id);
            return (
<th
  key={clo.id}
  colSpan={evals.length + 2}
  className="px-2 border"
  title={`Target: ${
    clo.indicators?.length
      ? Math.max(...clo.indicators.map(i => Number(i.target || 50)))
      : 50
  }%`}
>
  {clo.code}
</th>
            );
          })}

          <th rowSpan="3" className="px-3 py-2 border">ผ่าน</th>
        </tr>

        {/* ROW 2 */}
        <tr>
          {clos.flatMap(clo => {
            const evals = getEvalByCLO(clo.id);

            return [
              ...evals.map(e => (
                <th key={e.id} className="px-2 border">
                  <div className="writing-vertical text-xs">
                    {e.name}
                  </div>
                </th>
              )),
              <th key={clo.id + '-sum'} className="border">รวม</th>,
              <th key={clo.id + '-percent'} className="border">%</th>
            ];
          })}
        </tr>

        {/* ROW 3 */}
        <tr>
          {clos.flatMap(clo => {
            const evals = getEvalByCLO(clo.id);

            const totalMax = evals.reduce(
              (sum, e) => sum + getEvalScoreForCLO(e, clo.id),
              0
            );

            return [
              ...evals.map(e => (
                <th key={e.id} className="text-xs border">
                  {getEvalScoreForCLO(e, clo.id).toFixed(2)}
                </th>
              )),
              <th key={clo.id + '-sum'} className="border">
                {totalMax.toFixed(2)}
              </th>,
              <th key={clo.id + '-blank'} className="border"></th>
            ];
          })}
        </tr>
      </thead>

      {/* BODY */}
      <tbody>
        {[...students]
  .sort((a, b) => String(a.user_code).localeCompare(String(b.user_code)))
  .map(st => (
          <tr
  key={st.id}
  className={`
    hover:bg-gray-50
    ${!isStudentPassAllCLO(st.id) ? 'bg-red-50' : ''}
  `}
>

            <td className="px-3 border">{st.user_code}</td>
            <td className="px-3 border text-left">{st.name_th}</td>

            <td className="border text-center">
              <input
                className="border rounded w-14 px-1"
                value={inputScores[st.id] || ''}
                onChange={(e) =>
                  setInputScores({
                    ...inputScores,
                    [st.id]: e.target.value
                  })
                }
              />
            </td>

            {clos.flatMap(clo => {
              const evals = getEvalByCLO(clo.id);

              const total = evals.reduce(
                (sum, e) =>
                  sum +
                  Number(
                    scores?.[st.id]?.[clo.id]?.[e.id] || 0
                  ),
                0
              );

              const max = evals.reduce(
                (s, e) => s + getEvalScoreForCLO(e, clo.id),
                0
              );

              const percent =
                max === 0 ? 0 : (total / max) * 100;

              const target = clo.indicators?.length
                ? Math.max(
                    ...clo.indicators.map(i =>
                      Number(i.target || 50)
                    )
                  )
                : 50;

              return [
                ...evals.map(e => (
                  <td
                    key={st.id + '-' + e.id}
                    className="border text-center"
                  >
                    {scores?.[st.id]?.[clo.id]?.[e.id] !==
                    undefined
                      ? Number(
                          scores[st.id][clo.id][e.id]
                        ).toFixed(2)
                      : ''}
                  </td>
                )),
                <td
                  key={st.id + '-total-' + clo.id}
                  className="border text-center"
                >
                  {total.toFixed(2)}
                </td>,
                <td
                  key={st.id + '-percent-' + clo.id}
                  className="border text-center"
                  style={{
                    color:
                      percent >= target
                        ? 'green'
                        : 'red',
                    fontWeight: 'bold'
                  }}
                >
                  {percent.toFixed(2)}
                </td>
              ];
            })}

            {/* PASS */}
            <td
              className={`border text-center font-semibold ${
                isStudentPassAllCLO(st.id)
                  ? 'text-green-600'
                  : 'text-red-500'
              }`}
            >
              {isStudentPassAllCLO(st.id)
                ? 'PASS'
                : '❌'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</Card>

<div className="mt-4 flex gap-3">

  <button
    key={savingKey}
    disabled={!isOwner || loading || !instanceId}
    onClick={handleSave}
    className={`
      px-6 py-3 rounded-lg text-white
      ${loading
        ? 'bg-gray-400 cursor-not-allowed'
        : 'bg-blue-500 hover:bg-blue-600'
      }
    `}
  >
    {loading ? '⏳ กำลังบันทึก...' : '💾 บันทึกคะแนน'}
  </button>
</div>

      </div>
    </div>
  );
}
