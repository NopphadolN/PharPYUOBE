import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import InstructorMenu from '../../components/InstructorMenu';

export default function Dashboard() {

  const [user, setUser] = useState(null);
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');

  const [teaching, setTeaching] = useState([]);
  const [responsible, setResponsible] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    api.get('/instructor/me')
      .then(res => setUser(res.data))
      .catch(console.error);
  }, []);

  const loadData = async () => {
    if (!year || !semester) return;

    try {
      const res = await api.get('/instructor/dashboard-full', {
        params: { year, semester }
      });

      setTeaching(res.data.teaching || []);
      setResponsible(res.data.responsible || []);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [year, semester]);

  const totalHours = teaching.reduce(
    (sum, c) => sum + Number(c.total_hours || 0),
    0
  );

  const goStep2 = (c) => {
    navigate('/instructor/course/step2', {
      state: {
        course_id: c.course_id,
        instance_id: c.instance_id,
        year,
        semester
      }
    });
  };

  return (
    <div style={page}>

      <InstructorMenu />

      <div style={content}>

        {/* HEADER */}
        <div style={headerCard}>
          <div>
            <h2 style={{ margin: 0 }}>👋 {user?.name_th}</h2>
            <p style={subText}>แดชบอร์ดผู้สอนรายวิชา</p>
          </div>

          <div style={filterBox}>
            <select value={year} onChange={e => setYear(e.target.value)} style={input}>
              <option value="">ปีการศึกษา</option>
              <option value="2568">2568</option>
              <option value="2569">2569</option>
              <option value="2570">2570</option>
            </select>

            <select
              value={semester}
              onChange={e => setSemester(e.target.value)}
              style={input}
            >
              <option value="">เทอม</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>
        </div>


        {/* GRID */}
        <div style={grid}>

          {/* วิชาที่สอน */}
          <div style={card}>
            <h3>📚 วิชาที่สอน</h3>

            {teaching.length === 0 && <p>ไม่มีข้อมูล</p>}

            {teaching.map(c => (
              <div key={c.id} style={itemCard}>
                <div>
                  <b>{c.code_en} - {c.name_th}</b>
                  <div style={subText}>⏱ {c.total_hours || 0} ชั่วโมง</div>
                </div>

                <span style={badge}>
                  {c.total_hours || 0} ชม.
                </span>
              </div>
            ))}

            <div style={footer}>
              รวมทั้งหมด: <b>{totalHours}</b> ชั่วโมง
            </div>
          </div>


          {/* วิชาที่รับผิดชอบ */}
          <div style={card}>
            <h3>📘 วิชาที่รับผิดชอบ</h3>

            {responsible.length === 0 && <p>ไม่มีข้อมูล</p>}

            {responsible.map(c => (
              <div
                key={c.id}
                style={{ ...itemCard, cursor: 'pointer' }}
                onClick={() => goStep2(c)}
              >
                <div>
                  <b>{c.code_en} - {c.name_th}</b>
                  <div style={subText}>
                    ✅ {c.pass_students || 0}/{c.total_students || 0}
                  </div>
                </div>

                <button style={btnPrimary}>
                  จัดการ
                </button>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const page = {
  display: 'flex',
  background: 'linear-gradient(135deg, #EAF6F6, #FFFFFF)',
  minHeight: '100vh'
};

const content = {
  flex: 1,
  padding: 30
};

const headerCard = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  marginBottom: 20
};

const grid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 20
};

const card = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
};

const itemCard = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 14,
  borderRadius: 10,
  background: '#F9FAFB',
  marginBottom: 10,
  transition: '0.2s'
};

const badge = {
  background: '#6FCF97',
  color: '#fff',
  padding: '6px 10px',
  borderRadius: 8,
  fontSize: 12
};

const btnPrimary = {
  background: 'linear-gradient(135deg, #4DA8DA, #3B82F6)',
  color: 'white',
  border: 'none',
  padding: '8px 14px',
  borderRadius: 8,
  cursor: 'pointer'
};

const footer = {
  marginTop: 10,
  paddingTop: 10,
  borderTop: '1px solid #eee'
};

const subText = {
  fontSize: 13,
  color: '#6B7280'
};

const filterBox = {
  display: 'flex',
  gap: 10
};

const input = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #ddd'
};