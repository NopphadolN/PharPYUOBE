import { useState, useEffect } from 'react';
import api from '../../services/api';
import InstructorMenu from '../../components/InstructorMenu';
import * as XLSX from 'xlsx';

export default function StudentEnrollPage() {

  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');

  const [years, setYears] = useState([]);

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [students, setStudents] = useState([]);
  const [inputCode, setInputCode] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);

  const [user, setUser] = useState(null);

  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);


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
     สร้างปีการศึกษา (อัตโนมัติ)
  ========================= */
  useEffect(() => {

    const thisYear = new Date().getFullYear() + 543;

    const arr = [];
    for (let i = 0; i < 5; i++) {
      arr.push(thisYear - i);
    }

    setYears(arr);

  }, []);

  /* =========================
     LOAD COURSES
  ========================= */
  const loadCourses = async () => {
  if (!year || !semester) return;
  const user = await api.get('/instructor/me');
  const res = await api.get('/student/courses-by-term', {
    params: {
      year,
      semester,
      userId: user.data.id
    }
  });
  setCourses(res.data);
  };

  const handleSelect = async (id) => {
  const course = courses.find(x => x.id === id);
  setSelectedCourse(course);
  const res = await api.get('/student/course-students', {
    params: { course_instance_id: id }
  });
  setStudents(res.data);
  };

  /* =========================
     LOAD STUDENTS
  ========================= */
  const loadStudents = async (course) => {

    setSelectedCourse(course);

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

    await api.post('/student/course-students', {
      course_instance_id: selectedCourse.id,
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
    const data = await file.arrayBuffer();

    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const ids = [];

    for (let r of rows) {

      const res = await api.get('/student/student-by-code', {
        params: { code: r.user_code }
      });

      if (res.data) ids.push(res.data.id);
    }

    await api.post('/student/course-students', {
      course_instance_id: selectedCourse.id,
      studentIds: ids
    });

    loadStudents(selectedCourse);
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
        course_instance_id: selectedCourse.id,
        studentIds: selectedRows
      }
    });

    loadStudents(selectedCourse);
  };

  /* =========================
     UI
  ========================= */
  return (
    <div>

      <InstructorMenu />

      <div style={{ padding: 20 }}>

        <h2>👨‍🎓 จัดการนักศึกษา</h2>

        {/* ✅ YEAR DROPDOWN */}
        <select
          value={year}
          style={{ height: 30 }}
          onChange={(e) => setYear(e.target.value)}
        >
          <option value="">-- ปีการศึกษา --</option>
          <option value="2569">2569</option>
          <option value="2570">2570</option>
          <option value="2571">2571</option>
          <option value="2572">2572</option>
          <option value="2573">2573</option>
          <option value="2574">2574</option>
        </select>

        {/* ✅ SEMESTER DROPDOWN */}
        <select
          value={semester}
          style={{ marginLeft: 5, height: 30 }}
          onChange={(e) => setSemester(e.target.value)}
        >
          <option value="">-- เทอม --</option>
          <option value="1">1</option>
          <option value="2">2</option>
        </select>

        <button style={{ marginLeft: 5, height: 30 }} 
        onClick={loadCourses}>ค้นหา</button>

        <hr />

{/* ✅ PART 1: รายวิชา */}
<div>

  <h3>📚 รายวิชา</h3>

  {courses.map(c => (
    <div
      key={c.id}
      onClick={() => loadStudents(c)}
      style={{
        cursor: 'pointer',
        padding: 5,
        border: '1px solid #ddd',
        marginBottom: 5
      }}
    >
      {c.code_th} - {c.name_th}
    </div>
  ))}

</div>

<hr />

{/* ✅ PART 3: ตารางนักศึกษา (ย้ายลงมา) */}
<div>

  <h3>👨‍🎓 นักศึกษา</h3>

  {selectedCourse && (
    <h4>
      {selectedCourse.code_th} - {selectedCourse.name_th}
    </h4>
  )}

  <table 
      border="1"
      cellPadding="5"
      style={{
        tableLayout: 'auto',   // ✅ ให้ขนาด auto ตาม content
        borderCollapse: 'collapse'
        }}
  >
    <thead>
      <tr>
        <th></th>
        <th>รหัส</th>
        <th>ชื่อ</th>
      </tr>
    </thead>

    <tbody>
      {students.map(s => (
        <tr key={s.id}>
          <td>
            <input
              type="checkbox"
              checked={selectedRows.includes(s.id)}
              onChange={() => toggleSelect(s.id)}
            />
          </td>
          <td>{s.user_code}</td>
          <td>{s.name_th}</td>
        </tr>
      ))}
    </tbody>
  </table>

  <button style={{ marginTop: 5, height: 30 }} 
  onClick={deleteSelected}>
    ❌ ลบที่เลือก  
  </button>

</div>

        <hr />

        {/* ✅ PART 2 */}
        <h3>➕ เพิ่มนักศึกษา</h3>
<div style={{ position: 'relative', width: 250, }}>
  <input
    placeholder="รหัสนักศึกษา"
    style={{ height: 25 }}
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
  {/* ✅ dropdown */}
  {showDropdown && searchResults.length > 0 && (
    <div style={{
      position: 'absolute',
      top: '100%',
      left: 0,
      width: '100%',
      border: '1px solid #ccc',
      background: '#fff',
      zIndex: 10
    }}>
      {searchResults.map(s => (
        <div
          key={s.id}
          style={{
            padding: 5,
            cursor: 'pointer'
          }}
          onClick={() => {
            setInputCode(s.user_code);    // ✅ autofill
            setShowDropdown(false);
          }}
        >
          {s.user_code} - {s.name_th}
        </div>
      ))}
    </div>
  )}
</div>

        <button style={{ marginTop: 5, height: 30 }}
        onClick={addStudent}>เพิ่ม</button>

        <input style={{ marginLeft: 5 }}
        type="file" onChange={handleFile} />

<div onClick={(e) => e.stopPropagation()}></div>

      </div>
    </div>
  );
}