import { useState, useEffect, useCallback } from 'react';
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
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [showPopup, setShowPopup] = useState(null);
  const [search, setSearch] = useState('');
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courseDetail, setCourseDetail] = useState(null);
  const [prereq, setPrereq] = useState('');
  const [courseType, setCourseType] = useState('');
  
  const [instanceId, setInstanceId] = useState(null);
  const [instructors, setInstructors] = useState([]);

  const [savedClos, setSavedClos] = useState([]);
  const [currentClo, setCurrentClo] = useState({
    id: null,
    code: '',
    description: '',
    subPloIds: [],
    ksecIds: [],
    indicators: []
  });

  const [subPlos, setSubPlos] = useState([]);
  const [ksecs,setKsecs] = useState([]);
  const [ploIndicators, setPloIndicators] = useState([]);

  const [ownerUser, setOwnerUser] = useState(null);
  const [owner, setOwner] = useState(null);
  const [user, setUser] = useState(null);

 // Load instructor list
  useEffect(() => {
  api.get('/instructor/users')
    .then(res => setInstructors(res.data || []));
}, []);
  
  // Load SubPLO
useEffect(() => {
  if (!selectedCourse) return;
  api.get('/instructor/course-subplos',
    {
      params: {
        course_id: selectedCourse
      }
    }
  )
  .then(res => {
    setSubPlos(res.data || []);
  })
  .catch(err => {
    console.error(err);
  });
}, [selectedCourse]);

  // Load PLO indicator
useEffect(() => {
  if (!selectedCourse) return;
  api.get('/instructor/course-plo-indicators',
    {
      params: {
        course_id: selectedCourse
      }
    }
  )
  .then(res => {
    setPloIndicators(res.data || []);
  })
  .catch(console.error);
}, [selectedCourse]);

// Load course-ksecs
useEffect(() => {
  if (!selectedCourse) return;
  api.get('/instructor/course-ksecs',
    {
      params:{
        course_id:selectedCourse
      }
    }
  )
  .then(res => {
    setKsecs(
      res.data || []
    );
  })
  .catch(console.error);
}, [selectedCourse]);

  /* =========================
     LOAD COURSES
  ========================= */
useEffect(() => {
  api.get('/instructor/courses')
    .then(res => {
      setCourses(res.data);
      setLoadingCourses(false);
    });
}, []);

  /* =========================
     LOAD COURSE + CLO
  ========================= */
  const handleSelect = useCallback(async (value) => {
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
      const cloRes = await api.get('/instructor/clos', {
        params: { course_instance_id: instId }
      });
      setInstanceId(instId);
      setPrereq(res.data.prerequisite || '');
      setCourseType(res.data.course_type || '');
      setOwner(res.data.owner);
      setOwnerUser(res.data.owner);
      setSavedClos(cloRes.data);
      setCurrentClo({
          id:null,
          code:'',
          description:'',
          indicators:[]
        });
    }
  } catch (err) {
    console.error(err);
  }
}, [courses, year, semester]);

  useEffect(() => {
    if (!selectedCourse || !year || !semester) return;
      handleSelect(selectedCourse);
    }, [selectedCourse, year, semester, handleSelect]);

  useEffect(() => {
  api.get('/instructor/me').then(res => setUser(res.data));
  }, []);

  useEffect(() => {
  const state = location.state;
  if (!courses.length) return;
  if (state?.course_id && state?.year && state?.semester) {
    setYear(state.year);
    setSemester(state.semester);
    setSelectedCourse(state.course_id);
  }
  }, [courses, location.state]);

  /* =========================
     CLO FUNCTIONS
  ========================= */
const resetForm = () => {
  setCurrentClo({
    id:null,
    code:'',
    description:'',
    subPloIds:[],
    ksecIds:[],
    indicators:[]
  });
};

