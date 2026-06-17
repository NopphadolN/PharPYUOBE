import React,{ useState, useEffect } from 'react';
import api from '../../services/api';
import InstructorMenu from '../../components/InstructorMenu';
import { Bar } from 'react-chartjs-2';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
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

  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [courseId, setCourseId] = useState('');

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

        return; // ✅ หยุดเลย
      }

      // ✅ ดึง owner
      setOwner(inst.data.owner);

      const instanceId = inst.data.id;

      const cloRes = await api.get('/instructor/clos', {
        params: { course_instance_id: instanceId }
      });

      const stuRes = await api.get('/student/course-students', {
        params: { course_instance_id: instanceId }
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
          labIds: (e.content_ids_lab || []).map(String)
        }))
      );

      // ✅ load scores
      const scoreRes = await api.get('/instructor/clo-scores', {
        params: { course_instance_id: instanceId }
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
  return evaluations.filter(e => {
    const allIds = [
      ...(e.lectureIds || []),
      ...(e.labIds || [])
    ];
    return allIds.some(cid => {
      const content = contents.find(c =>        
        String(c.id) === String(cid) ||
        String(c.order) === String(cid)
      );
      if (!content) return false;
      return (content.cloIds || [])
        .map(String)
        .includes(String(cloId));
    });
  });
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
  const handleSave = async () => {
    const inst = await api.get('/instructor/instance', {
      params: { course_id: courseId, year, semester }
    });
    const course_instance_id = inst.data.id;
if (!inst.data) {
  alert('❌ ยังไม่มี instance');
  return;
}

    // ✅ save score
    await api.post('/instructor/clo-scores', {
      course_instance_id,
      scores
    });

    // ✅ course result
    const results = students.map(st => ({
      course_instance_id,
      student_id: st.id,
      course_id: courseId,
      year,
      semester,
      is_pass: isStudentPassAllCLO(st.id)
    }));

    await api.post('/instructor/save-course-results', {
      results
    });
  };

  // getEvalScoreForCLO
const getEvalScoreForCLO = (e, cloId) => {
  let total = 0;
  contents.forEach(content => {

    // ✅ 1. เช็คว่า content อยู่ใน evaluation
    const isInEval =
  (e.lectureIds || []).includes(String(content.id)) ||
  (e.lectureIds || []).includes(String(content.order)) ||
  (e.labIds || []).includes(String(content.id)) ||
  (e.labIds || []).includes(String(content.order)); 

    if (!isInEval) return;

    // ✅ 2. เช็ค CLO mapping
    const cloList = content.cloIds || [];

    if (!cloList.includes(String(cloId))) return;

    // ✅ 3. คะแนนของ content
    let score = 0;

    if (e.name?.includes('สอบ')) {
      score = Number(content.examScore || content.exam_score || 0);
    } else if (e.name?.includes('งาน')) {
      score = Number(content.workScore || content.work_score || 0);
    }

    // ✅ 4. กระจาย
    total += score / (cloList.length || 1);
  });
  return total;
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

const getStudentMax = (cloId) => {
  const evals = getEvalByCLO(cloId);
  return evals.reduce((sum, e) =>
    sum + getEvalScoreForCLO(e, cloId)   
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

const getTarget = (clo) => {
  if (!clo.indicators?.length) return 50;
  return Math.max(...clo.indicators.map(i => Number(i.target || 50)));
};

const handlePaste = (e) => {
  e.preventDefault();
  const text = e.clipboardData.getData('text');
  // ✅ split rows
  const rows = text.trim().split('\n');
  const cloId = document.getElementById('cloSelect').value;
  const evalId = document.getElementById('evalSelect').value;
  if (!cloId || !evalId) {
    alert('เลือก CLO และ วิธีประเมินก่อน');
    return;
  }
  const updated = { ...scores };
  rows.forEach((row, index) => {
    // ✅ รองรับ excel (tab หรือ ,)
    const cols = row.split(/\t|,/);
    // ✅ ถ้ามี student_code + score
    let studentCode, score;
    if (cols.length >= 2) {
      studentCode = cols[0];
      score = Number(cols[1]);
    } else {
      // ✅ ถ้า paste แค่คะแนน (เรียงตามนักศึกษา)
      const st = students[index];
      if (!st) return;
      studentCode = st.user_code;
      score = Number(cols[0]);
    }
    const student = students.find(s => s.user_code == studentCode);
    if (!student) return;
    if (!updated[student.id]) updated[student.id] = {};
    if (!updated[student.id][cloId]) updated[student.id][cloId] = {};
    updated[student.id][cloId][evalId] = score;
  });
  setScores({ ...updated });  // ✅ force re-render
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
    const student = students.find(s => s.user_code == studentCode);
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

  /* ================= UI ================= */
  return (
    <div>
      <InstructorMenu />

      <div style={{ padding: 20, height: 30 }}>
        <h2>📊 CLO Assessment</h2>

        {/* FILTER */}
        <select style={{ height: 30 }} onChange={e => setYear(e.target.value)}>
          <option>ปี</option>
          <option>2569</option>
          <option>2570</option>
          <option>2571</option>
          <option>2572</option>
          <option>2573</option>
        </select>

        <select style={{ marginLeft:5, height: 30 }} onChange={e => setSemester(e.target.value)}>
          <option>เทอม</option>
          <option>1</option>
          <option>2</option>
        </select>

        <select style={{ marginLeft:5,  height: 30 }} onChange={e => setCourseId(e.target.value)}>
          <option>วิชา</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>
              {c.code_en} - {c.name_th}
            </option>
          ))}
        </select>
<hr/>
{clos.length > 0 && students.length > 0 && (
  <div style={{ width: 500, marginTop: 30 }}>
    <h3>📊 Average CLO (Class)</h3>
    <Bar data={barData} options={barOptions} />
  </div>
)}

{owner && (
  <div>
    👑 ผู้รับผิดชอบ: {owner.name_th}
  </div>
)}
{!isOwner && (
  <div style={{ color: 'red' }}>
    🔒 คุณไม่มีสิทธิ์แก้ไข
  </div>
)}

        {/* CONTROL */}
        <div style={{ marginTop: 10 }}>
          <select disabled={!isOwner} style={{ marginLeft:5, height: 30 }} id="cloSelect">
            <option>เลือก CLO</option>
            {clos.map(c => (
              <option key={c.id} value={c.id}>{c.code}</option>
            ))}
          </select>

          <select disabled={!isOwner} style={{ marginLeft:5, height: 30 }} id="evalSelect">
            <option>เลือกวิธีประเมิน</option>
            {evaluations.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>

          <textarea
            disabled={!isOwner}
            rows={4}
            style={{ width: 100, marginLeft: 5 }}
            placeholder="วางคะแนนจาก Excel"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <button disabled={!isOwner} onClick={handleImport}>
            นำเข้าคะแนน
          </button>
        </div>

<h3>ตารางคะแนน</h3>
{!clos.length && (
  <div style={{ color: 'red', marginTop: 10 }}>
    ❌ ยังไม่มีข้อมูล CLO ของวิชานี้
  </div>
)}
{/* ================= TABLE ================= */}
<table border="1" width="100%" cellPadding="5">
  <thead>
    {/* HEADER ROW 1 */}
    <tr>
      <th rowSpan="3">รหัส นศ.</th>
      <th rowSpan="3">ชื่อ</th>

      <th rowSpan="3">
        กรอกคะแนน<br/>
        <button disabled={!isOwner} onClick={handleApplyScore}>➕</button>
      </th>

      {clos.map(clo => {
        const evals = getEvalByCLO(clo.id);
        return (
          <th key={clo.id} colSpan={evals.length + 2}>
            {clo.code}
          </th>
        );
      })}

      <th rowSpan="3">ผ่าน</th>
    </tr>

    {/* HEADER ROW 2 */}
    <tr>
      {clos.map(clo => {
        const evals = getEvalByCLO(clo.id);
        return evals.map(e => (
          <th key={clo.id + '-' + e.id}>
            <div style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)'
            }}>
              {e.name}
            </div>
          </th>
        )).concat([
          <th key={clo.id + '-total'}>รวม</th>,
          <th key={clo.id + '-percent'}>%</th>
        ]);
      })}
    </tr>

    {/* HEADER ROW 3 */}
    <tr>
      {clos.map(clo => {
        const evals = getEvalByCLO(clo.id);
        const totalMax = evals.reduce((sum, e) =>       
        sum + getEvalScoreForCLO(e, clo.id)
        ,0);
        return evals.map(e => (
          <th key={'max-' + e.id}>
            {getEvalScoreForCLO(e, clo.id).toFixed(2)}
          </th>
        )).concat([
          <th key={'sum-' + clo.id}>{totalMax.toFixed(2)}</th>,
          <th key={'blank-' + clo.id}></th>
        ]);
      })}
    </tr>
  </thead>

  <tbody>

    {students.map(st => (
      <tr key={st.id}>
        <td>{st.user_code}</td>
        <td>{st.name_th}</td>
        <td>
          <input
            type="number"
            value={inputScores[st.id] || ''}
            onChange={(e) =>
              setInputScores({
                ...inputScores,
                [st.id]: e.target.value
              })
            }
            style={{ width: 50 }}
          />
        </td>

        {clos.map(clo => {
          const evals = getEvalByCLO(clo.id);
          const total = evals.reduce((sum, e) =>
            sum + Number(scores?.[st.id]?.[clo.id]?.[e.id] || 0)
          , 0);
          const max = evals.reduce((s, e) =>            
          s + getEvalScoreForCLO(e, clo.id)
          ,0);
          const percent = max === 0 ? 0 : (total / max) * 100;
          const target = clo.indicators?.length
            ? Math.max(...clo.indicators.map(i => Number(i.target || 50)))
            : 50;
          return evals.map(e => (
            <td key={st.id + '-' + e.id}>
              {scores?.[st.id]?.[clo.id]?.[e.id] !== undefined
                ? Number(scores[st.id][clo.id][e.id]).toFixed(2)
                : ''}
            </td>
          )).concat([
            <td key={st.id + '-total'}>{total.toFixed(2)}</td>,
            <td key={st.id + '-percent'}
              style={{
                color: percent >= target ? 'green' : 'red',
                fontWeight: 'bold'
              }}>
              {percent.toFixed(2)}
            </td>
          ]);

        })}
        <td style={{
          textAlign: 'center',
          fontWeight: 'bold',
          color: isStudentPassAllCLO(st.id) ? 'green' : 'red'
        }}>
          {isStudentPassAllCLO(st.id) ? 'PASS' : '❌'}
        </td>
      </tr>
    ))}
  </tbody>
</table>

        <button disabled={!isOwner}
  style={{ marginTop: 10 }}
  onClick={async () => {
    const inst = await api.get('/instructor/instance', {
      params: { course_id: courseId, year, semester }
    });
    const course_instance_id = inst.data.id;

    /* ✅ 1. Save scores */
    await api.post('/instructor/clo-scores', {
      course_instance_id,
      scores
    });

    /* ✅ 2. Build CLO detail (ใช้สูตรใหม่) */
    const cloDetail = buildCLODetails(course_instance_id);

    /* ✅ 3. Save CLO result */
    await api.post('/instructor/save-clo-results', {
      data: cloDetail
    });

    /* ✅ 4. Build course result */
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

    /* ✅ 5. Save course result */
    await api.post('/instructor/save-course-results', {
      results
    });

    alert('✅ บันทึกครบ (คะแนน + CLO + PASS)');

  }}
>
  💾 Save คะแนน
</button>

      </div>
    </div>
  );
}
