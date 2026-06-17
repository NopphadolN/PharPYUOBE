import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminMenu from '../../components/AdminMenu';

export default function MappingPage() {
  const [search, setSearch] = useState('');
  const [plos, setPlos] = useState([]);
  const [courses, setCourses] = useState([]);
  const [mapping, setMapping] = useState([]);

  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const loadData = async () => {
    const ploRes = await api.get('/plos');
    const courseRes = await api.get('/mapping/courses');
    const mapRes = await api.get('/mapping');

    setPlos(ploRes.data);
    setCourses(courseRes.data);
    setMapping(mapRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ✅ add mapping
  const handleAdd = async (course_id) => {
    await api.post('/mapping', {
      plo_indicator_id: selectedIndicator,
      course_id
    });

    setShowPopup(false);
    loadData();
  };

  // ✅ remove mapping
  const handleRemove = async (course_id) => {
    await api.delete('/mapping', {
      data: {
        plo_indicator_id: selectedIndicator,
        course_id
      }
    });

    loadData();
  };

  // ✅ สร้าง unique indicator list
  const indicatorList = [
    ...new Set(mapping.map(m => m.indicator_code))
  ].sort();

  // ✅ group ตาม course
  const courseMap = {};
  mapping.forEach(m => {
    if (!courseMap[m.course_id]) {
      courseMap[m.course_id] = {
        course: m,
        indicators: {}
      };
    }

    courseMap[m.course_id].indicators[m.indicator_code] = true;
  });

  const courseList = Object.values(courseMap)
  .sort((a, b) =>
    a.course.code_en.localeCompare(b.course.code_en)
  );

  const countMapping = (indicatorCode) => {
  return mapping.filter(m =>
    m.indicator_code === indicatorCode
  ).length;
};

  return (
  <div className="flex min-h-screen bg-gray-50">
    <AdminMenu />
    <div style={{ padding: 20 }}>

      <h2>PLO Mapping</h2>

      {/* ✅ PLO + Indicator */}
      {plos.map((p) => (
        <div key={p.id} style={{ border: '1px solid #ccc', margin: 10, padding: 10 }}>
          <strong>{p.code}</strong>
          {p.indicators.map(ind => (
            <div key={ind.id} style={{ marginLeft: 20 }}>              
            <span><b>{ind.code}</b> : {ind.description}</span>
              <button style={{ marginLeft: 5 }} onClick={() => {
                setSelectedIndicator(ind.id);
                setShowPopup(true);
              }}>
                ➕ Add Course
              </button>

              {/* ✅ show mapped courses */}
<div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  marginTop: 5
}}>

  {mapping
    .filter(m => m.plo_indicator_id === ind.id)
    .map(m => (

      <div
        key={m.id}
        style={{
          padding: '3px 8px',
          border: '1px solid #ccc',
          borderRadius: 15,
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center'
        }}
      >

        {/* ✅ course code */}
        <span>{m.code_en}</span>

        {/* ✅ ปุ่มลบ */}
        <button
          onClick={() => {
            setSelectedIndicator(ind.id);
            handleRemove(m.course_id);
          }}
          style={{
            marginLeft: 5,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'red'
          }}
        >
          ❌
        </button>
      </div>
  ))}
</div>

            </div>
          ))}

        </div>
      ))}

      {/* ✅ POPUP */}
{showPopup && (
  <div
    onClick={() => setShowPopup(false)}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999
    }}
  >

    {/* ✅ POPUP CONTENT */}
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: '420px',
        maxHeight: '450px',
        overflowY: 'auto',
        background: '#ffffff',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0px 4px 10px rgba(0,0,0,0.2)'
      }}
    >

      <h3>📘 Select Course</h3>

      {/* ✅ SEARCH */}
      <input
        type="text"
        placeholder="Search course code..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '8px',
          marginBottom: '10px',
          border: '1px solid #ccc',
          borderRadius: '5px'
        }}
      />

      {/* ✅ COURSE LIST */}
      <div>
        {courses
          .filter(c =>
            c.code_en.toLowerCase().includes(search.toLowerCase())
          )
          .map(c => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid #eee'
              }}
            >
              <span>{c.code_en}</span>

              <button
                onClick={() => handleAdd(c.id)}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Add
              </button>
            </div>
          ))}

        {/* ✅ ถ้าไม่เจอ */}
        {courses.filter(c =>
          c.code_en.toLowerCase().includes(search.toLowerCase())
        ).length === 0 && (
          <p style={{ textAlign: 'center', color: 'gray' }}>
            No courses found
          </p>
        )}
      </div>

      <br />

      {/* ✅ CLOSE BUTTON */}
      <div style={{ textAlign: 'right' }}>
        <button
          onClick={() => setShowPopup(false)}
          style={{
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>

    </div>
  </div>
)}

      {/* ✅ TABLE */}
      <h3>📊 Mapping Matrix</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Course</th>
            {indicatorList.map(ind => (
              <th key={ind}>{ind}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {courseList.map((row, i) => (
            <tr key={i}>

              {/* ✅ ชื่อวิชา */}
              <td>
                {row.course.code_th} - {row.course.name_th}
              </td>
              {/* ✅ indicator columns */}
              {indicatorList.map(ind => (
                <td key={ind} style={{ textAlign: 'center' }}>
                  {row.indicators[ind] ? '✅' : ''}
                </td>
              ))}
            </tr>
          ))}
          <tr style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
            <td>รวม</td>
            {indicatorList.map(ind => (
            <td key={ind} style={{ textAlign: 'center' }}>
            {countMapping(ind)}
            </td>
          ))}
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  );
}