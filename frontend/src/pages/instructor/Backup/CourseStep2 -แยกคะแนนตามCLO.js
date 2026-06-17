import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useLocation, useNavigate } from 'react-router-dom';
import InstructorMenu from '../../components/InstructorMenu';

export default function CourseStep2() {

  const location = useLocation();
  const navigate = useNavigate();

  const { course_id, year, semester } = location.state || {};
  const [showDropdown, setShowDropdown] = useState(false);

  /* =========================
     BASIC
  ========================= */
  const [prereq, setPrereq] = useState('');
  const [courseType, setCourseType] = useState('');

  /* =========================
     TEACHERS
  ========================= */
  const [instructors, setInstructors] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [guestTeachers, setGuestTeachers] = useState([]);

  const [showPopup, setShowPopup] = useState(false);
  const [search, setSearch] = useState('');
  

  /* =========================
     CLO
  ========================= */
  const [clos, setClos] = useState([]);
  
  /* =========================
     CONTENT
  ========================= */
  const [contents, setContents] = useState([]);

  const [currentContent, setCurrentContent] = useState({
    id: null,
    type: 'lecture',

    date: '',
    order: '',
    topic: '',
    hours: '',
    instructor: '',
    cloIds: [],
    examScore: '',
    workScore: ''
  });

  /* =========================
     EVALUATION
  ========================= */
  const [evaluations, setEvaluations] = useState([]);
  const [currentEval, setCurrentEval] = useState({
    name: '',
    type: '',   
    tool: '', 
    week: '',
    contentIds: [],    
    lectureIds: [],
    labIds: [],
    total: 0
  });

// กดข้างนอกปิด popup //


  /* =========================
     LOAD DATA
  ========================= */
  useEffect(() => {

    api.get('/instructor/users')
      .then(res => setInstructors(res.data));

    (async () => {
      try {

        const res = await api.get('/instructor/instance', {
          params: { course_id, year, semester }
        });
        if (res.data) {
          setPrereq(res.data.prerequisite || '');
          setCourseType(res.data.course_type || '');
          setSelectedTeachers(res.data.instructors || []);
          setGuestTeachers(res.data.guestTeachers || []);
          setContents(
            (res.data.contents || []).map(c => ({
            ...c,
            type: (c.type || '').toLowerCase(),
            instructor:             
                c.guest_instructor
                ? c.guest_instructor
                : c.instructor_id,
            order: c.order || '',
            examScore: c.exam_score || '',
            workScore: c.work_score || '',
            cloIds: Array.isArray(c.clo_ids) ? c.clo_ids : []
            }))
            );
          setEvaluations(
            (res.data.evaluations || []).map(e => ({
            ...e,
            lectureIds: (e.content_ids_lecture || []).map(String),
            labIds: (e.content_ids_lab || []).map(String)
            }))
            );
          const cloRes = await api.get('/instructor/clos', {
            params: { course_instance_id: res.data.id }
          });

          setClos(cloRes.data);

        }

      } catch (err) {
        console.error(err);
      }
    })();

  }, []);

  /* =========================
     TEACHER
  ========================= */
  const addTeacher = (t) => {
    if (!selectedTeachers.find(x => x.id === t.id)) {
      setSelectedTeachers([...selectedTeachers, t]);
    }
    setShowPopup(false);
  };

  const removeTeacher = (id) => {
    setSelectedTeachers(prev =>
      prev.filter(t => t.id !== id)
    );
  };

  /* =========================
     CONTENT CRUD
  ========================= */
  const handleAddContent = () => {

    if (currentContent.id) {
      setContents(prev =>
        prev.map(c =>
          c.id === currentContent.id ? currentContent : c
        )
      );
    } else {
      setContents([
        ...contents,
        { ...currentContent, id: Date.now() }
      ]);
    }

    setCurrentContent({
      id: null,
      type: 'lecture',
 
      date: '',
      order: '',
      topic: '',
      hours: '',
      instructor: '',
      cloIds: [],
      examScore: '',
      workScore: ''
    });
  };

  const editContent = (c) => setCurrentContent(c);

  const deleteContent = (id) => {
    setContents(prev => prev.filter(c => c.id !== id));
  };

  /* =========================
     SUM
  ========================= */
  const sumHours = (type) =>
    contents
      .filter(c => c.type === type)
      .reduce((s, c) => s + Number(c.hours || 0), 0);

  const totalExamScore = contents.reduce(
    (s, c) => s + Number(c.examScore || 0), 0
  );

  const totalWorkScore = contents.reduce(
    (s, c) => s + Number(c.workScore || 0), 0
  );

  /* =========================
     EVAL CALC
  ========================= */
const calculateTotal = (lectureIds, labIds) => {
  const allIds = [...lectureIds, ...labIds];
  return contents
    .filter(c => allIds.includes(String(c.order)))
    .reduce((sum, c) => {
      if (currentEval.type === 'สอบ') {
        return sum + Number(c.examScore || 0);
      }
      if (currentEval.type === 'งาน') {
        return sum + Number(c.workScore || 0);
      }
      return sum;
    }, 0);
};

const addEval = () => {
  const newData = {
    ...currentEval,    
    tool: currentEval.tool,   // ✅ เพิ่ม
    week: currentEval.week, 
    content_ids_lecture: currentEval.lectureIds,
    content_ids_lab: currentEval.labIds
  };
  if (currentEval.id !== undefined && currentEval.id !== null) {
    // UPDATE
    setEvaluations(prev =>
      prev.map((e, i) =>
        i === currentEval.id ? newData : e
      )
    );
  } else {
    setEvaluations(prev => [...prev, newData]);
    // INSERT
    setEvaluations([...evaluations, newData]);
  }
  setCurrentEval({
    name: '',
    type: '',    
    tool: '',
    week: '',
    lectureIds: [],
    labIds: [],
    total: 0
  });
};
  const totalEval = evaluations.reduce(
    (s, e) => s + Number(e.total || 0), 0
  );

  // calculateCLO
const getEvalCloScore = (evalObj, cloId) => {

  let total = 0;

  const contentIds = [
    ...(evalObj.lectureIds || []),
    ...(evalObj.labIds || [])
  ];

  contentIds.forEach(cid => {

    const content = contents.find(c =>
      String(c.order) === String(cid)
    );

    if (!content) return;

    const cloList = content.cloIds || [];

    if (!cloList.includes(String(cloId))) return;

    let score = 0;

    // ✅ ใช้คะแนนจริงจาก content
    if (evalObj.type === 'สอบ') {
      score = Number(content.examScore || content.exam_score || 0);
    } else if (evalObj.type === 'งาน') {
      score = Number(content.workScore || content.work_score || 0);
    }

    total += score / (cloList.length || 1);

  });
  return total;
};

  /* =========================
     SAVE
  ========================= */
  const handleSave = async () => {
  // ✅ ✅ ✅ แปลง instructor ให้ถูกต้องก่อนส่ง
  const cleanContents = contents.map(c => {
  if (!isNaN(Number(c.instructor))) {
    return {
      ...c,
      instructor_id: Number(c.instructor),
      guest_instructor: null
    };
  }
  return {
    ...c,
    instructor_id: null,
    guest_instructor: c.instructor
  };
  });
    await api.post('/instructor/instance', {
      course_id,
      year,
      semester,
      prerequisite: prereq,
      course_type: courseType,
      instructors: selectedTeachers,
      contents: cleanContents,
      evaluations,
      guestTeachers
    });

    alert('✅ บันทึกแล้ว');
    
    // ✅ ✅ ✅ โหลดข้อมูลใหม่
    const res = await api.get('/instructor/instance', {
      params: { course_id, year, semester }
    });

    if (res.data) {  
    setContents(
    (res.data.contents || []).map(c => ({
      ...c,
      type: (c.type || '').toLowerCase(),
      instructor: 
                c.guest_instructor
              ? c.guest_instructor
              : c.instructor_id,
      order: c.order || '',
      examScore: c.exam_score || '',
      workScore: c.work_score || '',
      cloIds: Array.isArray(c.clo_ids) ? c.clo_ids : []
    }))
  );
    setEvaluations(
    (res.data.evaluations || []).map(e => ({
      ...e,
      lectureIds: (e.content_ids_lecture || []).map(String),
      labIds: (e.content_ids_lab || []).map(String)
    }))
  );

    }
};
 
  /* =========================
     NAV
  ========================= */
  const goBack = () => {
    navigate('/instructor/course', {
      state: { course_id, year, semester }
    });
  };

  const goNext = () => {
    navigate('/next-step', { state: { course_id, year, semester } });
  };

  const formatDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  date.setHours(0,0,0,0);
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear() + 543;  // ✅ แปลงเป็น พ.ศ.
  const monthNames = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
    'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
    'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  return `${day} ${monthNames[month]} ${year}`;
};
  
  const editEval = (e, index) => {
  setCurrentEval({
    ...e,
    id: index,
    lectureIds: (e.content_ids_lecture || []).map(String),
    labIds: (e.content_ids_lab || []).map(String),
    total: e.total
  });
  };

  const deleteEval = (index) => {
  setEvaluations(prev =>
    prev.filter((_, i) => i !== index)
  );
  };

  const totalEvalScore = evaluations.reduce(
  (sum, e) => sum + Number(e.total || 0),
  0
  );

