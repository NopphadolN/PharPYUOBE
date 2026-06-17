import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useLocation, useNavigate } from 'react-router-dom';
import InstructorMenu from '../../components/InstructorMenu';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

export default function CourseStep2() {

  const location = useLocation();
  const navigate = useNavigate();

  const { course_id, year, semester } = location.state || {};
  const [showDropdown, setShowDropdown] = useState(false);
  const [instanceId, setInstanceId] = useState(null);
  
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

// owner //
  const [owner, setOwner] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get('/instructor/me')
      .then(res => setUser(res.data))
      .catch(console.error);
    }, []);

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
          setOwner(res.data.owner);
          setContents(
            (res.data.contents || []).map(c => ({
            ...c,
            type: (c.type || '').toLowerCase(),
            instructor:             
                c.guest_teacher_name
                ? c.guest_teacher_name
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
    .filter(c => allIds.includes(String(c.id)))
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
      String(c.id) === String(cid)
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
      guest_teacher_name: null 
    };
  }
  return {
    ...c,
    instructor_id: null,
    guest_teacher_name: c.instructor
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
                c.guest_teacher_name
              ? c.guest_teacher_name
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
    if (!window.confirm('บันทึกเสร็จแล้วหรือไม่ ก่อนกดกลับ')) return;
    navigate('/instructor/course', {
      state: { course_id, year, semester }
    });
  };

  const goNext = () => {
    if (!window.confirm('บันทึกเสร็จแล้วหรือไม่ ก่อนกดถัดไป')) return;
    navigate('/instructor/book', { state: { course_id, year, semester } });
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
    const content = contents.find(c => String(c.id) === String(cid));
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
        grouped[key].lecture.push(content.id);
      }
      if ((e.labIds || []).includes(String(cid))) {
        grouped[key].lab.push(content.id);
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
   UI table
========================= */
    return (
    <>
      <h3>{title}</h3>      
<div className="overflow-x-auto">
  <table className="w-full text-sm border rounded-lg overflow-hidden">

    <thead className="bg-gray-100">
      <tr>
        <th className="p-2">ลำดับ</th>
        <th className="p-2">CLO</th>
        <th className="p-2">วันที่</th>
        <th className="p-2">หัวข้อ</th>
        <th className="p-2">ชม</th>
        <th className="p-2">อาจารย์</th>
        <th className="p-2">สอบ</th>
        <th className="p-2">งาน</th>
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
                  <button disabled={!isOwner} onClick={() => editContent(c)}>✏️</button>
                  <button disabled={!isOwner} style={{ marginLeft: 5 }} onClick={() => deleteContent(c.id)}>❌</button>
                </td>
              </tr>
          ))}
        </tbody>
      </table>
</div>
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

const isOwner = user && owner && user.id === owner.id;
  /* =========================
     UI
  ========================= */
  return (
<div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-white">

  <InstructorMenu />

  <div className="flex-1 p-6">

    {/* HEADER */}
    <div className="bg-white rounded-2xl shadow p-5 mb-6">
      <h2 className="text-xl font-bold mb-2">Step2: Teaching Plan</h2>

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
    
        {/* ================= BASIC ================= */}
<Card className="mb-6">
  <h3 className="font-semibold mb-4">ข้อมูลรายวิชา</h3>

  <div className="grid grid-cols-2 gap-4">

    <Input
      disabled={!isOwner}
      value={prereq}
      placeholder="เงื่อนไขก่อนเรียน"
      onChange={e => setPrereq(e.target.value)}
    />

    <Select
      disabled={!isOwner}
      value={courseType}
      onChange={e => setCourseType(e.target.value)}
    >
      <option value="">-- ประเภท --</option>
      <option>กลุ่มพื้นฐานวิชาชีพ</option>
      <option>กลุ่มวิชาชีพบังคับด้านผู้ป่วย</option>
      <option>กลุ่มวิชาชีพบังคับด้านผลิตภัณฑ์</option>
      <option>กลุ่มวิชาชีพบังคับด้านสังคม</option>
      <option>กลุ่มวิชาชีพเลือก</option>
      <option>ฝึกปฏิบัติงาน</option>
    </Select>

  </div>
</Card>        
<Card className="mb-6">
  <div className="flex justify-between items-center mb-3">
    <div>
      <h3 className="font-semibold">อาจารย์</h3>
      <p className="text-sm text-gray-500">
        เพิ่มชื่ออาจารย์ผู้รับผิดชอบรายวิชาเป็นชื่อแรก
      </p>
    </div>

    <Button onClick={() => setShowPopup(true)}>
      ➕ เพิ่ม
    </Button>
  </div>

  {/* ✅ Selected Teachers */}
  <div className="flex flex-wrap gap-2">
    {selectedTeachers.map(t => (
      <div
        key={t.id}
        className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full"
      >
        {t.name_th}

        <button
          
          onClick={() => removeTeacher(t.id)}
          className="ml-2 text-red-500 hover:text-red-700"
        >
          ❌
        </button>
      </div>
    ))}
  </div>
</Card>
{showPopup && (
  <div
    onClick={() => setShowPopup(false)}
    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-2xl shadow-xl p-5 w-[420px]"
    >

      <h3 className="font-semibold mb-3">เลือกอาจารย์</h3>

      {/* SEARCH */}
      <Input
        placeholder="ค้นหาอาจารย์..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3"
      />

      {/* LIST */}
      <div className="max-h-60 overflow-y-auto space-y-2">

        {instructors
          .filter(i => i.name_th.includes(search))
          .map(i => {
            const already = selectedTeachers.find(x => x.id === i.id);

            return (
              <div
                key={i.id}
                className="flex justify-between items-center p-2 rounded hover:bg-gray-100"
              >
                <span>{i.name_th}</span>

                <button
                  disabled={!isOwner}
                  disabled={already}
                  onClick={() => addTeacher(i)}
                  className={`
                    px-2 py-1 rounded text-sm
                    ${already
                      ? 'bg-gray-200 text-gray-500'
                      : 'bg-blue-500 text-white hover:bg-blue-600'}
                  `}
                >
                  {already ? '✔' : 'เพิ่ม'}
                </button>
              </div>
            );
          })}
      </div>

    </div>
  </div>
)}
<Card className="mb-6">
  <h4 className="font-semibold mb-3">อาจารย์พิเศษ</h4>

  {/* ADD */}
  <Input
    disabled={!isOwner}
    placeholder="พิมพ์ชื่อแล้วกด Enter"
    onKeyDown={(e) => {
      if (e.key === 'Enter' && e.target.value.trim()) {
        setGuestTeachers([...guestTeachers, e.target.value]);
        e.target.value = '';
      }
    }}
    className="mb-3"
  />

  {/* LIST */}
  <div className="space-y-2">
    {guestTeachers.map((g, i) => (
      <div
        key={i}
        className="flex items-center gap-2"
      >
        <input
          disabled={!isOwner}
          value={g}
          onChange={(e) => {
            const updated = [...guestTeachers];
            updated[i] = e.target.value;
            setGuestTeachers(updated);
          }}
          className="flex-1 border rounded-lg px-3 py-1"
        />

        <button
          disabled={!isOwner}
          onClick={() =>
            setGuestTeachers(guestTeachers.filter((_, idx) => idx !== i))
          }
          className="text-red-500 hover:text-red-600"
        >
          ❌
        </button>
      </div>
    ))}
  </div>
</Card>
<hr />

 {/* เพิ่มหัวข้อสอน*/}
<Card className="mb-6">
  <h3 className="font-semibold mb-4">เพิ่มหัวข้อสอน</h3>

  <div className="grid grid-cols-12 gap-3 items-start">

    {/* TYPE */}
    <div className="col-span-2">
      <Select
        disabled={!isOwner}
        value={currentContent.type}
        onChange={e => setCurrentContent({ ...currentContent, type: e.target.value })}
      >
        <option value="lecture">บรรยาย</option>
        <option value="lab">ปฏิบัติ</option>
      </Select>
    </div>

    {/* DATE */}
    <div className="col-span-2">
      <Input
        type="date"
        disabled={!isOwner}
        value={currentContent.date}
        onChange={e => setCurrentContent({ ...currentContent, date: e.target.value })}
      />
    </div>

    {/* ORDER */}
    <div className="col-span-1">
      <Input
        disabled={!isOwner}
        placeholder="ลำดับ"
        value={currentContent.order}
        onChange={e => setCurrentContent({ ...currentContent, order: e.target.value })}
      />
    </div>

    {/* TOPIC */}
    <div className="col-span-4">
      <textarea
        disabled={!isOwner}
        placeholder="หัวข้อ"
        value={currentContent.topic}
        onChange={e => setCurrentContent({ ...currentContent, topic: e.target.value })}
        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 resize-y"
      />
    </div>

    {/* HOURS */}
    <div className="col-span-1">
      <Input
        disabled={!isOwner}
        placeholder="ชม"
        type="number"
        step="0.1"
        value={currentContent.hours}
        onChange={e => setCurrentContent({ ...currentContent, hours: e.target.value })}
      />
    </div>

    {/* CLO MULTI SELECT */}
    <div className="col-span-4 relative">

      <div
        onClick={() => setShowDropdown(!showDropdown)}
        className="border rounded-lg px-3 py-2 bg-white cursor-pointer hover:border-blue-400"
      >
        {currentContent.cloIds.length > 0
          ? currentContent.cloIds
              .map(id => clos.find(c => c.id == id)?.code)
              .join(', ')
          : 'เลือก CLO'}
      </div>

      {showDropdown && (
        <div className="absolute z-10 w-full bg-white border rounded-lg shadow mt-1 max-h-40 overflow-y-auto">

          {clos.map(c => {
            const checked = currentContent.cloIds.includes(String(c.id));

            return (
              <label
                key={c.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100"
              >
                <input
                  disabled={!isOwner}
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
    <div className="col-span-1">
      <Input
        disabled={!isOwner}
        placeholder="สอบ"
        type="number"
        step="0.1"
        value={currentContent.examScore}
        onChange={e => setCurrentContent({ ...currentContent, examScore: e.target.value })}
      />
    </div>

    <div className="col-span-1">
      <Input
        disabled={!isOwner}
        placeholder="งาน"
        type="number"
        step="0.1"
        value={currentContent.workScore}
        onChange={e => setCurrentContent({ ...currentContent, workScore: e.target.value })}
      />
    </div>
    {/* INSTRUCTOR */}
    <div className="col-span-2">
      <Select
        disabled={!isOwner}
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

        {selectedTeachers.map(t => (
          <option key={t.id} value={t.id}>
            {t.name_th}
          </option>
        ))}

        {guestTeachers.map((g, i) => (
          <option key={'g'+i} value={g}>
            {g}
          </option>
        ))}
      </Select>
    </div>
  </div>

  {/* BUTTON */}
  <div className="mt-4">
    <Button disabled={!isOwner} onClick={handleAddContent}>
      ✅ เพิ่ม / บันทึก
    </Button>
  </div>

</Card>

        {/* ================= TABLE ================= */}
    <hr />
      {/* ✅ ✅ ✅ ใส่ตรงนี้ */}
      {renderTable('lecture', '📘 บรรยาย')}
      {renderTable('lab', '🧪 ปฏิบัติ')}
    <hr />    
  
        {/* ================= EVALUATION ================= */}
<Card className="mb-6">
  <h3 className="font-semibold mb-4">📊 สัดส่วนคะแนน</h3>

  {/* ✅ FORM */}
  <div className="grid grid-cols-12 gap-3">

    {/* วิธีประเมิน */}
    <div className="col-span-3">
      <Select
        disabled={!isOwner}
        value={currentEval.name}
        onChange={e =>
          setCurrentEval({
            ...currentEval,
            name: e.target.value
          })
        }
      >
        <option value="">-- วิธีประเมิน --</option>
        <option>สอบย่อย</option>
        <option>สอบกลางภาค</option>
        <option>สอบปลายภาค</option>
        <option>นำเสนอ</option>
        <option>งานมอบหมาย</option>
        <option>ปฏิบัติ</option>
        <option>สอบปฏิบัติ</option>
        <option>พฤติกรรม</option>
      </Select>
    </div>

    {/* ประเภท */}
    <div className="col-span-2">
      <Select
        disabled={!isOwner}
        value={currentEval.type}
        onChange={e =>
          setCurrentEval({
            ...currentEval,
            type: e.target.value
          })
        }
      >
        <option value="">-- ประเภท --</option>
        <option>สอบ</option>
        <option>งาน</option>
        <option>ผ่าน/ไม่ผ่าน</option>
      </Select>
    </div>

    {/* เครื่องมือ */}
    <div className="col-span-3">
      <Select
        disabled={!isOwner}
        value={currentEval.tool}
        onChange={e =>
          setCurrentEval({
            ...currentEval,
            tool: e.target.value
          })
        }
      >
        <option value="">-- เครื่องมือ --</option>
        <option>ข้อสอบ</option>
        <option>แบบบันทึกการเข้าชั้นเรียน</option>
        <option>แบบให้คะแนน</option>
        <option>แบบประเมิน</option>
      </Select>
    </div>

    {/* สัปดาห์ */}
    <div className="col-span-2">
      <Input
        disabled={!isOwner}
        placeholder="สัปดาห์"
        value={currentEval.week}
        onChange={e =>
          setCurrentEval({
            ...currentEval,
            week: e.target.value
          })
        }
      />
    </div>

    {/* คะแนนรวม */}
    <div className="col-span-2">
      <Input
        readOnly
        value={currentEval.total}
      />
    </div>
  </div>

  {/* ✅ SELECT CONTENT */}
  <div className="grid grid-cols-2 gap-4 mt-4">

    {/* lecture */}
    <div>
      <h4 className="text-sm font-medium mb-2">📘 บรรยาย</h4>
      <select
        multiple
        className="w-full border rounded-lg p-2 h-32"
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
            <option key={c.id} value={c.id}>
              หัวข้อ {c.order}
            </option>
        ))}
      </select>
    </div>

    {/* lab */}
    <div>
      <h4 className="text-sm font-medium mb-2">🧪 ปฏิบัติ</h4>
      <select
        multiple
        className="w-full border rounded-lg p-2 h-32"
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
            <option key={c.id} value={c.id}>
              หัวข้อ {c.order}
            </option>
        ))}
      </select>
    </div>

  </div>
  {/* ✅ BUTTON */}
  <div className="mt-4 flex justify-end">
    <Button disabled={!isOwner} onClick={addEval}>
      ➕ เพิ่มรายการประเมิน
    </Button>
  </div>
</Card>

<Card className="mb-6">
  <h4 className="font-semibold mb-4">รายการสัดส่วนคะแนน</h4>

  <div className="overflow-x-auto rounded-lg border">

    <table className="w-full text-sm">

      {/* HEADER */}
      <thead className="bg-gray-100 text-gray-700">
        <tr>
          <th rowSpan="2" className="p-3 text-left">วิธีการประเมิน</th>
          <th rowSpan="2" className="p-3 text-left">CLO</th>
          <th rowSpan="2" className="p-3 text-center">คะแนน</th>
          <th colSpan="2" className="p-3 text-center">หัวข้อ</th>
          <th rowSpan="2" className="p-3 text-center">เครื่องมือ</th>
          <th rowSpan="2" className="p-3 text-center">สัปดาห์</th>
          <th rowSpan="2" className="p-3 text-center">จัดการ</th>
        </tr>
        <tr>
          <th className="p-3 text-center">บรรยาย</th>
          <th className="p-3 text-center">ปฏิบัติ</th>
        </tr>
      </thead>

      {/* BODY */}
      <tbody>
        {evaluations.flatMap((e, index) => {
          const cloSet = new Set();

          [...(e.lectureIds || []), ...(e.labIds || [])].forEach(cid => {
            const c = contents.find(x =>
              String(x.id) === String(cid) ||
              String(x.order) === String(cid)
            );
            if (c) {
              (c.cloIds || []).forEach(cloId => cloSet.add(cloId));
            }
          });

          const cloIds = Array.from(cloSet);

          return cloIds.map((cloId, i) => {
            const cloCode = clos.find(c => c.id == cloId)?.code;

            return (
              <tr
                key={`${index}_${i}`}
                className="border-t hover:bg-gray-50"
              >

                {/* วิธีประเมิน */}
                {i === 0 && (
                  <td rowSpan={cloIds.length} className="p-3 font-medium">
                    {e.name}
                  </td>
                )}

                {/* CLO */}
                <td className="p-3 text-gray-600">
                  {cloCode}
                </td>

                {/* คะแนน */}
                {i === 0 && (
                  <td
                    rowSpan={cloIds.length}
                    className="p-3 text-center font-semibold text-blue-600"
                  >
                    {e.total}
                  </td>
                )}

                {/* lecture */}
                {i === 0 && (
                  <td rowSpan={cloIds.length} className="p-3 text-center">
                    {(e.lectureIds || []).map(id => {
                      const c = contents.find(x =>
                        String(x.id) === String(id) ||
                        String(x.order) === String(id)
                      );
                      return c ? c.order : `[${id}]`;
                    }).join(', ')}
                  </td>
                )}

                {/* lab */}
                {i === 0 && (
                  <td rowSpan={cloIds.length} className="p-3 text-center">
                    {(e.labIds || []).map(id => {
                      const c = contents.find(x =>
                        String(x.id) === String(id) ||
                        String(x.order) === String(id)
                      );
                      return c ? c.order : `[${id}]`;
                    }).join(', ')}
                  </td>
                )}

                {/* tool */}
                {i === 0 && (
                  <td rowSpan={cloIds.length} className="p-3 text-center text-gray-600">
                    {e.tool}
                  </td>
                )}

                {/* week */}
                {i === 0 && (
                  <td rowSpan={cloIds.length} className="p-3 text-center">
                    {e.week}
                  </td>
                )}

                {/* edit */}
                {i === 0 && (
                  <td rowSpan={cloIds.length} className="p-3 text-center">
                    <button
                      disabled={!isOwner}
                      onClick={() => editEval(e, index)}
                      className="mr-2 text-blue-500 hover:text-blue-700"
                    >
                      ✏️
                    </button>

                    <button
                      disabled={!isOwner}
                      onClick={() => deleteEval(index)}
                      className="text-red-500 hover:text-red-700"
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

      {/* FOOTER TOTAL */}
      <tfoot>
        <tr className="bg-gray-50 border-t font-semibold">
          <td colSpan="2" className="p-3 text-left">
            รวม
          </td>

          <td className="p-3 text-center text-blue-600">
            {evaluations.reduce(
              (sum, e) => sum + Number(e.total || 0),
              0
            )}
          </td>

          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </div>
</Card>

<Card className="mb-6">
  <h3 className="font-semibold mb-4">📊 สรุปคะแนน CLO</h3>

  <div className="overflow-x-auto border rounded-lg">

    <table className="w-full text-sm">

      {/* HEADER */}
      <thead className="bg-gray-100 text-gray-700">
        <tr>
          <th className="p-3 text-left">CLO</th>
          <th className="p-3 text-left">รายละเอียด</th>
          <th className="p-3 text-center">สอบ</th>
          <th className="p-3 text-center">งาน</th>
          <th className="p-3 text-center">รวม</th>
        </tr>
      </thead>

      {/* BODY */}
      <tbody>
        {clos.map(clo => {
          const sum = cloSummary[clo.id] || { exam: 0, work: 0 };
          const total = sum.exam + sum.work;

          return (
            <tr
              key={clo.id}
              className="border-t hover:bg-gray-50"
            >
              <td className="p-3 font-medium text-blue-600">
                {clo.code}
              </td>

              <td className="p-3 text-gray-600">
                {clo.description}
              </td>

              <td className="p-3 text-center">
                {sum.exam.toFixed(2)}
              </td>

              <td className="p-3 text-center">
                {sum.work.toFixed(2)}
              </td>

              <td className="p-3 text-center font-semibold text-green-600">
                {total.toFixed(2)}
              </td>
            </tr>
          );
        })}
      </tbody>

      {/* FOOTER */}
      <tfoot>
        <tr className="bg-gray-50 border-t font-semibold">
          <td colSpan="2" className="p-3 text-left">
            รวมทั้งหมด
          </td>

          <td className="p-3 text-center">
            {Object.values(cloSummary)
              .reduce((a,b)=>a+b.exam,0)
              .toFixed(2)}
          </td>

          <td className="p-3 text-center">
            {Object.values(cloSummary)
              .reduce((a,b)=>a+b.work,0)
              .toFixed(2)}
          </td>

          <td className="p-3 text-center text-green-600">
            {Object.values(cloSummary)
              .reduce((a,b)=>a+b.exam + b.work,0)
              .toFixed(2)}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</Card>

        <hr />
<div className="flex gap-3 mt-6">
  <Button disabled={!isOwner} onClick={handleSave}>
    💾 บันทึก
  </Button>
  <button
    onClick={goBack}
    className="px-4 py-2 bg-gray-300 rounded-lg"
  >
    ⬅ กลับ
  </button>
  <Button onClick={goNext} className="bg-green-500 hover:bg-green-600">
    ➡ ถัดไป
  </Button>
</div>
      </div>
    </div>
  );
}