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
  removePayloadKey,

  popupApi,
  popupLabelField,
  popupIdField,

  targetPayloadKey,

  mappedLabelField,

  showMatrix = true,

  matrixRowField = 'course_id',
  matrixRowLabel = 'code_en'
}) {

  const [search, setSearch] = useState('');

  const [items, setItems] = useState([]);
  const [popupItems, setPopupItems] = useState([]);
  const [mapping, setMapping] = useState([]);

  const [selectedItem, setSelectedItem] =
    useState(null);

  const [showPopup, setShowPopup] =
    useState(false);

  const loadData = useCallback(async () => {

    const itemRes =
      await api.get(itemApi);

    const popupRes =
      await api.get(popupApi);

    const mapRes =
      await api.get(mappingApi);

    setItems(itemRes.data);
    setPopupItems(popupRes.data);
    setMapping(mapRes.data);

  }, [
    itemApi,
    mappingApi,
    popupApi
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = async (targetId) => {

    await api.post(mappingApi, {

      [addPayloadKey]: selectedItem,

      [targetPayloadKey]: targetId

    });

    setShowPopup(false);

    loadData();

  };

  const handleRemove = async (targetId) => {

    await api.delete(mappingApi, {

      data: {

        [addPayloadKey]: selectedItem,

        [targetPayloadKey]: targetId

      }

    });

    loadData();

  };

  const codeList = [

    ...new Set(

      mapping.map(
        m => m[codeField]
      )

    )

  ].sort();

  const rowMap = {};

  if (showMatrix) {

    mapping.forEach(m => {

      const rowId =
        m[matrixRowField];

      if (!rowMap[rowId]) {

        rowMap[rowId] = {

          row: m,
          items: {}

        };

      }

      rowMap[rowId]
        .items[m[codeField]] = true;

    });

  }

  const rowList =
    Object.values(rowMap);

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

        <div
          className="
          bg-white
          border
          rounded-lg
          p-4
        "
        >

          <p className="text-gray-500">
            Available Items
          </p>

          <p className="text-2xl font-bold">
            {popupItems.length}
          </p>

        </div>

        <div
          className="
          bg-white
          border
          rounded-lg
          p-4
        "
        >

          <p className="text-gray-500">
            Mapping Columns
          </p>

          <p className="text-2xl font-bold">
            {codeList.length}
          </p>

        </div>

        <div
          className="
          bg-white
          border
          rounded-lg
          p-4
        "
        >

          <p className="text-gray-500">
            Total Mapping
          </p>

          <p className="text-2xl font-bold">
            {mapping.length}
          </p>

        </div>

      </div>

      {/* CARD */}

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

          <div
            className="
            border-b
            pb-2
            mb-3
            "
          >

            <h2
              className="
              font-bold
              text-blue-700
              "
            >
              {parent.code}
            </h2>

            {parent.description && (

              <p
                className="
                text-sm
                text-gray-500
                "
              >
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

                  <div
                    className="
                    font-semibold
                    text-blue-600
                    "
                  >
                    {item.code}
                  </div>

                  <div
                    className="
                    text-sm
                    text-gray-600
                    "
                  >
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

                    setSelectedItem(
                      item.id
                    );

                    setShowPopup(true);

                  }}

                >
                  Add
                </button>

              </div>

              {/* mapped */}

              <div
                className="
                flex
                flex-wrap
                gap-2
                mt-3
                "
              >

                {mapping
                  .filter(
                    m =>
                    m[itemKey] ===
                    item.id
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
                        {
                          m[
                            mappedLabelField
                          ]
                        }
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

                            m[
                              targetPayloadKey
                            ]

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

      {showMatrix && (

        <div
          className="
          bg-white
          rounded-lg
          border
          p-4
          mt-6
          "
        >

          <h2
            className="
            font-bold
            mb-4
            "
          >
            Mapping Matrix
          </h2>

          <div
            className="
            overflow-x-auto
            "
          >

            <table
              className="
              min-w-full
              text-sm
              "
            >

              <thead>

                <tr
                  className="
                  bg-slate-700
                  text-white
                  "
                >

                  <th
                    className="
                    border
                    px-2
                    py-2
                    "
                  >
                    Item
                  </th>

                  {codeList.map(code => (

                    <th

                      key={code}

                      className="
                      border
                      px-2
                      py-2
                      whitespace-nowrap
                      "

                    >
                      {
                        String(code)
                          .replace(
                            'SubPLO',
                            ''
                          )
                      }
                    </th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {rowList.map(row => (

                  <tr
                    key={
                      row.row[
                        matrixRowField
                      ]
                    }
                  >

                    <td
                      className="
                      border
                      px-2
                      py-2
                      "
                    >
                      {
                        row.row[
                          matrixRowLabel
                        ]
                      }
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
                          ? '✓'
                          : ''}

                      </td>

                    ))}

                  </tr>

                ))}

                <tr
                  className="
                  bg-yellow-50
                  font-bold
                  "
                >

                  <td
                    className="
                    border
                    px-2
                    py-2
                    "
                  >
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

      )}

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

            <h3
              className="
              font-bold
              mb-3
              "
            >
              Select Item
            </h3>

            <input

              value={search}

              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }

              placeholder="Search..."

              className="
              w-full
              border
              rounded
              px-3
              py-2
              mb-3
              "

            />

            {popupItems

              .filter(item =>

                String(
                  item[
                    popupLabelField
                  ] || ''
                )
                  .toLowerCase()
                  .includes(
                    search
                      .toLowerCase()
                  )

              )

              .map(item => (

                <div

                  key={
                    item[
                      popupIdField
                    ]
                  }

                  className="
                  flex
                  justify-between
                  py-2
                  border-b
                  "

                >

                  <span>

                    {
                      item[
                        popupLabelField
                      ]
                    }

                  </span>

                  <button

                    onClick={() =>
                      handleAdd(
                        item[
                          popupIdField
                        ]
                      )
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