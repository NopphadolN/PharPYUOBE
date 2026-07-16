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

  const [pasteText, setPasteText] = useState('');
  
  const [owner, setOwner] = useState(null);
  const [user, setUser] = useState(null);

  const [indicatorScores, setIndicatorScores] = useState({});
  const [selectedCloId, setSelectedCloId] = useState('');
  const [selectedIndicatorId, setSelectedIndicatorId] = useState('');
  const [selectedFullScore, setSelectedFullScore] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState('');

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
        setOwner(null);
        setInstanceId(null);
        return; // ✅ หยุดเลย
      }
      // ✅ ดึง owner
      setOwner(inst.data.owner);
      setInstanceId(inst.data.id);
      setEvaluations(inst.data.evaluations || []);
      const instanceIdLocal = inst.data.id;
      const cloRes = await api.get('/instructor/clos', {
        params: { course_instance_id: instanceIdLocal }
      });
      const stuRes = await api.get('/student/course-students', {
        params: { course_instance_id: instanceIdLocal }
      });
      setClos(cloRes.data);
      setStudents(stuRes.data);

const indicatorRes =
  await api.get(  '/instructor/clo-indicator-scores',
    {
      params:{
        course_instance_id: instanceIdLocal
      }
    }
  );
const loadedIndicators = {};indicatorRes.data
.forEach(r => {
  if (!loadedIndicators[r.student_id]) 
    {loadedIndicators[r.student_id] = {};}
  if (!loadedIndicators[r.student_id][r.indicator_id]) 
    {loadedIndicators[r.student_id][r.indicator_id] = {};}
loadedIndicators[r.student_id][r.indicator_id][r.evaluation_id] = {
  score: Number(r.score),
  fullScore: Number(r.full_score)
};
});
setIndicatorScores(loadedIndicators);

    } catch (err) {
      console.error("LOAD ERROR:", err);
      alert('❌ โหลดข้อมูลไม่สำเร็จ');
    }

  })();

}, [courseId, year, semester]);

  /* ================= APPLY SCORE ================= */

  /* ================= PASS ================= */
const isStudentPassAllCLO = (studentId) => {
  return clos.every(
    clo => isPassCLO(studentId, clo)
  );
};

  /* ================= SAVE ================= */
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
  const results = students.map(st => {
    const passedClos =
      clos.filter(clo =>
        isPassCLO(st.id, clo)
      ).length;
    return {
      course_instance_id,
      student_id: st.id,
      course_id: courseId,
      year,
      semester,
      is_pass: passedClos === clos.length,
      passed_clos: passedClos,
      total_clos: clos.length
    };
  });
  const res =
    await api.post(
      '/instructor/save-course-results',
      {
        course_instance_id,
        results
      }
    );
  return res;
};

const hasAnyStudentScore = () => {
  return Object.values(
    indicatorScores
  ).some(student =>
    Object.keys(
      student || {}
    ).length > 0
  );
};

const buildIndicatorScoreRows = () => {
  const rows = [];
  students.forEach(student => {
    clos.forEach(clo => {
      (clo.indicators || []).forEach(indicator => {
        const evaluationMap = indicatorScores?.[student.id]?.[indicator.id];
        if (!evaluationMap) {
          return;
        }
        Object.entries(
          evaluationMap
        ).forEach(
          ([evaluationId, item]) => {
            const score = Number(item.score || 0);
            const fullScore = Number(item.fullScore || 0);
            const percent = fullScore > 0
              ? (score / fullScore) * 100
              : 0;
            rows.push({
              course_instance_id: instanceId,
              student_id: student.id,
              clo_id: clo.id,
              indicator_id: indicator.id,
              evaluation_id: Number(evaluationId),
              score,
              full_score: fullScore,
              percent: Number(percent.toFixed(2)),
              is_pass: percent >=Number(indicator.target || 50)
            });
          }
        );
      });
    });
  });
  return rows;
};

