import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import AdminMenu from '../../components/AdminMenu';

export default function YLOSetupPage() {

  const [year, setYear] = useState('');
  const [currentYLOs, setCurrentYLOs] = useState([]);

  /* ================= LOAD ================= */
  useEffect(() => {
    if (!year) return;

    (async () => {
      const res = await api.get('/admin/ylos', {
        params: { year }
      });

      // ✅ normalize กัน undefined
      const cleaned = res.data.map(y => ({
        ...y,
        indicators: y.indicators || []
      }));

      setCurrentYLOs(cleaned);
    })();

  }, [year]);

  /* ================= ADD ================= */

  const addYLO = () => {
    if (!year) return;

    setCurrentYLOs([
      ...currentYLOs,
      {
        code: '',
        description: '',
        indicators: []
      }
    ]);
  };

  const addIndicator = (i) => {
    const copy = [...currentYLOs];

    copy[i].indicators.push({
      description: '',
      target: '',
      type: 'text'
    });

    setCurrentYLOs(copy);
  };

  /* ================= UPDATE ================= */

  const updateYLO = (i, field, value) => {
    const copy = [...currentYLOs];
    copy[i][field] = value;
    setCurrentYLOs(copy);
  };

  const updateIndicator = (i, j, field, value) => {
    const copy = [...currentYLOs];
    copy[i].indicators[j][field] = value;
    setCurrentYLOs(copy);
  };

  /* ================= DELETE ================= */

  const removeYLO = (i) => {
    const copy = [...currentYLOs];
    copy.splice(i, 1);
    setCurrentYLOs(copy);
  };

  const removeIndicator = (i, j) => {
    const copy = [...currentYLOs];
    copy[i].indicators.splice(j, 1);
    setCurrentYLOs(copy);
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {

    // ✅ validation กัน code ว่าง
    const valid = currentYLOs.filter(y =>
      y.code && y.code.trim() !== ''
    );

    if (valid.length === 0) {
      alert('กรุณากรอก YLO code');
      return;
    }

    await api.post('/admin/ylos', {
      year,
      ylos: valid
    });

    alert('✅ saved');

  };

  /* ================= UI ================= */

  return (
    <div className="flex min-h-screen bg-gray-50">

      <AdminMenu />

      <div className="flex-1 p-6 space-y-6">

        {/* YEAR */}
        <Card>
          <Select value={year} onChange={e => setYear(e.target.value)}>
            <option value="">เลือกชั้นปี</option>
            {[1,2,3,4,5,6].map(y => (
              <option key={y}>{y}</option>
            ))}
          </Select>
        </Card>

        {/* YLO LIST */}
        {!year && (
          <div className="text-gray-400">กรุณาเลือกชั้นปี</div>
        )}

        {currentYLOs.map((y, i) => (

          <Card key={i} className="space-y-3">

            {/* HEADER */}
            <div className="flex justify-between">
              <h3 className="font-semibold">
                YLO #{i+1}
              </h3>

              <button
                onClick={() => removeYLO(i)}
                className="text-red-500"
              >
                ลบ
              </button>
            </div>

            {/* CODE */}
            <input
              placeholder="YLO Code (เช่น YLO1)"
              value={y.code}
              onChange={e => updateYLO(i, 'code', e.target.value)}
              className="border px-3 py-2 w-full rounded"
            />

            {/* DESCRIPTION */}
            <textarea
              placeholder="คำอธิบาย YLO"
              value={y.description}
              onChange={e => updateYLO(i, 'description', e.target.value)}
              className="border px-3 py-2 w-full rounded"
            />

            {/* INDICATORS */}
            <div className="space-y-2">

              {(y.indicators || []).map((ind, j) => (
                <div key={j} className="grid grid-cols-4 gap-2">

                  <input
                    placeholder="ตัวชี้วัด"
                    value={ind.description}
                    onChange={e =>
                      updateIndicator(i, j, 'description', e.target.value)
                    }
                    className="border px-2 py-1 rounded"
                  />

                  <input
                    placeholder="ค่าเป้าหมาย"
                    value={ind.target}
                    onChange={e =>
                      updateIndicator(i, j, 'target', e.target.value)
                    }
                    className="border px-2 py-1 rounded"
                  />

                  <select
                    value={ind.type}
                    onChange={e =>
                      updateIndicator(i, j, 'type', e.target.value)
                    }
                    className="border px-2 py-1 rounded"
                  >
                    <option value="text">text</option>
                    <option value="number">number</option>
                    <option value="percent">percent</option>
                    <option value="boolean">pass</option>
                  </select>

                  <button
                    onClick={() => removeIndicator(i, j)}
                    className="text-red-500"
                  >
                    ❌
                  </button>

                </div>
              ))}

              <Button onClick={() => addIndicator(i)}>
                ➕ เพิ่มตัวชี้วัด
              </Button>

            </div>

          </Card>

        ))}

        {/* ADD */}
        <Button onClick={addYLO} disabled={!year}>
          ➕ เพิ่ม YLO
        </Button>

        {/* SAVE */}
        {year && (
          <Button onClick={handleSave}>
            💾 Save
          </Button>
        )}

      </div>
    </div>
  );
}