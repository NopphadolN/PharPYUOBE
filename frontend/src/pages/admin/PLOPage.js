import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminMenu from '../../components/AdminMenu';

export default function PLOPage() {
  const [plos, setPlos] = useState([]);

  const [form, setForm] = useState({
    code: '',
    description: '',
    sub_plos: [],
    indicators: []
  });

  const [editId, setEditId] = useState(null);

  const loadData = async () => {
    try {
      const res = await api.get('/plos');
      setPlos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ✅ Add SubPLO
  const addSub = () => {
    setForm({
      ...form,
      sub_plos: [...form.sub_plos, { code: '', description: '' }]
    });
  };

  // ✅ Add Indicator (ของ PLO)
  const addIndicator = () => {
    setForm({
      ...form,
      indicators: [...form.indicators, { code: '', description: '' }]
    });
  };

  // ✅ Save
  const handleSave = async () => {
    try {
      await api.post('/plos', { ...form, id: editId });

      alert('Saved ✅');

      setForm({
        code: '',
        description: '',
        sub_plos: [],
        indicators: []
      });

      setEditId(null);
      loadData();

    } catch (err) {
      console.error(err);
      alert('Save failed');
    }
  };

  // ✅ Edit
  const handleEdit = (p) => {
    setEditId(p.id);
    setForm({
      code: p.code,
      description: p.description,
      sub_plos: p.sub_plos || [],
      indicators: p.indicators || []
    });
  };

  // ✅ Delete
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this PLO?')) return;

    await api.delete(`/plos/${id}`);
    loadData();
  };

  return (
  <div className="flex min-h-screen bg-gray-50">
    <AdminMenu />
    <div style={{ padding: 20 }}>

      <h2>PLO Management</h2>

      {/* ✅ PLO INFO */}
      <input
        placeholder="PLO Code (เช่น PLO1)"
        value={form.code}
        onChange={(e) => setForm({ ...form, code: e.target.value })}
      />
      <br />
      <input
        placeholder="PLO Description"
        style={{ width: '80%' }}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      <br /><br />

      {/* ✅ SUB PLO */}
      <h3>Sub PLOs</h3>

      <button onClick={addSub}>+ Add SubPLO</button>

      {form.sub_plos.map((sub, i) => (
        <div key={i} style={{ margin: 5 }}>
         
  {/* ✅ code */}
  <input
    placeholder="SubPLO Code (เช่น SubPLO1.1)"
    value={sub.code}
    onChange={(e) => {
      const updated = [...form.sub_plos];
      updated[i].code = e.target.value;
      setForm({ ...form, sub_plos: updated });
    }}
    style={{ width: '120px', marginRight: 10 }}
  />
  {/* ✅ description */}
  <input
    placeholder="SubPLO description"
    value={sub.description}
    onChange={(e) => {
      const updated = [...form.sub_plos];
      updated[i].description = e.target.value;
      setForm({ ...form, sub_plos: updated });
    }}
    style={{ width: '80%' }}
  />
</div>
      ))}

      {/* ✅ INDICATORS (ของ PLO) */}
      <h3>PLO Indicators</h3>

      <button onClick={addIndicator}>+ Add Indicator</button>

      {form.indicators.map((ind, i) => (
        <div key={i} style={{ marginBottom: 5 }}>
          <input
            placeholder="Indicator Code (เช่น 1a)"
            value={ind.code}
            onChange={(e) => {
              const updated = [...form.indicators];
              updated[i].code = e.target.value;
              setForm({ ...form, indicators: updated });
            }}
            style={{ width: '80px', marginRight: '10px' }}
          />

          <input
            placeholder="Indicator Description"
            value={ind.description}
            onChange={(e) => {
              const updated = [...form.indicators];
              updated[i].description = e.target.value;
              setForm({ ...form, indicators: updated });
            }}
            style={{ width: '80%' }}
          />
        </div>
      ))}

      <br />

      <button onClick={handleSave}>
        {editId ? 'Update' : 'Save'}
      </button>

      <hr />

      {/* ✅ LIST */}
      <h3>Existing PLOs</h3>

      {plos.map((p) => (
        <div
          key={p.id}
          style={{
            border: '1px solid black',
            padding: 10,
            marginBottom: 10
          }}
        >
          <strong>{p.code}</strong> - {p.description}

          <div>
            SubPLOs:
            <ul>
              {p.sub_plos.map((s) => (
                <li key={s.id}>
                  <strong>{s.code}</strong> - {s.description}
                </li>
              ))}
            </ul>
          </div>

          <div>
            Indicators:
            <ul>
              {p.indicators.map((i) => (
                <li key={i.id}>
                  <strong>{i.code}</strong> - {i.description}
                </li>
              ))}
            </ul>

          </div>

          <button onClick={() => handleEdit(p)}>Edit</button>
          <button onClick={() => handleDelete(p.id)}>Delete</button>
        </div>
      ))}

    </div>
  </div>
  );
}