const saveIndicatorScores = async (course_instance_id) => {
  const rows = buildIndicatorScoreRows();
  await api.post('/instructor/clo-indicator-scores',
    {
      course_instance_id,
      scores: rows
    }
  );
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
    await saveIndicatorScores(course_instance_id);
      if (hasAnyStudentScore()) {
    await saveCLOResults(course_instance_id);
    await saveCourseResults(course_instance_id);
    }

    alert('✅ บันทึกครบ (คะแนน + CLO + PASS)');
  } catch (err) {
    console.error("❌ SAVE ERROR:", err.response?.data);
    alert(
      '❌ บันทึกไม่สำเร็จ: ' +
      (err.response?.data?.detail || err.message)
    );
  } finally {         
      setLoading(false);
      setSavingKey(prev => prev + 1);
  }
};

// buildCLODetails
const buildCLODetails = (course_instance_id) => {
  const results = [];
  students.forEach(st => {
    clos.forEach(clo => {
      const percent = getCLOPercent(st.id, clo);
      const indicators = clo.indicators || [];
      const passedIndicators = indicators.filter(ind =>
          isIndicatorPass(st.id, ind)
           ).length;
results.push({
  course_instance_id,
  student_id: st.id,
  course_id: courseId,
  clo_id: clo.id,
  percent: Number(percent.toFixed(2)),
  is_pass: passedIndicators === indicators.length,
  passed_indicators: passedIndicators,
  total_indicators: indicators.length
});

    });
  });
  return results;
};

//ล้างคะแนนรายการประเมิน
const handleClearEvaluation = () => {
  const indicatorId = Number(selectedIndicatorId);
  const evaluationId = Number(selectedEvaluationId);
  const updated = { ...indicatorScores };
  Object.keys(updated)
   .forEach(studentId => {
      if ( updated?.[studentId]?.[indicatorId]) 
      {delete updated[studentId][indicatorId][evaluationId];}
    });
  setIndicatorScores(updated);
  alert('ล้างคะแนนรายการประเมินแล้ว');
};

  /* ===== helper ===== */
const handleIndicatorImport = () => {
  if (
    !selectedCloId ||
    !selectedIndicatorId ||
    !selectedEvaluationId
  ) {
    alert(
      'เลือก CLO ตัวชี้วัด และรายการประเมินก่อน'
    );
    return;
  }
  const fullScore = Number(selectedFullScore);
  if (!fullScore) {
    alert(
      'กรุณาระบุคะแนนเต็ม'
    );
    return;
  }
  const rows = pasteText
      .trim()
      .split('\n');
  const updated ={...indicatorScores};
  rows.forEach((row, index) => {
    const cols = row.split(/\t|,/);
    let studentCode;
    let score;
    if (cols.length >= 2) {
      studentCode = cols[0];
      score = Number(cols[1]);
    }
    else {
      const st = students[index];
      if (!st) return;
      studentCode = st.user_code;
      score = Number(cols[0]);
    }
    const student = students.find(s => s.user_code === studentCode);
    if (!student)
      return;
    const indicatorId = Number(selectedIndicatorId);
    const evaluationId = Number(selectedEvaluationId);

if (!updated[student.id]) {updated[student.id] = {};}
if (!updated[student.id][indicatorId]) {updated[student.id][indicatorId] = {};}
updated[student.id][indicatorId][evaluationId] = {
  score,
  fullScore
};
  });
  setIndicatorScores(updated);
  alert(
    '✅ นำเข้าคะแนนตัวชี้วัดแล้ว'
  );
};

const cloDescMap = {};
clos.forEach(clo => {
  cloDescMap[clo.code] = clo.description || '';
});
const getIndicatorPercent = (studentId, indicatorId) => {
  const evaluations = indicatorScores?.[studentId]?.[indicatorId];
  if (!evaluations) {
    return 0;
  }
  let totalScore = 0;
  let totalFullScore = 0;
  Object.values(evaluations)
    .forEach(item => {
      totalScore += Number(item.score || 0);
      totalFullScore += Number(item.fullScore || 0);
    });
  if (totalFullScore === 0) {
    return 0;
  }
  return (totalScore / totalFullScore) * 100;
};

const isIndicatorPass = (studentId, indicator) => {
  const percent = getIndicatorPercent(studentId, indicator.id);
  return (
    percent >= Number(indicator.target || 50)
  );
};

