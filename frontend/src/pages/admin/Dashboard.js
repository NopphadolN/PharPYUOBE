import { useEffect, useState } from 'react';
import api from '../../services/api';
import AdminMenu from '../../components/AdminMenu';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [year, setYear] = useState('');
  const [data, setData] = useState(null);
  const loadData = async () => {
    try {
      const res = await api.get('/admin/summary');
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!data) return <h2>Loading...</h2>;

const handleSaveAll = async () => {
  if (!year) {
    alert('⚠️ กรุณาเลือกปีการศึกษา');
    return;
  }
  await api.post('/admin/save-all-results', { year });
  alert('✅ บันทึกผลทั้งหมดแล้ว');
};

  return (   
<div className="flex min-h-screen bg-gray-50">
  <AdminMenu />

    <div style={{ padding: 20 }}>
      <h1>Admin Dashboard</h1>

      <h3>👤 Users</h3>
      <ul>
        {data.users.map((u, i) => (
          <li key={i}>{u.role}: {u.count}</li>
        ))}
      </ul>

      <h3>📘 Courses</h3>
      <ul>
        {data.courses.map((c, i) => (
          <li key={i}>Year {c.year}: {c.count}</li>
        ))}
      </ul>

      <h3>🎯 PLO Summary</h3>
      <p>PLOs: {data.plos}</p>
      <p>SubPLOs: {data.subplos}</p>
      <p>Indicators: {data.indicators}</p>

      <h3>📘 YLO Summary</h3>
      <p>YLOs: {data.ylos}</p>
      <p>YLO Indicators: {data.yloIndicators}</p>

      <h3>🔗 Mapping</h3>
      <p>{data.mapping}</p>

<div> เลือกปีที่จะบันทึก
<select
  value={year}
  onChange={(e) => setYear(e.target.value)}
>
  <option value="">-- เลือกปีการศึกษา --</option>
  <option value="2568">2568</option>
  <option value="2569">2569</option>
  <option value="2570">2570</option>
  <option value="2571">2571</option>
  <option value="2572">2572</option>
  <option value="2573">2573</option>
</select>
</div>
<div>
      <button onClick={handleSaveAll}>
  🚀 Save All Results
      </button>  
</div>
</div>
</div>    
  );
}