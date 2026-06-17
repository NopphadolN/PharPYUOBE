import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import InstructorMenu from '../../components/InstructorMenu';
import Card from '../../components/ui/Card';

export default function Dashboard() {

  const [user, setUser] = useState(null);
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');

  const [teaching, setTeaching] = useState([]);
  const [responsible, setResponsible] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
  const currentYear = new Date().getFullYear() + 543;
  setYear(String(currentYear));
}, []);

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
<div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-white">

  <InstructorMenu />

  <div className="flex-1 p-6">

    {/* HEADER */}
    <div className="bg-white rounded-2xl shadow p-5 flex justify-between items-center mb-6">
      <div>
        <h2 className="text-xl font-bold">{user?.name_th}</h2>
        <p className="mt-3 text-gray-500 text-m">อาจารย์ประจำหลักสูตร</p>
      </div>

      <div className="flex gap-2">
        <select
          className="border rounded-lg px-3 py-2"
          value={year}
          onChange={e => setYear(e.target.value)}
        >
          <option value="">ปีการศึกษา</option>
          <option value="2568">2568</option>
          <option value="2569">2569</option>
          <option value="2570">2570</option>
          <option value="2571">2571</option>
          <option value="2572">2572</option>
          <option value="2573">2573</option>
        </select>

        <select
          className="border rounded-lg px-3 py-2"
          value={semester}
          onChange={e => setSemester(e.target.value)}
        >
          <option value="">เทอม</option>
          <option value="1">1</option>
          <option value="2">2</option>
        </select>
      </div>
    </div>

    {/* GRID */}
    <div className="grid grid-cols-2 gap-6">

      {/* วิชาที่สอน */}
      <Card>
        <h3 className="font-semibold mb-3">📚 วิชาที่สอน</h3>

        {teaching.map(c => (
          <div key={c.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-2">
            <div>
              <b>{c.code_en} - {c.name_th}</b>
              <div className="text-sm text-gray-500">
                ⏱ ชั่วโมงสอนรวม {c.total_hours || 0} ชั่วโมง
              </div>
            </div>

            <span className="bg-green-400 text-white text-xs px-2 py-1 rounded">
              {c.total_hours || 0}
            </span>
          </div>
        ))}

        <div className="mt-3 border-t pt-3">
          รวมชั่วโมงสอนทั้งหมด {totalHours} ชั่วโมง
        </div>
      </Card>

      {/* วิชาที่รับผิดชอบ */}
      <Card>
        <h3 className="font-semibold mb-3">📘 วิชาที่รับผิดชอบ</h3>

        {responsible.map(c => (
          <div key={c.id} 
            onClick={() => goStep2(c)}
            className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-2 cursor-pointer hover:bg-blue-50 transition"
          >
            <div>
              <b>{c.code_en} - {c.name_th}</b>
              <div className="text-sm text-gray-500">
                ✅ จำนวนนักศึกษา {c.pass_students}/{c.total_students}
              </div>
            </div>

            <button className="bg-blue-500 text-white px-3 py-1 rounded-lg">
              จัดการ
            </button>
          </div>
        ))}
      </Card>

    </div>

  </div>
</div>
  );
}