const isPassCLO = (studentId, clo) => {
  const indicators = clo.indicators || [];
  if (!indicators.length) {
    return false;
  }
  return indicators.every(
    indicator =>
      isIndicatorPass(
        studentId,
        indicator
      )
  );
};

const getCLOPercent = (studentId, clo) => {
  const indicators =
    clo.indicators || [];
  if (!indicators.length) {
    return 0;
  }
  const values =
    indicators.map(indicator =>
      getIndicatorPercent(
        studentId,
        indicator.id
      )
    );
  return (
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    )
    /
    values.length
  );
};

const getEvaluationsByIndicator = (indicatorId) => {
  const ids = new Set();
  Object.values(
    indicatorScores || {}
  ).forEach(student => {
    const evalMap =
      student?.[indicatorId];
    if (!evalMap) return;
    Object.keys(evalMap)
      .forEach(id =>
        ids.add(String(id))
      );
  });
  return evaluations.filter(ev =>
    ids.has(String(ev.id))
  );
};

const handleScoreEdit = (
  studentId,
  indicatorId,
  evaluationId,
  value
) => {
  const updated = { ...indicatorScores };
  if (!updated[studentId]) {updated[studentId] = {};}
  if (!updated[studentId][indicatorId]) {updated[studentId][indicatorId] = {};}
  const current = updated?.[studentId]?.[indicatorId]?.[evaluationId];
  updated[studentId][indicatorId][evaluationId] = {
    score: Number(value),
    fullScore: current?.fullScore || 0
  };
  setIndicatorScores(updated);
};

const evaluationFullScoreMap = {};
Object.values(indicatorScores || {}).forEach(student => {
Object.entries(student || {}).forEach(([indicatorId, evals]) => {
Object.entries(evals || {}).forEach(([evaluationId, item]) => {
  const key = `${indicatorId}_${evaluationId}`;
    if (evaluationFullScoreMap[key] === undefined) 
       {evaluationFullScoreMap[key] = item.fullScore;}
          }
        );
      }
    );
});

