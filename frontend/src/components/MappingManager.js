import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

export default function MappingManager({
  title,
  itemApi,
  mappingApi,
  itemKey,
  codeField,
  childField,
  addPayloadKey,
  removePayloadKey
}) {

  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [mapping, setMapping] = useState([]);

  const [selectedItem, setSelectedItem] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const loadData = useCallback(async () => {

  const itemRes = await api.get(itemApi);
  const courseRes = await api.get('/mapping/courses');
  const mapRes = await api.get(mappingApi);

  setItems(itemRes.data);
  setCourses(courseRes.data);
  setMapping(mapRes.data);

}, [itemApi, mappingApi]);

useEffect(() => {
  loadData();
}, [loadData]);

const handleAdd = async (course_id) => {
  await api.post(mappingApi, {
    [addPayloadKey]: selectedItem,
    course_id
  });
  setShowPopup(false);
  loadData();

};

const handleRemove = async (course_id) => {
  await api.delete(mappingApi, {
    data: {
      [addPayloadKey]: selectedItem,
      course_id
    }
  });
  loadData();
};

const codeList = [
  ...new Set(
    mapping.map(m => m[codeField])
  )
].sort();

  const courseMap = {};

  mapping.forEach(m => {

    if (!courseMap[m.course_id]) {

      courseMap[m.course_id] = {
        course: m,
        items: {}
      };

    }

    courseMap[m.course_id]
  .items[m[codeField]] = true;
  });

  const courseList =
    Object.values(courseMap)
      .sort((a, b) =>
        a.course.code_en.localeCompare(
          b.course.code_en
        )
      );

  const countMapping = (code) => {
  return mapping.filter(
    m => m[codeField] === code
  ).length;
};

  return (
    <div className="p-6">

      {/* HEADER */}

      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {title}
        </h1>
      </div>

      {/* SUMMARY */}

      <div className="grid md:grid-cols-3 gap-4 mb-6">

        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-500">
            Courses
          </p>
          <p className="text-2xl font-bold">
            {courses.length}
          </p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-500">
            Items
          </p>
          <p className="text-2xl font-bold">
            {codeList.length}
          </p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-500">
            Total Mapping
          </p>
          <p className="text-2xl font-bold">
            {mapping.length}
          </p>
        </div>

      </div>

      {/* CARD LIST */}

      {items.map(parent => (

        <div
          key={parent.id}
          className="
            bg-white
            border
            rounded-lg
            p-4
            mb-4
          "
        >

          <div className="border-b pb-2 mb-3">
            <h2 className="font-bold text-blue-700">
              {parent.code}
            </h2>

            {parent.description && (
              <p className="text-sm text-gray-500">
                {parent.description}
              </p>
            )}
          </div>

          {parent[childField]?.map(item => (

            <div
              key={item.id}
              className="
              py-3
              border-b
              "
            >

              <div
                className="
                flex
                justify-between
                gap-4
                "
              >

                <div>

                  <div className="font-semibold text-blue-600">
                    {item.code}
                  </div>

                  <div className="text-sm text-gray-600">
                    {item.description}
                  </div>

                </div>

                <button
                  className="
                    bg-blue-600
                    text-white
                    px-3
                    py-1
                    rounded
                  "
                  onClick={() => {
                    setSelectedItem(item.id);
                    setShowPopup(true);
                  }}
                >
                  Add Course
                </button>

              </div>

              {/* mapped courses */}

              <div className="flex flex-wrap gap-2 mt-3">

                {mapping
                  .filter(
                    m =>
                      m[itemKey] === item.id
                  )
                  .map(m => (

                    <div
                      key={m.id}
                      className="
                        flex
                        items-center
                        bg-green-50
                        border
                        border-green-200
                        rounded-full
                        px-3
                        py-1
                      "
                    >

                      <span>
                        {m.code_en}
                      </span>

                      <button
                        className="
                          ml-2
                          text-red-500
                          font-bold
                        "
                        onClick={() => {

                          setSelectedItem(
                            item.id
                          );

                          handleRemove(
                            m.course_id
                          );

                        }}
                      >
                        ×
                      </button>

                    </div>

                  ))}

              </div>

            </div>

          ))}

        </div>

      ))}

      {/* MATRIX */}

      <div className="bg-white rounded-lg border p-4 mt-6">

        <h2 className="font-bold mb-4">
          Mapping Matrix
        </h2>

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead>

              <tr className="bg-slate-700 text-white">

                <th className="border px-2 py-2">
                  Course
                </th>

                {codeList.map(code => (

                  <th
                    key={code}
                    className="
                    border
                    px-2
                    py-2
                    "
                  >
                    {code}
                  </th>

                ))}

              </tr>

            </thead>

            <tbody>

              {courseList.map(row => (

                <tr key={row.course_id}>

                  <td className="border px-2 py-2">

                    {row.course.code_th}

                    <br/>

                    <span className="text-gray-500">
                      {row.course.name_th}
                    </span>

                  </td>

                  {codeList.map(code => (

                    <td
                      key={code}
                      className="
                      border
                      text-center
                      "
                    >

                      {row.items[code]
                        ? (
                          <span className="text-green-600 font-bold">
                            ✓
                          </span>
                        )
                        : ''}

                    </td>

                  ))}

                </tr>

              ))}

              <tr className="bg-yellow-50 font-bold">

                <td className="border px-2 py-2">
                  รวม
                </td>

                {codeList.map(code => (

                  <td
                    key={code}
                    className="
                    border
                    text-center
                    "
                  >
                    {countMapping(code)}
                  </td>

                ))}

              </tr>

            </tbody>

          </table>

        </div>

      </div>

      {/* POPUP */}

      {showPopup && (

        <div
          onClick={() =>
            setShowPopup(false)
          }
          className="
            fixed
            inset-0
            bg-black/40
            flex
            justify-center
            items-center
            z-50
          "
        >

          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            className="
              bg-white
              rounded-lg
              w-[500px]
              max-h-[500px]
              overflow-auto
              p-5
            "
          >

            <h3 className="font-bold mb-3">
              Select Course
            </h3>

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search course..."
              className="
                w-full
                border
                rounded
                px-3
                py-2
                mb-3
              "
            />

            {courses
              .filter(c =>
                c.code_en
                  .toLowerCase()
                  .includes(
                    search.toLowerCase()
                  )
              )
              .map(c => (

                <div
                  key={c.id}
                  className="
                    flex
                    justify-between
                    py-2
                    border-b
                  "
                >

                  <span>
                    {c.code_en}
                  </span>

                  <button
                    onClick={() =>
                      handleAdd(c.id)
                    }
                    className="
                      bg-blue-600
                      text-white
                      px-3
                      py-1
                      rounded
                    "
                  >
                    Add
                  </button>

                </div>

              ))}

          </div>

        </div>

      )}

    </div>
  );

}