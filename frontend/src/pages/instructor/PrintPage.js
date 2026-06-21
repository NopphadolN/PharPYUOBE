import { useState } from 'react';
import api from '../../services/api';
import InstructorMenu from '../../components/InstructorMenu';
import Card from '../../components/ui/Card';

import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

export default function PrintPage() {

  const [docType, setDocType] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [courses, setCourses] = useState([]);

  // ✅ load courses
const loadCourses = async () => {
  if (!year || !semester) {
    alert('กรุณาเลือกปีและเทอม');
    return;
  }
  try {
    
    const res = await api.get('/instructor/dashboard-by-term', {
      params: {
        year,
        semester,       
      }
    });
    console.log("PRINT COURSES:", res.data);
    setCourses(res.data);
  } catch (err) {
    console.error("LOAD ERROR:", err);
  }
};

  const handlePrint = (id) => {
    if (!docType) {
      alert('กรุณาเลือกประเภทเอกสาร');
      return;
    }
    let url = '';
if (docType === 'plan') {
  url = `https://pharpyuobe.onrender.com/api/instructor/print-plan/${id}`;
}
else if (docType === 'tqf3') {
  url = `https://pharpyuobe.onrender.com/api/instructor/print-tqf3/${id}`;
}
else if (docType === 'tqf5') {
  url = `https://pharpyuobe.onrender.com/api/instructor/print-tqf5/${id}`;
}
    window.open(url, '_blank');
  };

  return (
<div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-white">
  <InstructorMenu />
  <div className="flex-1 p-6 space-y-6">
    {/* HEADER */}
    <div className="bg-white rounded-2xl shadow p-5">
      <h2 className="text-xl font-bold">📄 พิมพ์เอกสาร</h2>
    </div>

        {/* ✅ STEP 1: TYPE */}
<Card>
  <h3 className="font-semibold mb-3">ขั้นตอนที่ 1: เลือกประเภทเอกสาร</h3>

  <Select
    value={docType}
    onChange={e => setDocType(e.target.value)}
  >
    <option value="">เลือกประเภทเอกสาร</option>
    <option value="plan">แผนการสอน</option>
    <option value="mko3">มคอ.3-ยังใช้งานไม่ได้-</option>
    <option value="mko5">มคอ.5-ยังใช้งานไม่ได้-</option>
  </Select>
</Card>

        {/* ✅ STEP 2: YEAR + SEM */}
<Card>
  <h3 className="font-semibold mb-3">ขั้นตอนที่ 2: เลือกปีการศึกษา</h3>

  <div className="flex flex-wrap gap-3">

    <Select value={year} onChange={e => setYear(e.target.value)}>
      <option value="">ปีการศึกษา</option>
      {[2568,2569,2570,2571,2572,2573].map(y => (
        <option key={y}>{y}</option>
      ))}
    </Select>

    <Select value={semester} onChange={e => setSemester(e.target.value)}>
      <option value="">เทอม</option>
      <option value="1">1</option>
      <option value="2">2</option>
    </Select>

    <Button onClick={loadCourses}>
      🔍 ค้นหา
    </Button>

  </div>
</Card>


        {/* ✅ STEP 3: COURSE LIST */}
<Card>
  <h3 className="font-semibold mb-3">ขั้นตอนที่ 3: เลือกรายวิชา</h3>

  {Array.isArray(courses) && courses.length > 0 ? (

    <div className="grid grid-cols-2 gap-3">

      {courses.map(c => (
        <div
          key={c.id}
          onClick={() => handlePrint(c.id)}
          className="
            border rounded-lg p-4 cursor-pointer
            hover:bg-blue-50 hover:border-blue-400
            transition
          "
        >
          <div className="font-medium text-blue-600">
            {c.code_en}
          </div>

          <div className="text-sm text-gray-600">
            {c.name_th}
          </div>

          <div className="mt-2 text-xs text-gray-400">
            คลิกเพื่อพิมพ์
          </div>

        </div>
      ))}

    </div>

  ) : (
    <div className="text-gray-400">
      ยังไม่มีรายวิชา (กรุณาค้นหาก่อน)
    </div>
  )}

</Card>
</div>
</div>    
  );
}