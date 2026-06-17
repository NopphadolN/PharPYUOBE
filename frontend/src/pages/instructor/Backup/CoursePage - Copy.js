import { useState, useEffect } from 'react';
import api from '../../services/api';
import InstructorMenu from '../../components/InstructorMenu';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

export default function CoursePage() {

  const navigate = useNavigate();
  const location = useLocation();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');

  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');

  const [courseDetail, setCourseDetail] = useState(null);

  const [prereq, setPrereq] = useState('');
  const [courseType, setCourseType] = useState('');

  const [instanceId, setInstanceId] = useState(null);

  const [savedClos, setSavedClos] = useState([]);
  const [currentClo, setCurrentClo] = useState({
    id: null,
    code: '',
    description: '',
    indicators: [
    // ✅ ใหม่
    // { description: '', target: '' }
]
  });

  const [selectedCloId, setSelectedCloId] = useState('');
  const [selectedSubPloIds, setSelectedSubPloIds] = useState([]);
  const [cloMappings, setCloMappings] = useState([]);
  const [subPlos, setSubPlos] = useState([]);
  const [showSubPloDropdown, setShowSubPloDropdown] = useState(false);

  const [owner, setOwner] = useState(null);
  const [user, setUser] = useState(null);

  // Load SubPLO
  useEffect(() => {
  api.get('/admin/subplos')    
    .then(res => setSubPlos(res.data || []))
    .catch(err => console.error(err));
  }, []);

  /* =========================
     LOAD COURSES
  ========================= */
  useEffect(() => {
    api.get('/instructor/courses')
      .then(res => setCourses(res.data));
  }, []);

  useEffect(() => {
  const state = location.state;
  if (!courses.length) return; // ✅ รอ courses โหลดก่อน
  if (state?.course_id && state?.year && state?.semester) {
    setYear(state.year);
    setSemester(state.semester);
    handleSelect(state.course_id);
  }
}, [courses]); // ✅ รอ courses มาก่อน

  useEffect(() => {
  api.get('/instructor/me').then(res => setUser(res.data));
  }, []);

  /* =========================
     LOAD COURSE + CLO
  ========================= */
  const handleSelect = async (value) => {
    const id = Number(value);
    setSelectedCourse(id);
    const c = courses.find(x => x.id === id);
    setCourseDetail(c);
    if (!year || !semester) return;
    try {
      const res = await api.get('/instructor/instance', {
        params: { course_id: id, year, semester }
      });
      if (res.data) {
        const instId = res.data.id;
        setInstanceId(instId);
        setPrereq(res.data.prerequisite || '');
        setCourseType(res.data.course_type || '');
        setOwner(res.data.owner); 
        const cloRes = await api.get('/instructor/clos', {
          params: { course_instance_id: instId }
        });
        setSavedClos(cloRes.data.map(c => ({...c,id: c.id   
        }))
        );
      } else {

        setInstanceId(null);
        setSavedClos([]);
        setPrereq('');
        setCourseType('');
      }

    } catch (err) {
      console.error(err);
    }
  };

  /* =========================
     CLO FUNCTIONS
  ========================= */
  const resetForm = () => {
    setCurrentClo({
      id: null,
      code: '',
      description: '',
      indicators: []
    });
  };

const handleSave = async () => {
  let currentInstanceId = instanceId;
  // ✅ ถ้ายังไม่มี instance → สร้างก่อน
  if (!currentInstanceId) {

    const res = await api.post('/instructor/instance', {
      course_id: selectedCourse,
      year,
      semester,
      prerequisite: prereq,
      course_type: courseType,
      instructors: [{ id: user.id }], // ✅ owner = คนแรก
      contents: [],
      evaluations: []
    });

    // ✅ โหลด instance ใหม่
    const newRes = await api.get('/instructor/instance', {
      params: { course_id: selectedCourse, year, semester }
    });
    currentInstanceId = newRes.data.id;
    setInstanceId(currentInstanceId);
    setOwner(newRes.data.owner);
  }

  // ✅ save CLO
  let updated = [...savedClos];
  if (currentClo.id) {
    updated = updated.map(c =>
      c.id === currentClo.id ? currentClo : c
    );
  } else {
    updated.push({
      ...currentClo,
      id: Date.now()
    });
  }
  await api.post('/instructor/clos', {
    course_instance_id: currentInstanceId,
    clos: updated
  });
  setSavedClos(updated);
  resetForm();
  alert('✅ save สำเร็จ');
};
  
  const calculateTotal = (methods) => {
  return methods.reduce(
    (sum, m) => sum + Number(m.percent || 0),
    0
  );
};

const addIndicator = () => {
  setCurrentClo({
    ...currentClo,
    indicators: [
      ...currentClo.indicators,
      { description: '', target: '' }
    ]
  });
};

const addMapping = () => {
  if (!selectedCloId || selectedSubPloIds.length === 0) return;
  const cloIdNum = Number(selectedCloId); 
  const uniqueSubPlo = [...new Set(selectedSubPloIds)];
  const existing = cloMappings.find(
    m => Number(m.cloId) === cloIdNum
  );
  if (existing) {
    // ✅ UPDATE
    existing.subPloIds = uniqueSubPlo;
    setCloMappings([...cloMappings]);
  } else {
    // ✅ INSERT
    setCloMappings([
      ...cloMappings,
      {
        cloId: cloIdNum,
        subPloIds: uniqueSubPlo
      }
    ]);
  }
  // ✅ clear selection
  setSelectedSubPloIds([]);

};


const handleDelete = (id) => {
  setSavedClos(prev =>
    prev.filter(c => c.id !== id)
  );
  if (currentClo.id === id) {
    resetForm();
  }
};

const handleNext = () => {
  if (!selectedCourse || !year || !semester) {
    alert('กรุณาเลือกวิชาและกรอกปี/เทอมก่อน');
  if (!instanceId) {
    alert('กรุณาบันทึกข้อมูลก่อน');
    return;
  }}
  navigate('/instructor/course/step2', {
    state: {
      course_id: selectedCourse,
      year,
      semester
    }
  });
};

// Load mapping
useEffect(() => {
  api.get('/instructor/clo-mapping')
    .then(res => {
      const map = [];
      res.data.forEach(m => {
        let existing = map.find(x => x.cloId === m.clo_id);
        if (existing) {
          existing.subPloIds.push(String(m.sub_plo_id));
        } else {
          map.push({
            cloId: m.clo_id,
            subPloIds: [String(m.sub_plo_id)]
          });
        }
      });
      setCloMappings(map);
    });
}, []);

const isOwner = !instanceId || (user && owner && user.id === owner.id);

  /* =========================
     UI
  ========================= */
  return (
<div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-white">
  <InstructorMenu />
  <div className="flex-1 p-6 space-y-6">
    <h2 className="text-xl font-bold">
      เพิ่มรายวิชา และจัดการ CLOs
    </h2>

<Card>
  <div className="flex flex-wrap gap-3 items-center">

    <Select value={year} onChange={e => setYear(e.target.value)}>
      <option value="">-- ปีการศึกษา --</option>
      {[2568,2569,2570,2571,2572,2573,2574].map(y => (
        <option key={y}>{y}</option>
      ))}
    </Select>

    <Select value={semester} onChange={e => setSemester(e.target.value)}>
      <option value="">-- เทอม --</option>
      <option value="1">เทอม 1</option>
      <option value="2">เทอม 2</option>
    </Select>

    <Select onChange={e => handleSelect(e.target.value)}>
      <option value="">-- เลือกวิชา --</option>
      {courses.map(c => (
        <option key={c.id} value={c.id}>
          {c.code_en} - {c.name_th}
        </option>
      ))}
    </Select>

  </div>

  {courseDetail && (
    <div className="mt-4 text-sm text-gray-600">
      <p className="font-medium">{courseDetail.name_th}</p>
      <p>{courseDetail.description}</p>
    </div>
  )}
</Card>

        <hr />

        {/* ✅ CLO FORM */}
        
        <h3>จัดการ CLOs</h3>        

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

<input
  disabled={!isOwner}
  placeholder="CLO Code"
  value={currentClo.code}
  style={{ padding: 6, width: 80 }}
  onChange={(e) =>
    setCurrentClo({ ...currentClo, code: e.target.value })
  }
/>

<input
  placeholder="คำอธิบาย"
  value={currentClo.description}
  onChange={(e) =>
    setCurrentClo({ ...currentClo, description: e.target.value })
  }
    style={{
    width: '100%',        // ✅ เต็มพื้นที่
    maxWidth: '800px',
    padding: '6px' ,
    marginTop: 5 ,
    marginLeft: 5 
  }}

/>

<br /><br />

<button disabled={!isOwner} onClick={addIndicator}>
  ➕ Indicator
</button>

{/* ✅ INDICATORS */}
{currentClo.indicators.map((ind, i) => (

  <div key={i} style={{
    marginTop: 10,
    padding: 10,
    border: '1px solid #ccc'
  }}>

    {/* ✅ indicator */}   
    <input
      disabled={!isOwner}
      placeholder="Indicator"
      value={ind.description}
      onChange={(e) => {
        const updated = [...currentClo.indicators];
        updated[i].description = e.target.value;

        setCurrentClo({
          ...currentClo,
          indicators: updated
        });
      }}
    />
    <input
      disabled={!isOwner}
      type="number"
      placeholder="ค่าเป้าหมาย"
      value={ind.target}
      onChange={(e) => {
        const updated = [...currentClo.indicators];
        updated[i].target = e.target.value;

        setCurrentClo({
          ...currentClo,
          indicators: updated
        });
      }}
      style={{ marginLeft: 5, width: 100 }}
    />

      </div>
    ))}

  </div>

<br />

{/* ✅ SAVE */}
<button
  disabled={!isOwner}
  onClick={handleSave}
  disabled={false}
>
  💾 Save CLOs
</button>

{/* ✅ LIST */}
<h4>รายการ CLOs</h4>

{savedClos.map(c => (
  <div key={c.id} style={{
    border: '1px solid #000',
    padding: 10,
    marginTop: 10
  }}>
    <strong>{c.code}</strong> - {c.description}
    <ul>
      {(c.indicators || []).map((ind, i) => (
        <li key={i}>
          {ind.description} (target: {ind.target})
        </li>
      ))}
    </ul>
    <button disabled={!isOwner} onClick={() => setCurrentClo(c)}>✏️</button>
    <button disabled={!isOwner} onClick={() => handleDelete(c.id)}>❌</button>
  </div>
))}

<select
  disabled={!isOwner}
  value={selectedCloId}
  style={{ height: 30 }}
  onChange={e => setSelectedCloId(e.target.value)}
>
  <option value="">-- เลือก CLO --</option>
  {savedClos.map(c => (
    <option key={c.id} value={c.id}>
      {c.code}
    </option>
  ))}
</select>

<div style={{ marginLeft: 5, marginTop: 10, height: 25, position: 'relative', display: 'inline-block', width: 200 }}>
  <button style={{ height: 30 }} disabled={!isOwner}
  onClick={() => setShowSubPloDropdown(!showSubPloDropdown)}>
    เลือก SubPLOs
  </button>
  {showSubPloDropdown && (
    <div style={{
      position: 'absolute',
      background: '#fff',
      border: '1px solid #ccc',
      padding: 10,
      zIndex: 10,
      maxHeight: 200,
      overflowY: 'auto'
    }}>
      {subPlos.map(p => (
        <div key={p.id}>
          <label>
            <input
              disabled={!isOwner}
              type="checkbox"
              value={p.id}
              checked={selectedSubPloIds.includes(String(p.id))}
              onChange={(e) => {
                const val = String(p.id);
                if (e.target.checked) {
                  setSelectedSubPloIds([...selectedSubPloIds, val]);
                } else {
                  setSelectedSubPloIds(
                    selectedSubPloIds.filter(id => id !== val)
                  );
                }
              }}
            />
            {p.code}
          </label>
        </div>
      ))}
    </div>
  )}
</div>

{/* ✅ ✅ ✅ ปุ่มอยู่นอก */}
<button style={{ height: 30 }} disabled={!isOwner} onClick={addMapping}>
  ➕ เพิ่ม Mapping
</button>

<h4>Mapping CLOs/SubPLOs</h4>
<table border="1" style={{ marginTop: 10 }}>
  <thead>
    <tr>
      <th style={{ width: 120 }}>CLOs</th>
      {subPlos.map(p => (
        <th key={p.id} style={{ width: 40, height: 150 }}>
          <div style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            textAlign: 'center'
          }}>
            {p.code}
          </div>
        </th>
      ))}
    </tr>
  </thead>
  <tbody>
    {savedClos.map(c => {
      const mapping = cloMappings.find(
        m => Number(m.cloId) === Number(c.id)
      );
      return (
        <tr key={c.id}>
          <td>{c.code}</td>
          {subPlos.map(p => (
            <td key={p.id} style={{ textAlign: 'center' }}>
              {mapping?.subPloIds.includes(String(p.id)) ? '✓' : ''}
            </td>
          ))}
        </tr>
      );
    })}
  </tbody>
</table>
<button
  disabled={!isOwner}
  onClick={async () => {
    await api.post('/instructor/clo-mapping', {
      cloMappings
    });
    alert('✅ บันทึก Mapping แล้ว');
  }}
>
  💾 Save Mapping
</button>

<br /><br />
<button
  onClick={handleNext}
  style={{
    background: '#28a745',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px'
  }}
>
  ➡️ ไปจัดการหัวข้อสอน (STEP 2)
</button>

      </div>
    
  );
}