import { useState, useEffect } from 'react';
import api from '../../services/api';
import InstructorMenu from '../../components/InstructorMenu';
import * as XLSX from 'xlsx';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

export default function StudentEnrollPage() {

  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [instanceId, setInstanceId] = useState(null);

  const [students, setStudents] = useState([]);
  const [inputCode, setInputCode] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);

  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [owner, setOwner] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const close = () => setShowDropdown(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  /* =========================
     โหลด user
  ========================= */
  useEffect(() => {
    api.get('/instructor/me')
      .then(res => setUser(res.data));
  }, []);

  /* =========================
     LOAD COURSES
  ========================= */
useEffect(() => {
  if (!year || !semester || !user) {
    return;
  }
  api.get('/instructor/courses')
  .then(res => {
    setCourses(res.data);
  });
}, [year, semester, user
]);

useEffect(() => {
  if (
    !selectedCourseId ||
    !year ||
    !semester
  ) {
    return;
  }
  (async () => {
    try {
      const inst = await api.get('/instructor/instance',
          {
            params: {
              course_id: selectedCourseId,
              year,
              semester
            }
          }
        );
      if (!inst.data) {
        alert('❌ ยังไม่มีการบันทึกวิชานี้ กรุณาสร้างวิชาก่อน');
        setSelectedCourse(null);
        setInstanceId(null);
        setStudents([]);
        return;
      }
      setSelectedCourse(inst.data);
      setOwner(inst.data.owner);
      setInstanceId(inst.data.id);
      const stuRes = await api.get('/student/course-students',
          {
            params: {
              course_instance_id: inst.data.id
            }
          }
        );
      const uniqueStudents = [...new Map(
            stuRes.data.map(s => [s.id, s])
      ).values()
      ];
      setStudents(uniqueStudents);

    }
    catch(err){
      console.error(err);
    }
  })();
}, [selectedCourseId, year, semester]);

  /* =========================
     LOAD STUDENTS
  ========================= */
const loadStudents = async (course) => {
  setSelectedCourse(course);
  // ✅ FIX: set owner จาก course
  setOwner(course.owner);
  const res = await api.get('/student/course-students', {
    params: { course_instance_id: course.id }
  });
  setStudents(res.data);
  setSelectedRows([]);
};

  /* =========================
     ADD STUDENT
  ========================= */
  const addStudent = async () => {
    if (!selectedCourse) return alert('กรุณาเลือกวิชา');
    const res = await api.get('/student/student-by-code', {
      params: { code: inputCode }
    });
    if (!res.data) return alert('ไม่พบ');
  const exists = students.some(
  s => String(s.id) === String(res.data.id)
    );
    if (exists) {
  alert('❌ นักศึกษาอยู่ในรายวิชาแล้ว');
  return;
  }

    await api.post('/student/course-students', {
      course_instance_id: instanceId,
      studentIds: [res.data.id]
    });
    setInputCode('');
    loadStudents(selectedCourse);
  };

  /* =========================
     IMPORT EXCEL
  ========================= */
const handleFile = async (e) => {
  if (!selectedCourse) return alert('เลือกวิชาก่อน');
  const file = e.target.files[0];
  if (!file) return;
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  const codes = rows.map(r =>String(r.usercode || '').trim()).filter(Boolean);
  const duplicateCodes = codes.filter((code, index, arr) =>arr.indexOf(code) !== index);
    if (duplicateCodes.length > 0) {
    const uniqueDup = [...new Set(duplicateCodes)];
  alert(`❌ พบรหัสซ้ำในไฟล์ 
      ${uniqueDup.join('\n')} 
      กรุณาแก้ไขไฟล์ก่อน`
      );
    return;
  }
  const existingCodes = students.map(s =>String(s.usercode));
  const alreadyAdded = codes.filter(code =>existingCodes.includes(code));
    if (alreadyAdded.length > 0) {
  alert(`❌ นักศึกษาต่อไปนี้อยู่ในรายวิชาแล้ว
        ${alreadyAdded.join('\n')}
        กรุณาลบออกจากไฟล์ก่อน`
        );
    return;
  }
  if (!rows.length) {
    return alert('❌ ไฟล์ว่าง');
  }
  if (!rows[0]?.user_code) {
    return alert('❌ ต้องมี column: user_code');
  }
  try {
    const results = await Promise.all(
      rows.map(r =>
        api.get('/student/student-by-code', {
          params: { code: r.user_code }
        })
      )
    );
    const ids = [...new Set(
      results.map(res => res.data?.id).filter(Boolean)
    )];
    if (ids.length === 0) {
      return alert('❌ ไม่พบรหัสนักศึกษา');
    }
    await api.post('/student/course-students', {
      course_instance_id: instanceId,
      studentIds: ids
    });
    alert(`✅ เพิ่ม ${ids.length} คน จาก ${rows.length} รายการ`);
    loadStudents(selectedCourse);
  } catch (err) {
    console.error(err);
    alert('❌ import ล้มเหลว');
  }
  // ✅ reset file
  e.target.value = null;
};

  /* =========================
     CHECKBOX SELECT
  ========================= */
  const toggleSelect = (id) => {
    setSelectedRows(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  /* =========================
     DELETE
  ========================= */
  const deleteSelected = async () => {
    if (!selectedCourse) return;
    await api.delete('/student/course-students', {
      data: {
        course_instance_id: instanceId,
        studentIds: selectedRows
      }
    });
    loadStudents(selectedCourse);
    setSelectedRows([]);
  };

const isOwner = user &&
  (Number(owner?.id) === Number(user.id) ||
    user.can_edit_all_courses === true);

  /* =========================
     UI
  ========================= */
  return (
<div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-white">
  <InstructorMenu />
  <div className="flex-1 p-6 space-y-6">
    {/* HEADER */}
    <div className="bg-white rounded-2xl shadow p-5">
      <h2 className="text-xl font-bold">👨‍🎓 จัดการนักศึกษา</h2>
    </div>

        {/* ✅ YEAR DROPDOWN */}
<Card>
  <div className="flex flex-wrap gap-3 items-center">

    <Select value={year} onChange={e => setYear(e.target.value)}>
      <option value="">ปีการศึกษา</option>
      {[2568,2569,2570,2571,2572,2573,2574].map(y => (
        <option key={y}>{y}</option>
      ))}
    </Select>

    <Select value={semester} onChange={e => setSemester(e.target.value)}>
      <option value="">เทอม</option>
      <option value="1">1</option>
      <option value="2">2</option>
    </Select>
       

    <Select
      value={selectedCourseId}
      onChange={e => setSelectedCourseId(e.target.value)
      }
    >
      <option value="">เลือกวิชา</option>
      {courses.map(c => (
        <option
          key={c.id}
          value={c.id}
        >
         {c.code_en} {' - '} {c.name_th}
        </option>
      ))}
    </Select>

  </div>
</Card>

        {/* ✅ PART 2 */}
<Card>
  <h3 className="font-semibold mb-3">➕ เพิ่มนักศึกษา</h3>
    {owner && (
    <div className="text-sm mb-2">
      👑 {owner.name_th}
    </div>
  )}
  {!isOwner && (
    <div className="text-red-500 text-sm mb-2">
      🔒 ไม่มีสิทธิ์
    </div>
  )}
<div className="relative w-64">
  <Input disabled={!isOwner}  
    placeholder="รหัสนักศึกษา"
    value={inputCode}
    onChange={async (e) => {
      const val = e.target.value;
      setInputCode(val);
      if (val.length < 3) {
        setSearchResults([]);
        return;
      }
      const res = await api.get('/student/search-student', {
        params: { keyword: val }
      });
      setSearchResults(res.data);
      setShowDropdown(true);
    }}
  />
  {showDropdown && searchResults.length > 0 && (
    <div 
      onClick={(e) => e.stopPropagation()}
      className="absolute w-full bg-white border rounded-lg shadow mt-1 z-10">
      {searchResults.map(s => (
        <div
          key={s.id}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => {
            setInputCode(s.user_code);
            setShowDropdown(false);
          }}
        >
          {s.user_code} - {s.name_th}
        </div>
      ))}
    </div>
  )}
</div>
<div className="flex gap-3 mt-3">
  <Button disabled={!isOwner} onClick={addStudent}>
    ➕ เพิ่ม
  </Button>
  <input disabled={!isOwner}   
    type="file"
    onChange={handleFile}
    className="border p-2 rounded-lg"
  />
</div>
</Card>

{/* ✅ PART 3: ตารางนักศึกษา */}
<Card>
  <h3 className="font-semibold">👨‍🎓 นักศึกษา</h3>
    จำนวน {students.length} คน

  <div className="overflow-x-auto">
    <table className="text-sm border w-auto min-w-max">
      <thead className="bg-gray-100">
        <tr>          
          <th className="border px-2 py-1">#</th>
          <th className="border px-2 py-1">เลือก</th>
          <th className="border px-2 py-1">รหัส</th>
          <th className="border px-2 py-1">ชื่อ</th>
        </tr>
      </thead>
      <tbody>
        {[...students]
  .sort((a, b) => String(a.user_code).localeCompare(String(b.user_code)))
  .map((s, index) => (
          <tr key={s.id} className="border-t hover:bg-gray-50">
            <td className="border text-center">{index + 1}</td>
            <td className="px-3 py-2 text-center">
              <input
                type="checkbox"                
                checked={selectedRows.includes(s.id)}
                onChange={() => toggleSelect(s.id)}
              />
            </td>
            <td className="px-3 py-2">{s.user_code}</td>
            <td className="px-3 py-2">{s.name_th}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  <div className="mt-3">
    <button disabled={!isOwner || selectedRows.length === 0}     
      onClick={deleteSelected}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
    >
      ❌ ลบที่เลือก
    </button>
  </div>
</Card>
      </div>
    </div>
  );
}