// CalCloSummary
const getCloSummary = () => {
  const result = {};
  contents.forEach(c => {
    const cloList = c.cloIds || [];
    const exam = Number(c.examScore || 0);
    const work = Number(c.workScore || 0);
    cloList.forEach(cloId => {
      if (!result[cloId]) {
        result[cloId] = {
          exam: 0,
          work: 0
        };
      }
      const share = 1 / cloList.length;
      result[cloId].exam += exam * share;
      result[cloId].work += work * share;
    });
  });
  return result;
}; 
const cloSummary = getCloSummary();

/* =========================
   CALCULATE TABLE DATA
========================= */
let rows = [];          // ✅ declare ก่อน
let totalByCLO = {};    // ✅ declare ก่อน
if (evaluations.length > 0 && contents.length > 0) {
const grouped = {};
evaluations.forEach(e => {
  const allIds = [
    ...(e.lectureIds || []),
    ...(e.labIds || [])
  ];
  allIds.forEach(cid => {
    const content = contents.find(c => String(c.order) === String(cid));
    if (!content) return;
    (content.cloIds || []).forEach(cloId => {
      const key = `${cloId}_${e.type}`;
      if (!grouped[key]) {
        grouped[key] = {
          cloId,
          type: e.type,
          lecture: [],
          lab: [],
          score: 0
        };
      }
      if ((e.lectureIds || []).includes(String(cid))) {
        grouped[key].lecture.push(content.order);
      }
      if ((e.labIds || []).includes(String(cid))) {
        grouped[key].lab.push(content.order);
      }
      grouped[key].score += Number(e.total || 0);
    });
  });
});
  rows = Object.values(grouped);
  rows.forEach(r => {
    totalByCLO[r.cloId] =
      (totalByCLO[r.cloId] || 0) + r.score;
  });
}

  const renderTable = (type, title) => {
/* =========================
   UI
========================= */
    return (
    <>
      <h3>{title}</h3>
      <table
        border="1"
        cellPadding="5"
        style={{
        width: '100%',
        tableLayout: 'auto',   // ✅ ให้ขนาด auto ตาม content
        borderCollapse: 'collapse'
      }}
      >
        <thead>
        <tr>
          <th style={{ whiteSpace: 'nowrap' }}>ลำดับ</th>
          <th>CLO</th>
          <th style={{ whiteSpace: 'nowrap' }}>วันที่</th>
          <th style={{ minWidth: 120 }}>หัวข้อ</th>
          <th style={{ whiteSpace: 'nowrap' }}>ชม</th>
          <th style={{ minWidth: 120 }}>อาจารย์</th>
          <th style={{ whiteSpace: 'nowrap' }}>สอบ</th>
          <th style={{ whiteSpace: 'nowrap' }}>งาน</th>
          <th style={{ whiteSpace: 'nowrap' }}>แก้ไข/ลบ</th>
        </tr>
        </thead>
        <tbody>
          {contents
            .filter(c => c.type === type)
            .map(c => (
              <tr key={c.id}>
              <td style={{ whiteSpace: 'nowrap' }}>{c.order}</td>
              <td>
                {c.cloIds?.map(id => 
                clos.find(x => x.id == id)?.code + ' '
                )}
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
                {formatDate(c.date)}
              </td>
              {/* ✅ ✅ หัวข้อ auto wrap */}
              <td style={{
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  maxWidth: 350
                }}>
                  {c.topic}
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>{c.hours}</td>
<td>
{
  typeof c.instructor === 'number'
    ? selectedTeachers.find(t => t.id == c.instructor)?.name_th
    : c.instructor
}
</td>
              <td style={{ whiteSpace: 'nowrap' }}>{c.examScore}</td>
              <td style={{ whiteSpace: 'nowrap' }}>{c.workScore}</td>
                <td>
                  <button onClick={() => editContent(c)}>✏️</button>
                  <button style={{ marginLeft: 5 }} onClick={() => deleteContent(c.id)}>❌</button>
                </td>
              </tr>
          ))}
        </tbody>
      </table>
      <p>
        รวมชั่วโมง: {
          contents
            .filter(c => c.type === type)
            .reduce((s, c) => s + Number(c.hours || 0), 0)
        }
      </p>
    </>
  );
};

  /* =========================
     UI
  ========================= */
  return (
    <div>
      <InstructorMenu />

      <div style={{ padding: 20 }}>

        <h2>Step2: Teaching Plan</h2>

        {/* ================= BASIC ================= */}
        <h4>เงื่อนไขก่อนเรียน</h4>
        <input
          placeholder="เงื่อนไขก่อนเรียน"
          style={{ minWidth: 80, height: 25 }}
          value={prereq}
          onChange={e => setPrereq(e.target.value)}
        />

        <select value={courseType}
          style={{ marginLeft: 5, height: 30 }}
          onChange={e => setCourseType(e.target.value)}
        >
          <option value="">-- ประเภท --</option>
          <option>กลุ่มพื้นฐานวิชาชีพ</option>
          <option>กลุ่มวิชาชีพบังคับด้านผู้ป่วย</option>
          <option>กลุ่มวิชาชีพบังคับด้านผลิตภัณฑ์</option>
          <option>กลุ่มวิชาชีพบังคับด้านสังคม</option>
          <option>กลุ่มวิชาชีพเลือก</option>
          <option>ฝึกปฏิบัติงาน</option>
        </select>

        {/* ================= TEACHER ================= */}
        <h3>อาจารย์</h3>

        <button onClick={() => setShowPopup(true)}>➕ เพิ่ม</button>

        {selectedTeachers.map(t => (
          <div key={t.id}>
            {t.name_th}
            <button style={{ marginLeft: 5 }} onClick={() => removeTeacher(t.id)}>❌</button>
          </div>
        ))}

        {showPopup && (
          <div onClick={() => setShowPopup(false)}
            style={{ position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(0,0,0,0.4)' }}>
            <div onClick={e => e.stopPropagation()}
              style={{ background:'#fff',padding:20,width:400,margin:'100px auto' }}>
              
              <input value={search} onChange={e => setSearch(e.target.value)} />

              {instructors
                .filter(i => i.name_th.includes(search))
                .map(i => {
                  const already = selectedTeachers.find(x => x.id === i.id);
                  return (
                    <div key={i.id}>
                      {i.name_th}
                      <button
                        disabled={already}
                        onClick={() => addTeacher(i)}
                      >
                        {already ? '✔' : 'เพิ่ม'}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ================= GUEST ================= */}
<h4>อาจารย์พิเศษ</h4>
<input
  placeholder="พิมพ์ชื่อแล้ว Enter"
  style={{ minWidth: 350, height: 25 }}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      setGuestTeachers([...guestTeachers, e.target.value]);
      e.target.value = '';
    }
  }}
/>
{/* ✅ ✅ แสดง list */}
{guestTeachers.map((g, i) => (
  <div key={i} style={{ 
    minWidth: 350, 
    height: 30,
    marginTop: 2 
    }}>

    {/* ✅ แก้ไข */}
    <input
      value={g}
      onChange={(e) => {
        const updated = [...guestTeachers];
        updated[i] = e.target.value;
        setGuestTeachers(updated);
      }}
      style={{ padding: 4 }}
    />
    {/* ✅ ลบ */}
    <button style={{ marginLeft: 5 }}
      onClick={() =>
        setGuestTeachers(guestTeachers.filter((_, idx) => idx !== i))
      }
    >
      ❌
    </button>
  </div>
))}

        <hr />

        {/* ================= CONTENT INPUT ================= */}
        <h3>เพิ่มหัวข้อสอน</h3>

<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-start' }}>
  {/* TYPE */}
  <select
    value={currentContent.type}
    style={{ 
      minHeight: 35
    }}
    onChange={e => setCurrentContent({ ...currentContent, type: e.target.value })}
  >
    <option value="lecture">บรรยาย</option>
    <option value="lab">ปฏิบัติ</option>
  </select>
  {/* DATE */}
  <input
    style={{ 
      minHeight: 32 
    }}
    type="date"
    value={currentContent.date}
    onChange={e => setCurrentContent({ ...currentContent, date: e.target.value })}
  />
  {/* ORDER */}
  <input
    placeholder="ลำดับ"
    style={{ 
      width: 50, 
      minHeight: 30 
    }}
    value={currentContent.order}
    onChange={e => setCurrentContent({ ...currentContent, order: e.target.value })}
  />
  {/* ✅ ✅ ✅ TOPIC → ขยายเฉพาะตัวนี้ */}
  <textarea
    placeholder="หัวข้อ"
    value={currentContent.topic}
    onChange={e => setCurrentContent({ ...currentContent, topic: e.target.value })}
    style={{
      width: 400,
      minHeight: 20,
      resize: 'vertical'
    }}
  />
  {/* HOURS */}
  <input
    placeholder="ชม"
    type="number"
    step="0.1"
    style={{ 
      width: 50, 
      minHeight: 30 
    }}
    value={currentContent.hours}
    onChange={e => setCurrentContent({ ...currentContent, hours: e.target.value })}
  />
  {/* INSTRUCTOR */}
  <select
    style={{  
      minHeight: 35 
    }}
    value={currentContent.instructor}        
onChange={e => {
  const val = e.target.value;
  setCurrentContent({
    ...currentContent,
    instructor: !isNaN(val) ? Number(val) : val
  });
}}
  >
    <option value="">-- อาจารย์ --</option>    
{/* ✅ อ.ประจำ */}
{selectedTeachers.map(t => (
  <option key={t.id} value={t.id}>
    {t.name_th}
  </option>
))}
{/* ✅ อ.พิเศษ */}
{guestTeachers.map((g, i) => (
  <option key={'g'+i} value={g}>
    {g}
  </option>
))}

  </select>

  {/* ✅ ✅ ✅ CLO → dropdown แถวเดียว */}
   <div style={{ position: 'relative', minWidth: 200 }}>
  {/* ✅ ปุ่ม dropdown */}
  <div
    onClick={() => setShowDropdown(!showDropdown)}
    style={{
      border: '1px solid #ccc',
      padding: 6,
      background: '#fff',
      cursor: 'pointer'
    }}
  >
    {currentContent.cloIds.length > 0
      ? currentContent.cloIds
          .map(id => clos.find(c => c.id == id)?.code)
          .join(', ')
      : 'เลือก CLO'}
  </div>
  {/* ✅ dropdown panel */}
  {showDropdown && (
    <div style={{
      position: 'absolute',
      top: '100%',
      left: 0,
      width: '100%',
      maxHeight: 150,
      overflowY: 'auto',
      border: '1px solid #ccc',
      background: '#fff',
      zIndex: 10
    }}>
      {clos.map(c => {
        const checked = currentContent.cloIds.includes(String(c.id));
        return (
          <label key={c.id} style={{ display: 'block', padding: 5 }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                let updated = [...currentContent.cloIds];
                if (e.target.checked) {
                  updated.push(String(c.id));
                } else {
                  updated = updated.filter(id => id !== String(c.id));
                }
                setCurrentContent({
                  ...currentContent,
                  cloIds: updated
                });
              }}
            />
            {c.code}
          </label>
        );
      })}
    </div>
  )}
</div>


  {/* SCORE */}
  <input
    placeholder="สอบ"    
    type="number"
    step="0.1"
    style={{ 
      width: 60, 
      minHeight: 30 
    }}
    value={currentContent.examScore}
    onChange={e => setCurrentContent({ ...currentContent, examScore: e.target.value })}
  />

  <input
    placeholder="งาน"    
    type="number"
    step="0.1"
    style={{ 
      width: 60, 
      minHeight: 30 
    }}
    value={currentContent.workScore}
    onChange={e => setCurrentContent({ ...currentContent, workScore: e.target.value })}
  />

</div>

        <button onClick={handleAddContent}>
          ✅ เพิ่ม / บันทึก
        </button>

        {/* ================= TABLE ================= */}
    <hr />
      {/* ✅ ✅ ✅ ใส่ตรงนี้ */}
      {renderTable('lecture', '📘 บรรยาย')}
      {renderTable('lab', '🧪 ปฏิบัติ')}
    <hr />    
  
        {/* ================= EVALUATION ================= */}
        <h3>📊 สัดส่วนคะแนน</h3>

<select
  value={currentEval.name}
  onChange={e => setCurrentEval({
    ...currentEval,
    name: e.target.value
  })}
  style={{ width: 180, height: 30 }}
>
  <option value="">-- เลือกวิธีประเมิน --</option>
  <option>สอบย่อย</option>
  <option>สอบกลางภาค</option>
  <option>สอบปลายภาค</option>
  <option>นำเสนอ</option>
  <option>งานมอบหมาย</option>
  <option>ปฏิบัติ</option>
  <option>สอบปฏิบัติ</option>
  <option>พฤติกรรม</option>
</select>

        <select
          value={currentEval.type}
          style={{ 
              height: 30, marginLeft: 5 
          }}
          onChange={e => setCurrentEval({...currentEval,type:e.target.value})}
        >
          <option value="">-- ประเภทคะแนน --</option>
          <option>สอบ</option>
          <option>งาน</option>
          <option>ผ่าน/ไม่ผ่าน</option>
        </select>

{/* ✅ เครื่องมือ */}
<select
  value={currentEval.tool}
  onChange={e =>
    setCurrentEval({ ...currentEval, tool: e.target.value })
  }
  style={{ marginLeft: 5, height: 30 }}
>
  <option value="">-- เครื่องมือ --</option>
  <option>ข้อสอบ</option>
  <option>แบบบันทึกการเข้าชั้นเรียน</option>
  <option>แบบให้คะแนน</option>
  <option>แบบประเมิน</option>
</select>

{/* ✅ สัปดาห์ */}
<input
  placeholder="สัปดาห์"
  value={currentEval.week}
  onChange={e =>
    setCurrentEval({ ...currentEval, week: e.target.value })
  }
  style={{ width: 100, marginLeft: 5, height: 25 }}
/>

<h4>📘 หัวข้อบรรยาย</h4>
<select
  multiple
  size={1}
  style={{ minWidth: 220, height: 30 }}
  value={currentEval.lectureIds}
  onChange={(e) => {
    const ids = Array.from(e.target.selectedOptions, o => o.value);
    const total = calculateTotal(ids, currentEval.labIds);
    setCurrentEval({
      ...currentEval,
      lectureIds: ids,
      total
    });
  }}
>
  {contents
    .filter(c => c.type === 'lecture')
    .map(c => (
      <option key={c.id} value={c.order}>
        {c.order}
      </option>
  ))}
</select>

<h4>🧪 หัวข้อปฏิบัติ</h4>
<select
  multiple
  size={1}
  style={{ minWidth: 220, height: 30 }}
  value={currentEval.labIds}
  onChange={(e) => {
    const ids = Array.from(e.target.selectedOptions, o => o.value);
    const total = calculateTotal(currentEval.lectureIds, ids);
    setCurrentEval({
      ...currentEval,
      labIds: ids,
      total
    });

  }}
>
  {contents
    .filter(c => c.type === 'lab')
    .map(c => (
      <option key={c.id} value={c.order}>
        {c.order}
      </option>
  ))}
</select>

<h4>รวมคะแนน</h4>
<input
  value={currentEval.total}
  readOnly
  style={{ width: 80, height: 25 }}
/>
        <button onClick={addEval}
        style={{ marginLeft: 5, height: 30 }}
        >➕ เพิ่ม
        </button>

<h4>รายการสัดส่วนคะแนน</h4>
<table border="1" width="100%">
  <thead>
  <tr>
    <th rowSpan="2">วิธีการประเมิน</th>
    <th rowSpan="2">CLO</th>
    <th rowSpan="2">คะแนน</th>
    <th colSpan="2">หัวข้อ</th>   {/* ✅ */}
    <th rowSpan="2">เครื่องมือ</th>
    <th rowSpan="2">สัปดาห์</th>
    <th rowSpan="2">แก้ไข</th>   {/* ✅ เพิ่ม */}
  </tr>
  <tr>
    <th>บรรยาย</th>   {/* ✅ */}
    <th>ปฏิบัติ</th>
  </tr>
  </thead>

  <tbody>
{evaluations.flatMap((e, index) => {
  const cloSet = new Set();
  // ✅ ดึง CLO จาก content
  [...(e.lectureIds || []), ...(e.labIds || [])].forEach(cid => {
    const c = contents.find(x => String(x.order) === String(cid));
    if (c) {
      (c.cloIds || []).forEach(cloId => cloSet.add(cloId));
    }
  });
  const cloIds = Array.from(cloSet);
  return cloIds.map((cloId, i) => {
    const cloCode = clos.find(c => c.id == cloId)?.code;
    return (
      <tr key={`${index}_${i}`}>
        {/* ✅ วิธีการประเมิน */}
        {i === 0 && (
          <td rowSpan={cloIds.length}>{e.name}</td>
        )}

        {/* ✅ CLO */}
        <td>{cloCode}</td>

        {/* ✅ คะแนน */}       
        <td>
          {getEvalCloScore(e, cloId).toFixed(2)}
        </td>

        {/* ✅ lecture */}
        {i === 0 && (
          <td rowSpan={cloIds.length}>
            {(e.lectureIds || []).map(id => {
              const c = contents.find(x => String(x.order) === String(id));
              return c?.order;
            }).join(', ')}
          </td>
        )}

        {/* ✅ lab */}
        {i === 0 && (
          <td rowSpan={cloIds.length}>
            {(e.labIds || []).map(id => {
              const c = contents.find(x => String(x.order) === String(id));
              return c?.order;
            }).join(', ')}
          </td>
        )}

        {/* ✅ tool */}
        {i === 0 && (
          <td rowSpan={cloIds.length}>{e.tool}</td>
        )}
        {/* ✅ week */}
        {i === 0 && (
          <td rowSpan={cloIds.length}>{e.week}</td>
        )}
        {/* ✅ edit/delete */}
        {i === 0 && (
          <td rowSpan={cloIds.length}>
          <button onClick={() => editEval(e, index)}>✏️</button>
          <button
            onClick={() => deleteEval(index)}
            style={{ marginLeft: 5 }}
         >
           ❌
        </button>
        </td>
        )}
      </tr>
    );
  });
})}
  </tbody>
<tr style={{ background: '#f5f5f5' }}>
  <td
    colSpan="2"
    style={{ fontWeight: 'bold', textAlign: 'left' }}
  >
    รวม
  </td>

  {/* ✅ รวมเฉพาะคะแนน */}
  <td style={{ fontWeight: 'bold' }}>
    {evaluations.reduce((sum, e) =>
      sum + Number(e.total || 0), 0
    )}
  </td>

  {/* ✅ ช่องที่เหลือเว้น */}
  <td></td>
  <td></td>
  <td></td>
  <td></td>
  <td></td>
</tr>  
</table>

<h3>สรุปคะแนน CLO</h3>
<table border="1" cellPadding="5" width="100%">
  <thead>
    <tr>
      <th>CLO</th>
      <th>รายละเอียด</th>
      <th>คะแนนสอบ</th>
      <th>คะแนนงาน</th>
      <th>คะแนนรวม</th>
    </tr>
  </thead>
  <tbody>

    {clos.map(clo => {

      const sum = cloSummary[clo.id] || { exam: 0, work: 0 };

      const total = sum.exam + sum.work;

      return (
        <tr key={clo.id}>
          <td>{clo.code}</td>
          <td>{clo.description}</td>
          <td>{sum.exam.toFixed(2)}</td>
          <td>{sum.work.toFixed(2)}</td>
          <td><b>{total.toFixed(2)}</b></td>
        </tr>
      );

    })}

    {/* ✅ row total */}
    <tr>
      <td colSpan="2"><b>รวม</b></td>

      <td>
        {Object.values(cloSummary)
          .reduce((a,b)=>a+b.exam,0)
          .toFixed(2)}
      </td>

      <td>
        {Object.values(cloSummary)
          .reduce((a,b)=>a+b.work,0)
          .toFixed(2)}
      </td>

      <td>
        {Object.values(cloSummary)
          .reduce((a,b)=>a+b.exam + b.work,0)
          .toFixed(2)}
      </td>

    </tr>

  </tbody>

</table>

        <hr />
        <button onClick={handleSave}
        style={{ marginLeft: 5, height: 30 }}>💾 บันทึก</button>
        <button onClick={goBack}
        style={{ marginLeft: 5, height: 30 }}>⬅ กลับ CLO</button>
        <button onClick={goNext}
        style={{ marginLeft: 5, height: 30 }}>➡ ถัดไป</button>

      </div>
    </div>
  );
}