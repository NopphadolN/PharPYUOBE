import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import InstructorMenu from '../../components/InstructorMenu';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

export default function CourseBook() {

  const location = useLocation();
  const navigate = useNavigate();

  const { course_id, year, semester, instanceId: initInstanceId } 
  = location.state || {};

  const [books, setBooks] = useState([]);
  const [newBook, setNewBook] = useState('');

  const [grading, setGrading] = useState([]);
  const [currentGrade, setCurrentGrade] = useState({
    min: '',
    max: '',
    grade: ''
  });

  const [instanceId, setInstanceId] = useState(initInstanceId || null);
  const [owner, setOwner] = useState(null);
  const [user, setUser] = useState(null);

  /* =========================
     LOAD DATA
  ========================= */
useEffect(() => {
  if (!course_id || !year || !semester) return;
  (async () => {
    try {
      const res = await api.get('/instructor/instance', {
        params: { course_id, year, semester }
      });
      if (res.data) {
        setInstanceId(res.data.id);
        setBooks(res.data.books || []);
        setGrading(res.data.grading || []);
        setOwner(res.data.owner);
      }
    } catch (err) {
      console.error(err);
    }
  })();
}, [course_id, year, semester]);

  useEffect(() => {
  api.get('/instructor/me')
    .then(res => setUser(res.data))
    .catch(console.error);
}, []);

  /* =========================
     BOOK
  ========================= */
  const addBook = () => {
    if (!newBook) return;
    setBooks([...books, newBook]);
    setNewBook('');
  };

  const deleteBook = (index) => {
    setBooks(books.filter((_, i) => i !== index));
  };

  /* =========================
     GRADING
  ========================= */
  const addGrade = () => {
    if (!currentGrade.min || !currentGrade.max || !currentGrade.grade) return;
    setGrading([
      ...grading,
      {
        min: currentGrade.min,
        max: currentGrade.max,
        grade: currentGrade.grade
      }
    ]);
    setCurrentGrade({ min: '', max: '', grade: '' });
  };

const deleteGrade = (target) => {
  setGrading(prev =>
    prev.filter(g =>
      !(g.min === target.min &&
        g.max === target.max &&
        g.grade === target.grade)
    )
  );
};

  /* =========================
     SAVE (overwrite ✅)
  ========================= */
  const handleSave = async () => {
    
    console.log("SAVE BOOK:", {
  course_instance_id: instanceId,
  books,
  grading
});

await api.post('/instructor/instance/book', {
  course_instance_id: instanceId,
  books,
  grading
});
  alert('✅ บันทึกแล้ว');
  
  // ✅ reload
const res = await api.get('/instructor/instance', {
  params: { course_id, year, semester }
});
const data = res.data;
setBooks(data.books || []);
setGrading(data.grading || []);
}

  /* =========================
     NAV
  ========================= */
  const goBack = () => {
    navigate('/instructor/course/step2', {
      state: { course_id, year, semester }
    });
  };

  const gradeOrder = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
  const sortedGrading = [...grading].sort((a, b) => {
  const ai = gradeOrder.indexOf(a.grade);
  const bi = gradeOrder.indexOf(b.grade);
  return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
});

  const isOwner = user && owner && user.id === owner.id;

  /* =========================
     UI
  ========================= */
  return (
<div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-white">

  <InstructorMenu />

  <div className="flex-1 p-6 space-y-6">

    {/* HEADER */}
    <div className="bg-white rounded-2xl shadow p-5">
      <h2 className="text-xl font-bold">📚 หนังสือ & เกณฑ์คะแนน</h2>

      {owner && (
        <div className="text-sm text-gray-600 mt-1">
          👑 ผู้รับผิดชอบ: {owner.name_th}
        </div>
      )}

      {!isOwner && (
        <div className="text-red-500 text-sm mt-2">
          🔒 คุณไม่มีสิทธิ์แก้ไข
        </div>
      )}
    </div>

        {/* ================= BOOK ================= */}
<Card>
  <h3 className="font-semibold mb-4">หนังสือประกอบการสอน</h3>

  {/* INPUT */}
  <div className="flex gap-2 mb-3">
    <Input
      disabled={!isOwner}
      placeholder="ชื่อหนังสือ"
      value={newBook}
      onChange={(e) => setNewBook(e.target.value)}
      className="flex-1"
    />

    <Button disabled={!isOwner} onClick={addBook}>
      ➕ เพิ่ม
    </Button>
  </div>

  {/* LIST */}
  <div className="space-y-2">
    {books.map((b, i) => (
      <div
        key={i}
        className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg"
      >
        <span>
          {i + 1}. {b}
        </span>

        <button
          disabled={!isOwner}
          onClick={() => deleteBook(i)}
          className="text-red-500 hover:text-red-700"
        >
          ❌
        </button>
      </div>
    ))}
  </div>
</Card>

        {/* ================= GRADING ================= */}
<Card>
  <h3 className="font-semibold mb-4">เกณฑ์การประเมินผล</h3>

  {/* FORM */}
  <div className="flex flex-wrap gap-3 items-center mb-4">

    <Input
      disabled={!isOwner}
      placeholder="คะแนนต่ำสุด"
      value={currentGrade.min}
      onChange={e => setCurrentGrade({ ...currentGrade, min: e.target.value })}
      className="w-24"
    />

    <Input
      disabled={!isOwner}
      placeholder="คะแนนสูงสุด"
      value={currentGrade.max}
      onChange={e => setCurrentGrade({ ...currentGrade, max: e.target.value })}
      className="w-24"
    />

    <Select
      disabled={!isOwner}
      value={currentGrade.grade}
      onChange={e =>
        setCurrentGrade({ ...currentGrade, grade: e.target.value })
      }
    >
      <option value="">-- เกรด --</option>
      <option>A</option>
      <option>B+</option>
      <option>B</option>
      <option>C+</option>
      <option>C</option>
      <option>D+</option>
      <option>D</option>
      <option>F</option>
    </Select>

    <Button disabled={!isOwner} onClick={addGrade}>
      ➕ เพิ่ม
    </Button>
  </div>

<div className="overflow-x-auto border rounded-lg">
  <table className="text-sm w-auto min-w-max">

    <thead className="bg-gray-100">
      <tr>
        <th className="px-4 py-2">ต่ำสุด</th>
        <th className="px-4 py-2">สูงสุด</th>
        <th className="px-4 py-2">เกรด</th>
        <th className="px-4 py-2">ลบ</th>
      </tr>
    </thead>

    <tbody>
      {sortedGrading.map((g, i) => (
        <tr key={i} className="border-t hover:bg-gray-50 text-center">
          <td className="px-4 py-2">{g.min}</td>
          <td className="px-4 py-2">{g.max}</td>
          <td className="px-4 py-2 font-semibold text-blue-600">
            {g.grade}
          </td>
          <td className="px-4 py-2">
            <button
              disabled={!isOwner}
              onClick={() => deleteGrade(g)}
              className="text-red-500 hover:text-red-700"
            >
              ❌
            </button>
          </td>
        </tr>
      ))}
    </tbody>

  </table>
</div>
</Card>

        <hr />
<div className="flex gap-3">

  <Button disabled={!isOwner} onClick={handleSave}>
    💾 บันทึก
  </Button>

  <button
    onClick={goBack}
    className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
  >
    ⬅ กลับ Step2
  </button>
</div>
</div>
</div>
  );
}