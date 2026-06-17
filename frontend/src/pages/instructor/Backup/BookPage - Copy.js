import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import InstructorMenu from '../../components/InstructorMenu';

export default function CourseBook() {

  const location = useLocation();
  const navigate = useNavigate();

  const { course_id, year, semester } = location.state || {};

  const [books, setBooks] = useState([]);
  const [newBook, setNewBook] = useState('');

  const [grading, setGrading] = useState([]);
  const [currentGrade, setCurrentGrade] = useState({
    min: '',
    max: '',
    grade: ''
  });

  const [instanceId, setInstanceId] = useState(null);

  /* =========================
     LOAD DATA
  ========================= */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/instructor/instance', {
          params: { course_id, year, semester }
        });

        if (res.data) {
          setInstanceId(res.data.id);

          setBooks(res.data.books || []);
          setGrading(res.data.grading || []);
        }

      } catch (err) {
        console.error(err);
      }
    })();
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

    await api.post('/instructor/instance/book', {
      course_id,
      year,
      semester,
      books,
      grading
    });


  alert('✅ บันทึกแล้ว');
  // ✅ reload
  const res = await api.get('/instructor/instance', {
    params: { course_id, year, semester }
  });
  setBooks(res.data.books || []);
  setGrading(res.data.grading || []);
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

  /* =========================
     UI
  ========================= */
  return (
    <div>
      <InstructorMenu />

      <div style={{ padding: 20 }}>

        <h2>📚 หนังสือ & เกณฑ์คะแนน</h2>

        {/* ================= BOOK ================= */}
        <h3>หนังสือประกอบการสอน</h3>

        <input
          placeholder="ชื่อหนังสือ"
          value={newBook}
          onChange={(e) => setNewBook(e.target.value)}
          style={{ width: "90%", height: 25 }}
        />
        <button style={{ marginLeft: 5, height: 30 }} onClick={addBook}>➕ เพิ่ม </button>

<ul style={{ marginTop: 10 }}>
  {books.map((b, i) => (
    <li key={i}>
      {i + 1}. {b}
      <button
        style={{ marginLeft: 10 }}
        onClick={() => deleteBook(i)}
      >
        ❌
      </button>
    </li>
  ))}
</ul>

        <hr />

        {/* ================= GRADING ================= */}
        <h3>เกณฑ์การประเมินผล</h3>

        <input
          placeholder="คะแนนต่ำสุด"
          value={currentGrade.min}
          onChange={e => setCurrentGrade({ ...currentGrade, min: e.target.value })}
          style={{ width: 80, height: 25 }}
        />

        <input
          placeholder="คะแนนสูงสุด"
          value={currentGrade.max}
          onChange={e => setCurrentGrade({ ...currentGrade, max: e.target.value })}
          style={{ width: 80, height: 25, marginLeft: 5 }}
        />

        <select
        value={currentGrade.grade}
        onChange={e => setCurrentGrade({...currentGrade, grade: e.target.value})}
        style={{ width: 80, height: 30, marginLeft: 5 }}
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
        </select>

        <button onClick={addGrade} style={{ height: 30, marginLeft: 5 }}>➕ เพิ่ม</button>

        <table border="1" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>คะแนนต่ำสุด</th>
              <th>คะแนนสูงสุด</th>
              <th>เกรด</th>
              <th>ลบ</th>
            </tr>
          </thead>
          <tbody>
            {sortedGrading.map((g, i) => (
              <tr key={i}>
                <td>{g.min}</td>
                <td>{g.max}</td>
                <td>{g.grade}</td>
                <td>
                  <button onClick={() => deleteGrade(g)}>❌</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr />

        <button onClick={handleSave} style={{ height: 30 }}>💾 บันทึก</button>
        <button onClick={goBack} style={{ marginLeft: 5, height: 30 }}>⬅ กลับ Step2</button>

      </div>
    </div>
  );
}