const handleSave = async () => {
  let currentInstanceId = instanceId;
  if (!currentInstanceId) {
    await api.post('/instructor/instance', {
      course_id: selectedCourse,
      year,
      semester,
      prerequisite: prereq,
      course_type: courseType,
      instructors: [{ id: user.id }],
      owner_id: ownerUser?.id,
      contents: [],
      evaluations: []
    });
    const newRes = await api.get('/instructor/instance',
      {
        params: {
          course_id: selectedCourse,
          year,
          semester
        }
      }
    );
    currentInstanceId = newRes.data.id;
    setInstanceId(currentInstanceId);
    setOwner(newRes.data.owner);
  }
  let updated = [...savedClos];
  const hasData =
    currentClo.code.trim() ||
    currentClo.description.trim() ||
    currentClo.indicators.length > 0;
  if (hasData) {
    if (!currentClo.code.trim()) {
      alert('กรุณากรอก CLO Code');
      return;
    }
    if (!currentClo.description.trim()) {
      alert('กรุณากรอกคำอธิบาย CLO');
      return;
    }
    if (currentClo.id) {
      updated = updated.map(c =>
        Number(c.id) === Number(currentClo.id)
          ? currentClo
          : c
      );
    } else {
      updated.push({
        ...currentClo,
      });
    }
  }
  // กัน CLO ว่าง
updated = updated.filter(c =>
  c &&
  c.code &&
  c.code.trim() &&
  c.description &&
  c.description.trim()
);
await api.post('/instructor/clos', {
  course_instance_id: currentInstanceId,
  clos: updated
});
/* reload จาก db */
const cloRes = await api.get('/instructor/clos',
  {
    params: {
      course_instance_id:
        currentInstanceId
    }
  }
);
setSavedClos(cloRes.data);
resetForm();

alert('✅ save สำเร็จ');
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

const handleDelete = (id) => {
  setSavedClos(prev =>
    prev.filter(c => Number(c.id) !== Number(id))
  );
  if (currentClo.id === id) {
    resetForm();
  }
};

const handleSaveOwner = async () => {
  if (!selectedCourse || !year || !semester) {
    alert('กรุณาเลือกวิชา / ปี / เทอมก่อน');
    return;
  }
  if (!ownerUser) {
    alert('กรุณาเลือกผู้รับผิดชอบ');
    return;
  }
  try {
    // ✅ สร้าง instance (ถ้ายังไม่มี)
    if (!instanceId) {
      await api.post('/instructor/instance', {
        course_id: selectedCourse,
        year,
        semester,
        owner_id: ownerUser.id,
        instructors: [{ id: ownerUser.id }],
        contents: [],
        evaluations: []
      });
      // ✅ reload instance
      const res = await api.get('/instructor/instance', {
        params: {
          course_id: selectedCourse,
          year,
          semester
        }
      });
      setInstanceId(res.data.id);
      setOwner(res.data.owner);
      setOwnerUser(res.data.owner);
    } else {
      // ✅ update owner
      await api.post('/instructor/instance', {
        course_id: selectedCourse,
        year,
        semester,
        owner_id: ownerUser.id
      });
      // ✅ update state
      const res = await api.get('/instructor/instance', {
  params: {
    course_id: selectedCourse,
    year,
    semester
  }
});
setInstanceId(res.data.id);
setOwner(res.data.owner);
setOwnerUser(res.data.owner);
    }
    alert('✅ บันทึกผู้รับผิดชอบแล้ว');
  } catch (err) {
    console.error(err);
    alert('❌ error บันทึกผู้รับผิดชอบ');
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

const reloadInstance = async () => {
  const res = await api.get('/instructor/instance', {
    params: {
      course_id: selectedCourse,
      year,
      semester
    }
  });
  if (res.data) {
    setInstanceId(res.data.id);
    setOwner(res.data.owner);
    setOwnerUser(res.data.owner);
  }
};

const handleImport = async () => {
  if (!selectedCourse || !year || !semester) {
    alert('เลือกวิชา ปี เทอมก่อน');
    return;
  }
  const fromYear = prompt('ปีต้นทาง เช่น 2567');
  const fromSemester = prompt('เทอมต้นทาง เช่น 1');
  if (!fromYear || !fromSemester) return;
  await api.post('/instructor/instance/import', {
    course_id: selectedCourse,
    from_year: fromYear,
    from_semester: fromSemester,
    to_year: year,
    to_semester: semester
  });
  alert('✅ นำเข้าข้อมูลสำเร็จ');
  // reload
  await reloadInstance();
};

// Load mapping


// ✅ group PLO เช่น 1.1 → 1
const ploGroups = subPlos.reduce((acc, p) => {
  const code = p.code.match(/\d+(\.\d+)?/)[0];
  const [plo] = code.split('.');
  if (!acc[plo]) acc[plo] = [];
  acc[plo].push({
    ...p,
    cleanCode: code   
  });
  return acc;
}, {});

const isOwner =
  user &&
  (
    user.id === ownerUser?.id ||
    user.can_edit_all_courses === true
  );
const hasOwner = !!ownerUser;

if (loadingCourses) {
  return <div>Loading...</div>;
}
  /* =========================
     UI
  ========================= */
  return (
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
  <InstructorMenu />
  <div className="p-6 space-y-6">
    
<div className="bg-white rounded-2xl shadow p-5 mb-6">
  <div className="flex items-center justify-between">
    <h2 className="text-xl font-bold">
      เพิ่มรายวิชา และจัดการ CLOs
    </h2>
    <button
      onClick={handleNext}
      className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg"
    >
      Teaching Plan
    </button>
  </div>
</div>

<Card className="min-h-[120px]">
  <div className="flex flex-wrap gap-3 items-center min-h-[40px]">
    <Select 
    value={year} onChange={e => { 
      setYear(e.target.value);
      setSelectedCourse('');
      setCourseDetail(null);
      setInstanceId(null);
      setSavedClos([]);
    }}>
      <option value="">-- ปีการศึกษา --</option>
      {[2568,2569,2570,2571,2572,2573,2574].map(y => (
        <option key={y}>{y}</option>
      ))}
    </Select>
    <Select value={semester} onChange={e => { 
      setSemester(e.target.value);
      setSelectedCourse('');
      setCourseDetail(null);
      setInstanceId(null);
      setSavedClos([]);
      }}>
      <option value="">-- เทอม --</option>
      <option value="1">เทอม 1</option>
      <option value="2">เทอม 2</option>
    </Select>
    <Select className="w-64"
    value={selectedCourse} onChange={e => handleSelect(e.target.value)}>
      <option value="">-- เลือกวิชา --</option>
      {courses.map(c => (
        <option key={c.id} value={c.id}>
          {c.code_en} - {c.name_th}
        </option>
      ))}
    </Select>
    <Button
        onClick={handleImport}
        className="bg-purple-500 text-white"
    >
      📥 นำเข้าจากปีอื่น
    </Button>
  </div>
  {courseDetail && (
    <div className="mt-4 text-sm text-gray-600">
      <p className="font-medium">{courseDetail.name_th}</p>
      <p>{courseDetail.description}</p>
    </div>
  )}
</Card>

<Card className="mb-6">
  <div className="flex justify-between items-center mb-3">
    <h3 className="font-semibold">
      ผู้รับผิดชอบรายวิชา
    </h3>
    <div className="flex gap-2">
    <Button
      disabled={hasOwner && !isOwner}
      onClick={() => setShowPopup('owner')}
    >
      ➕ เลือก
    </Button>
    <Button
      disabled={!ownerUser}
      onClick={handleSaveOwner}
      className="bg-green-500 text-white"
      >
      💾 บันทึกผู้รับผิดชอบ
    </Button>
    </div>
  </div>
{!hasOwner && (
  <div className="text-yellow-600 text-sm">
    ⚠️ กรุณากำหนดผู้รับผิดชอบก่อนใช้งาน
  </div>
)}
{hasOwner && (
  <div className="text-green-600 text-sm mb-2">
    ✅ บันทึกผู้รับผิดชอบแล้ว
  </div>
)}
  {(ownerUser || owner) && (
    <div className="bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg inline-block">
      {(ownerUser || owner).name_th}
      <button
        disabled={hasOwner && !isOwner}
        onClick={() => setOwnerUser(null)}
        className="ml-2 text-red-500"
      >
        ❌
      </button>
    </div>
  )}
</Card>

        {/* ✅ CLO FORM */}
<Card>
  <h3 className="font-semibold mb-4">จัดการ CLOs</h3>

  {owner && (
    <div className="text-sm mb-2">
      👑 ผู้รับผิดชอบ: {owner.name_th}
    </div>
  )}

  {!isOwner && (
    <div className="text-red-500 text-sm mb-2">
      🔒 ไม่มีสิทธิ์แก้ไข
    </div>
  )}

  {/* FORM */}
  <div className="grid grid-cols-12 gap-3">

    <div className="col-span-2">
      <Input
        disabled={!isOwner}
        placeholder="CLO Code เช่น CLO1"
        value={currentClo.code}
        onChange={e =>
          setCurrentClo({ ...currentClo, code: e.target.value })
        }
      />
    </div>
    <div className="col-span-10">
      <Input
        placeholder="คำอธิบาย (ไม่ต้องใส่เลขหัวข้อ)"
        value={currentClo.description}
        onChange={e =>
          setCurrentClo({ ...currentClo, description: e.target.value })
        }
      />
    </div>

  </div>
  {/* BUTTON */}
  <div className="mt-4">
  <div className="font-medium mb-2">
    SubPLO Mapping
  </div>
  <div className="flex flex-wrap gap-3">
    {subPlos.map(sp => (
      <label 
        key={sp.id}
        className="relative flex gap-2 group"
        >
        <input
          type="checkbox"
          checked={
            (currentClo.subPloIds || []).includes(sp.id)
          }
          onChange={(e)=>{
            let arr =
              [...currentClo.subPloIds];
            if(e.target.checked){
              arr.push(sp.id);
            } else {
              arr =
                arr.filter(
                  id => id !== sp.id
                );
            }
            setCurrentClo({
              ...currentClo,
              subPloIds: arr
            });
          }}
        />
        <span className="cursor-help text-blue-600">
        {sp.code} ⓘ
        </span>
        <div className=" hidden
              group-hover:block
              absolute
              z-50
              w-80
              p-3
              text-sm
              bg-black
              text-white
              rounded-lg
              shadow-lg
              left-0
              top-6
              "
        >
          {sp.description}
        </div>
      </label>
    ))}
  </div>
</div>

<div className="mt-4">
  <div className="font-medium mb-2">
    KSEC Mapping
  </div>
  <div className="flex flex-wrap gap-3">
    {ksecs.map(k => (
      <label key={k.id} className="flex gap-2">
        <input
          type="checkbox"
          checked={
            (currentClo.ksecIds || []).includes(k.id)
          }
          onChange={(e)=>{
            let arr = [...currentClo.ksecIds];
            if(e.target.checked){
              arr.push(k.id);
            } else {
              arr = arr.filter(id => id !== k.id);
            }
            setCurrentClo({
              ...currentClo,
              ksecIds: arr
            });
          }}
        />
        {k.code}
      </label>
    ))}
  </div>
</div>

  <div className="mt-3">
    <Button disabled={!isOwner} onClick={addIndicator}>➕ Indicator</Button>
  </div>

{/* ✅ INDICATORS */}
<div className="mt-4 space-y-2">
  {currentClo.indicators.map((ind, i) => (
    <div
      key={i}
      className="grid grid-cols-12 gap-2 bg-gray-50 p-3 rounded-lg"
    >
      <div className="col-span-8">
        <Input
          disabled={!isOwner}
          value={ind.description}
          onChange={e => {
            const updated = [...currentClo.indicators];
            updated[i].description = e.target.value;
            setCurrentClo({ ...currentClo, indicators: updated });
          }}
        />
      </div>

      <div className="col-span-3">
        <Input
          disabled={!isOwner}
          type="number"
          placeholder="เป้า"
          value={ind.target}
          onChange={e => {
            const updated = [...currentClo.indicators];
            updated[i].target = e.target.value;
            setCurrentClo({ ...currentClo, indicators: updated });
          }}
        />
      </div>
      <div className="col-span-12">
  <div className="text-sm font-medium mb-2">
    PLO Indicator Mapping (เช็คเฉพาะตัวชี้วัดที่ตรงกับตัวชี้วัด PLO)
  </div>
  <div className="flex flex-wrap gap-3">
    {ploIndicators.map(pi => (
<label
  key={pi.id}
  className="relative flex gap-2 group"
>
  <input
    type="checkbox"
    checked={(ind.ploIndicatorIds || []).includes(pi.id)}
    onChange={(e) => {
const updated = [...currentClo.indicators];
let mapping = updated[i].ploIndicatorIds || [];
if (e.target.checked) {
  mapping = [...mapping, pi.id];
} else {
  mapping = mapping.filter(id => id !== pi.id);
}
updated[i].ploIndicatorIds = mapping;
setCurrentClo({...currentClo,
  indicators: updated
});
    }}
  />
<span className="cursor-help text-blue-600">
  {pi.code} ⓘ
</span>
<div className="
    hidden
    group-hover:block
    absolute
    z-50
    w-80
    p-3
    text-sm
    bg-black
    text-white
    rounded-lg
    shadow-lg
    left-0
    top-6
    "
>
  {pi.description}
</div>
</label>
    ))}
  </div>
</div>

    </div>
  ))}
</div>
<div className="mt-4">
  <Button disabled={!isOwner} onClick={handleSave}>
    💾 Save CLOs
  </Button>
    <div className="mt-4 text-sm text-gray-600">
    กรณีเพิ่ม CLO ใหม่ หรือกดแก้ไข CLO ให้กดปุ่มบันทึกนี้ทุกครั้ง
    </div>

</div>
</Card>

{/* LIST */}
<Card>
  <h4 className="font-semibold mb-3">รายการ CLOs</h4>
  <div className="space-y-3">
    {savedClos.map(c => (
<div key={c.id} className="border rounded-lg p-3 bg-gray-50">
        <div className="flex justify-between">
  
  <div>
  <b className="text-blue-600">{c.code}</b>
  {' - '}{c.description}{' '}
  {(c.subPloIds || []).length > 0 && (
    <span className="text-purple-600 text-sm">
      ({(c.subPloIds || [])
      .map(id => {
            const sp = subPlos.find(s => Number(s.id) === Number(id));
            return sp?.code;
          })
          .filter(Boolean)
          .join(', ')
      })
    </span>
  )}{' '}
  {(c.ksecIds || []).length > 0 && (
    <span className="text-green-600 text-sm">
      ({(c.ksecIds || [])
        .map(id => {
            const k = ksecs.find(x => Number(x.id) === Number(id));
            return k?.code;
          })
          .filter(Boolean)
          .join(', ')
      })
    </span>
  )}
</div>

          <div>
            <button onClick={() => 
            setCurrentClo({...c,
              subPloIds: c.subPloIds || [],
              ksecIds: c.ksecIds || [],
              indicators: (c.indicators || []).map(ind => ({...ind,
              ploIndicatorIds: ind.ploIndicatorIds || []}))
              })                  
              } 
            className="mr-2">✏️</button>
            <button onClick={() => handleDelete(c.id)} className="text-red-500">❌</button>
          </div>
        </div>

        <ul className="mt-2 text-sm text-gray-600">
          {(c.indicators || []).map((ind, i) => (
<li key={i}>
  <div>
    {ind.description}(target: {ind.target})
  </div>
  <div className="text-xs text-blue-600">
    {
      (ind.ploIndicatorIds || [])
      .map(id => {
        const p = ploIndicators.find(x =>
              Number(x.id) === Number(id)
          );
        return p?.code;
      })
      .filter(Boolean)
      .join(', ')
    }
  </div>
</li>
          ))}
        </ul>
      </div>
    ))}
  </div>
  <div className="mt-4">
  <Button disabled={!isOwner} onClick={handleSave}>
    💾 Save CLOs
  </Button>
    <div className="mt-4 text-sm text-gray-600">
    กรณีลบ CLO ให้กดปุ่มบันทึกนี้ทุกครั้ง (ระวัง!หากลบ CLO ที่กรอกคะแนนไปแล้ว ต้องกรอกคะแนนใหม่)
    </div>
  </div>
</Card>

<Card>
  <h4 className="font-semibold mb-4">Mapping CLOs / SubPLOs</h4>
<div className="overflow-x-auto flex justify-start">
  <table className="text-sm w-auto border min-w-max">      
    {/* ✅ HEADER */}
    <thead className="bg-gray-100 sticky top-0 z-10 px-4 py-2 text-center">
      {/* ✅ ROW 1: PLO */}
      <tr>
        <th rowSpan="2" className="text-left px-4 py-2">
          CLO
        </th>

{Object.entries(ploGroups).map(([plo, list], index) => (
  <th
    key={plo}
    colSpan={list.length}
    className="px-4 py-1 text-center border-r-2 border-gray-300"
  >
    PLO {plo}
  </th>
))}
      </tr>
      {/* ✅ ROW 2: SubPLO */}
      <tr>
{Object.values(ploGroups).flat().map((p, i, arr) => {
  const isLastInGroup =
    i === arr.length - 1 ||
    arr[i + 1].code.split('.')[0] !== p.code.split('.')[0];

  return (
<th
  key={p.id}
  className={`px-3 py-2 text-center text-xs group ${
    isLastInGroup
      ? 'border-r-2 border-gray-300'
      : ''
  }`}
>
  {p.cleanCode}
</th>
  );
})}
      </tr>
    </thead>
    {/* ✅ BODY */}
    <tbody>
      {savedClos.map(c => {
        return (
          <tr key={c.id} className="border-t text-center hover:bg-gray-50">
            {/* CLO */}
            <td className="p-2 text-left font-medium">
              {c.code}
            </td>
            {/* SubPLO cells */}
            {Object.values(ploGroups).flat().map((p, i, arr) => {
  const current = p.cleanCode.split('.')[0];
  const next = arr[i + 1]?.cleanCode?.split('.')[0];
  const isLastInGroup = current !== next;
  return (
    <td
      key={p.id}
      className={`px-3 py-2 text-center ${
        isLastInGroup ? 'border-r-2 border-gray-300' : ''
      }`}
    >
      {(c.subPloIds || []).map(Number).includes(Number(p.id))
    ? '✓'
    : ''}
    </td>
  );
})}
          </tr>
        );
      })}
    </tbody>
  </table>
</div>
</Card>

<div className="flex justify-end">
  <button
    onClick={handleNext}
    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg"
  >
    ➡️ ไป STEP 2
  </button>
</div>
</div>

{showPopup === 'owner' && (
  <div
    onClick={() => setShowPopup(null)}
    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-2xl shadow-xl p-5 w-[420px]"
    >
      <h3 className="font-semibold mb-3">เลือกผู้รับผิดชอบ</h3>

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
            const already = ownerUser?.id === i.id;
            return (
              <div
                key={i.id}
                className="flex justify-between items-center p-2 rounded hover:bg-gray-100"
              >
                <span>{i.name_th}</span>
                <button
                  disabled={(hasOwner && !isOwner) || already}
                  onClick={() => {
                    setOwnerUser(i);
                    setShowPopup(null);
                  }}
                  className={`
                    px-2 py-1 rounded text-sm
                    ${already
                      ? 'bg-gray-200 text-gray-500'
                      : 'bg-green-500 text-white hover:bg-green-600'}
                  `}
                >
                  {already ? '✔ เลือกแล้ว' : 'เลือก'}
                </button>
              </div>
            );
          })}
      </div>

      {/* CLOSE */}
      <div className="mt-4 text-right">
        <button
          onClick={() => setShowPopup(null)}
          className="text-gray-500"
        >
          ปิด
        </button>
      </div>
    </div>
  </div>
)}

</div>    
  );
}