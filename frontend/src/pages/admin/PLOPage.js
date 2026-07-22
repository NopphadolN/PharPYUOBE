import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminMenu from '../../components/AdminMenu';

export default function PLOPage() {

  const [plos, setPlos] = useState([]);
  const [ksecs, setKsecs] = useState([]);

  const [form, setForm] = useState({
    code: '',
    description: '',
    sub_plos: [],
    indicators: []
  });

  const [editId, setEditId] = useState(null);

  const loadData = async () => {

    try {

      const ploRes = await api.get('/plos');
      const ksecRes = await api.get('/ksecs');

      setPlos(ploRes.data);
      setKsecs(ksecRes.data);

    } catch (err) {

      console.error(err);

    }

  };

  useEffect(() => {
    loadData();
  }, []);

  const addSub = () => {

    setForm({
      ...form,
      sub_plos: [
        ...form.sub_plos,
        {
          code: '',
          description: '',
          ksecs: []
        }
      ]
    });

  };

  const addIndicator = () => {

    setForm({
      ...form,
      indicators: [
        ...form.indicators,
        {
          code: '',
          description: ''
        }
      ]
    });

  };

  const handleSave = async () => {

    try {

      await api.post('/plos', {
        ...form,
        id: editId
      });

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
      alert('Save Failed');

    }

  };

  const handleEdit = (p) => {

    setEditId(p.id);

    setForm({
      code: p.code,
      description: p.description,
      sub_plos: p.sub_plos || [],
      indicators: p.indicators || []
    });

  };

  const handleDelete = async (id) => {

    if (!window.confirm('Delete this PLO ?')) {
      return;
    }

    await api.delete(`/plos/${id}`);
    loadData();

  };

  return (

    <div className="flex min-h-screen bg-gray-50">

      <AdminMenu />

      <div className="flex-1 p-6">

        {/* HEADER */}

        <div className="mb-6">

          <h1 className="text-3xl font-bold">
            PLO Management
          </h1>

          <p className="text-gray-500">
            จัดการ PLO, SubPLO, Indicators และ KSEC
          </p>

        </div>

        {/* FORM */}

        <div className="bg-white border rounded-lg p-6 mb-6">

          <h2 className="font-semibold text-lg mb-4">

            {editId
              ? 'Edit PLO'
              : 'Add PLO'}

          </h2>

          {/* PLO */}

          <div className="space-y-3 mb-6">

            <input
              className="
              w-full
              border
              rounded
              px-3
              py-2
              "
              placeholder="PLO Code"
              value={form.code}
              onChange={(e) =>
                setForm({
                  ...form,
                  code: e.target.value
                })
              }
            />

            <textarea
              className="
              w-full
              border
              rounded
              px-3
              py-2
              "
              rows="3"
              placeholder="PLO Description"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value
                })
              }
            />

          </div>

          {/* SUBPLO */}

          <div className="mb-6">

            <div className="flex justify-between mb-3">

              <h3 className="font-semibold">
                SubPLOs
              </h3>

              <button
                onClick={addSub}
                className="
                bg-blue-600
                text-white
                px-3
                py-1
                rounded
                "
              >
                + Add SubPLO
              </button>

            </div>

            {form.sub_plos.map((sub, i) => (

              <div
                key={i}
                className="
                border
                rounded-lg
                bg-gray-50
                p-4
                mb-3
                "
              >

                <div className="grid md:grid-cols-2 gap-3">

                  <input
                    className="
                    border
                    rounded
                    px-3
                    py-2
                    "
                    placeholder="SubPLO Code"
                    value={sub.code}
                    onChange={(e) => {

                      const updated =
                        [...form.sub_plos];

                      updated[i].code =
                        e.target.value;

                      setForm({
                        ...form,
                        sub_plos: updated
                      });

                    }}
                  />

                  <input
                    className="
                    border
                    rounded
                    px-3
                    py-2
                    "
                    placeholder="Description"
                    value={sub.description}
                    onChange={(e) => {

                      const updated =
                        [...form.sub_plos];

                      updated[i].description =
                        e.target.value;

                      setForm({
                        ...form,
                        sub_plos: updated
                      });

                    }}
                  />

                </div>

                {/* KSEC */}

                <div className="mt-4">

                  <label className="font-medium">

                    KSEC

                  </label>

                  <select
                    multiple
                    value={sub.ksecs || []}
                    onChange={(e) => {

                      const values =
                        [...e.target.selectedOptions]
                          .map(
                            o => Number(o.value)
                          );

                      const updated =
                        [...form.sub_plos];

                      updated[i].ksecs =
                        values;

                      setForm({
                        ...form,
                        sub_plos: updated
                      });

                    }}
                    className="
                    w-full
                    h-40
                    border
                    rounded
                    mt-2
                    p-2
                    "
                  >

                    {ksecs.map(k => (

                      <option
                        key={k.id}
                        value={k.id}
                      >
                        {k.code}
                        {' '}
                        ({k.type})
                      </option>

                    ))}

                  </select>

                </div>

              </div>

            ))}

          </div>

          {/* INDICATOR */}

          <div className="mb-6">

            <div className="flex justify-between mb-3">

              <h3 className="font-semibold">
                PLO Indicators
              </h3>

              <button
                onClick={addIndicator}
                className="
                bg-green-600
                text-white
                px-3
                py-1
                rounded
                "
              >
                + Add Indicator
              </button>

            </div>

            {form.indicators.map((ind, i) => (

              <div
                key={i}
                className="
                flex
                gap-3
                mb-2
                "
              >

                <input
                  className="
                  border
                  rounded
                  px-3
                  py-2
                  w-40
                  "
                  value={ind.code}
                  placeholder="Code"
                  onChange={(e) => {

                    const updated =
                      [...form.indicators];

                    updated[i].code =
                      e.target.value;

                    setForm({
                      ...form,
                      indicators: updated
                    });

                  }}
                />

                <input
                  className="
                  border
                  rounded
                  px-3
                  py-2
                  flex-1
                  "
                  value={ind.description}
                  placeholder="Description"
                  onChange={(e) => {

                    const updated =
                      [...form.indicators];

                    updated[i].description =
                      e.target.value;

                    setForm({
                      ...form,
                      indicators: updated
                    });

                  }}
                />

              </div>

            ))}

          </div>

          {/* SAVE */}

          <button
            onClick={handleSave}
            className="
            bg-blue-600
            text-white
            px-6
            py-2
            rounded
            "
          >
            {editId
              ? 'Update'
              : 'Save'}
          </button>

        </div>

        {/* EXISTING */}

        <div>

          <h2 className="font-bold text-xl mb-4">
            Existing PLOs
          </h2>

          {plos.map((p) => (

            <div
              key={p.id}
              className="
              bg-white
              border
              rounded-lg
              p-5
              mb-4
              "
            >

              <div className="flex justify-between">

                <div>

                  <h3 className="font-bold text-lg">
                    {p.code}
                  </h3>

                  <p className="text-gray-600">
                    {p.description}
                  </p>

                </div>

                <div className="space-x-2">

                  <button
                    onClick={() =>
                      handleEdit(p)
                    }
                    className="
                    bg-yellow-500
                    text-white
                    px-3
                    py-1
                    rounded
                    "
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(p.id)
                    }
                    className="
                    bg-red-500
                    text-white
                    px-3
                    py-1
                    rounded
                    "
                  >
                    Delete
                  </button>

                </div>

              </div>

              {/* SUBPLO */}

              <div className="mt-4">

                <h4 className="font-semibold mb-2">
                  SubPLOs
                </h4>

                {p.sub_plos?.map((s) => (

                  <div
                    key={s.id}
                    className="
                    border
                    rounded
                    p-3
                    mb-2
                    "
                  >

                    <div className="font-medium">

                      {s.code}

                    </div>

                    <div className="text-gray-600">

                      {s.description}

                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">

                      {s.ksecs?.map(k => (

                        <span
                          key={k.id}
                          className="
                          bg-purple-100
                          text-purple-700
                          px-2
                          py-1
                          rounded-full
                          text-sm
                          "
                        >
                          {k.code}
                        </span>

                      ))}

                    </div>

                  </div>

                ))}

              </div>

              {/* INDICATORS */}

              <div className="mt-4">

                <h4 className="font-semibold mb-2">
                  Indicators
                </h4>

                <div className="flex flex-wrap gap-2">

                  {p.indicators?.map((i) => (

                    <span
                      key={i.id}
                      className="
                      bg-green-100
                      text-green-700
                      px-2
                      py-1
                      rounded-full
                      text-sm
                      "
                    >
                      {i.code}
                    </span>

                  ))}

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}