// คำนวนกราฟ
const getClassAvgCLO = () => {
  const result = {};
  clos.forEach(clo => {
    const values =
      students.map(st =>
        getCLOPercent(
          st.id,
          clo
        )
      );
    const avg =
      values.length
      ? values.reduce(
          (a,b)=>a+b,
          0
        ) / values.length
      : 0;
    result[clo.code] =
      Number(avg.toFixed(2));
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
  indexAxis: 'y',
  scales: {
    x: {
      min: 0,
      max: 100
    }
  },
  plugins: {
    tooltip: {
      callbacks: {
        title: (items) => {
          return items[0].label;
        },
        label: (ctx) => {
          return `ค่าเฉลี่ย: ${Number(ctx.raw).toFixed(2)}%`;
        },
        afterLabel: (ctx) => {
          return cloDescMap[ctx.label] || '';
        }
      }
    }
  }
};

const selectedClo =
  clos.find(
    c => String(c.id) === String(selectedCloId)
  );

const isOwner = user &&
  (user.id === owner?.id || user.can_edit_all_courses === true);

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
      {[2568,2569,2570,2571,2572,2573].map(y => (
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
<Select
  disabled={!isOwner}
  value={selectedCloId}
  onChange={e => {
    setSelectedCloId(e.target.value);
    setSelectedIndicatorId('');
  }}
>
  <option value="">
    เลือก CLO
  </option>
  {clos.map(c => (
    <option
      key={c.id}
      value={c.id}
    >
      {c.code}
    </option>
  ))}
</Select>

<Select
  disabled={
    !isOwner ||
    !selectedCloId
  }
  value={selectedIndicatorId}
onChange={(e) => {
  setSelectedIndicatorId(e.target.value);
}}
>
  <option value="">
    เลือกตัวชี้วัด
  </option>
{selectedClo?.indicators?.map((ind, index) => {
  return (
    <option
      key={ind.id}
      value={ind.id}
    >
      ID{index + 1}-{ind.description}
    </option>
  );
})}
</Select>

<Select
  disabled={
    !isOwner ||
    !selectedIndicatorId
  }
  value={selectedEvaluationId}
  onChange={e =>
    setSelectedEvaluationId(
      e.target.value
    )
  }
>
  <option value="">
    เลือกรายการประเมิน
  </option>
  {evaluations.map(ev => (
    <option
      key={ev.id}
      value={ev.id}
    >
      {ev.name}
    </option>
  ))}
</Select>

<input
  type="number"
  min="0"
  step="0.01"
  placeholder="คะแนนเต็มตัวชี้วัด"
  value={selectedFullScore}
  onChange={e =>
    setSelectedFullScore(
      e.target.value
    )
  }
  className="border rounded-lg px-3 py-2"
/>
    <textarea
      disabled={!isOwner}
      rows={4}
      className="border rounded-lg p-2 w-[300px]"
      placeholder="วางคะแนนจาก Excel รหัสนศ|คะแนน"
      value={pasteText}
      onChange={(e) => setPasteText(e.target.value)}
    />

    <Button disabled={!isOwner} onClick={handleIndicatorImport}>
      📥 นำเข้าคะแนน
    </Button>

  <Button
  disabled={
    !selectedIndicatorId ||
    !selectedEvaluationId
  }
  onClick={handleClearEvaluation}
  className="bg-red-600 text-white"
  >
  🗑 ล้างรายการประเมินนี้
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
  <th rowSpan="3">รหัส</th>
  <th rowSpan="3">ชื่อ</th>
  {clos.map(clo => (
    <th
      key={clo.id}
colSpan={
  (clo.indicators || []).reduce(
    (sum, ind) =>
      sum +
      Math.max(getEvaluationsByIndicator(ind.id).length, 1), 0
  ) + 1
}
    >
      {clo.code}
    </th>
  ))}
  <th rowSpan="3">ผ่านรายวิชา</th>
</tr>

        {/* ROW 2 */}
<tr>
{clos.map(clo => (
  <React.Fragment
    key={clo.id}
  >
    {(clo.indicators || [])
      .map((ind, idx) => (
        <th
          key={ind.id}
          colSpan={Math.max(
            getEvaluationsByIndicator(ind.id).length,
            1
          )}
          title={`${ind.description}
          Target:${ind.target}%`}
          className="
            border
            text-center
            bg-blue-50
          "
        >
          ID{idx + 1}
        </th>
      ))}
    <th
      rowSpan="2"
      className="border"
    >
      ผ่าน CLO
    </th>
  </React.Fragment>
))}
</tr>

      {/* ROW 3 */}
<tr>
{clos.map(clo => (
  <React.Fragment
    key={clo.id}
  >
    {(clo.indicators || [])
      .flatMap(ind => {
        const evs = getEvaluationsByIndicator(ind.id);
        if (!evs.length) {
          return (
            <th 
              key={`empty_${ind.id}`}
              className="border"
            >
              -
            </th>
          );
        }
        return evs.map(ev => (
          <th
            key={`ev_${ev.id}`}
            className="
              border
              text-xs
            "
          >
            {ev.name}
            ({evaluationFullScoreMap
            [`${ind.id}_${ev.id}`] ?? '-'})
          </th>
        ));
      })
    }
  </React.Fragment>
))}
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
{clos.map(clo => (
  <React.Fragment
    key={`body_${st.id}_${clo.id}`}
  >
    {(clo.indicators || [])
      .flatMap(ind => {
        const evs = getEvaluationsByIndicator(ind.id);
        if (!evs.length) {
          return (
            <td
              key={`empty_${st.id}_${ind.id}`}
              className="border text-center"
            >
              -
            </td>
          );
        }
        return evs.map(ev => {
          const data = indicatorScores?.[st.id]?.[ind.id]?.[ev.id];
          return (
<td
  key={`${st.id}_${ind.id}_${ev.id}`}
  className="border text-center"
>
  <input
    type="number"
    value={data?.score ?? ''}
    className=" w-20 text-center border rounded px-1 "
    onChange={e => handleScoreEdit( st.id, ind.id, ev.id, e.target.value)}
  />
</td>
          );
        });
      })
    }
    <td className="border text-center font-bold">
      {isPassCLO(st.id, clo)
          ? '✅'
          : '❌'
      }
    </td>
  </React.Fragment>
))}

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
