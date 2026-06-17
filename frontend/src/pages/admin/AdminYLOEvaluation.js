import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { Fragment } from 'react';
import AdminMenu from '../../components/AdminMenu';

export default function AdminYLOPage() {

  const [year, setYear] = useState('');
  const [students, setStudents] = useState([]);
  const [ylos, setYlos] = useState([]);
  const [data, setData] = useState({});

  /* LOAD */
  useEffect(() => {
    (async () => {
      const stu = await api.get('/student/all');
      const ylo = await api.get('/admin/ylos');

      setStudents(stu.data);

      setYlos(
        ylo.data.map(y => ({
          ...y,
          indicators: y.indicators || []
        }))
      );
    })();
  }, []);

  /* LOAD INPUT */
  useEffect(() => {
    if (!year) return;

    (async () => {
      const res = await api.get('/admin/ylo-indicator-results', {
        params: { year }
      });

      const map = {};

      res.data.forEach(r => {
        if (!map[r.student_id]) map[r.student_id] = {};
        map[r.student_id][r.indicator_id] = r.value;
      });

      setData(map);
    })();

  }, [year]);

  /* FILTER */
  const filteredStudents = year
    ? students.filter(st =>
        String(st.user_code).startsWith(year.slice(-2))
      )
    : [];

  /* UPDATE */
  const updateValue = (studentId, indicatorId, value) => {
    setData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [indicatorId]: value
      }
    }));
  };

  /* CALCULATE */
  const calculateYLOPercent = (studentId, ylo) => {

    const values = ylo.indicators.map(ind => {

      const val = data?.[studentId]?.[ind.id];

      if (ind.type === 'boolean') return val ? 100 : 0;

      if (ind.type === 'percent') return Number(val || 0);

      if (ind.type === 'number') {
        const target = parseFloat(ind.target || 0);
        return Number(val) >= target ? 100 : 0;
      }

      if (ind.type === 'grade') {
        const map = { A:4, B:3, C:2, D:1, F:0 };
        return (map[val] || 0) >= (map[ind.target] || 0) ? 100 : 0;
      }

      return 0;
    });

    return values.length
      ? values.reduce((a,b)=>a+b,0)/values.length
      : 0;
  };

  /* SAVE */
  const handleSave = async () => {

    const resultData = {};

    filteredStudents.forEach(st => {
      resultData[st.id] = {};

      ylos.forEach(y => {
        resultData[st.id][y.id] =
          calculateYLOPercent(st.id, y);
      });
    });

    await api.post('/admin/ylo-results', {
      year,
      data: resultData,
      rawData: data   // ✅ สำคัญที่สุด
    });

    alert('✅ saved');
  };

  /* PASTE */
  const handlePaste = (e, rowIdx, colIdx, ylo) => {
    e.preventDefault();

    const rows = e.clipboardData.getData('text')
      .split('\n').map(r => r.split('\t'));

    const newData = { ...data };

    rows.forEach((row, r) => {
      const student = filteredStudents[rowIdx + r];
      if (!student) return;

      row.forEach((cell, c) => {
        const ind = ylo.indicators[colIdx + c];
        if (!ind) return;

        if (!newData[student.id]) newData[student.id] = {};
        newData[student.id][ind.id] = cell;
      });
    });

    setData(newData);
  };

  /* UI */
  return (
    <div className="flex min-h-screen bg-gray-50">

      <AdminMenu/>

      <div className="flex-1 p-6 space-y-6">

        <Card>
          <Select value={year} onChange={e=>setYear(e.target.value)}>
            <option value="">เลือกปี</option>
            {[2568,2569,2570,2571,2572,2573].map(y=>(
              <option key={y}>{y}</option>
            ))}
          </Select>
        </Card>

        <Card>

          {!year && <div>กรุณาเลือกปี</div>}

          {year && (
            <div className="overflow-x-auto">

              <table className="border w-full text-sm">

                <thead>
                  <tr>
                    <th rowSpan="2">รหัส</th>
                    <th rowSpan="2">ชื่อ</th>

                    {ylos.map(y=>(
                      <th key={y.id} colSpan={y.indicators.length+1}>
                        {y.code}
                      </th>
                    ))}
                  </tr>

                  <tr>
                    {ylos.map(y=>(
                      <Fragment key={y.id}>
                        {y.indicators.map((ind,i)=>(
                          <th key={ind.id} title={ind.description}>
                            {i+1}
                          </th>
                        ))}
                        <th>avg</th>
                      </Fragment>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((st,r)=>(
                    <tr key={st.id}>

                      <td>{st.user_code}</td>
                      <td>{st.name_th}</td>

                      {ylos.map(y=>(
                        <Fragment key={y.id}>

                          {y.indicators.map((ind,c)=>{

                            const val = data?.[st.id]?.[ind.id] || '';

                            if (ind.type==='boolean') {
                              return (
                                <td key={ind.id}>
                                  <input
                                    type="checkbox"
                                    checked={!!val}
                                    onChange={e=>
                                      updateValue(st.id, ind.id, e.target.checked)
                                    }
                                  />
                                </td>
                              );
                            }

                            return (
                              <td key={ind.id}>
                                <input
                                  value={val}
                                  onChange={e=>
                                    updateValue(st.id, ind.id, e.target.value)
                                  }
                                  onPaste={e=>handlePaste(e,r,c,y)}
                                  className="w-12"
                                />
                              </td>
                            );
                          })}

                          <td>
                            {calculateYLOPercent(st.id,y).toFixed(2)}%
                          </td>

                        </Fragment>
                      ))}

                    </tr>
                  ))}
                </tbody>

              </table>

            </div>
          )}

        </Card>

        {year && <Button onClick={handleSave}>💾 Save</Button>}

      </div>
    </div>
  );
}
