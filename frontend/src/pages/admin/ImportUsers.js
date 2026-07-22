import { useState } from 'react';
import api from '../../services/api';
import AdminMenu from '../../components/AdminMenu';

export default function ImportUsers() {

  const [file, setFile] = useState(null);

  const [keyword, setKeyword] = useState('');
  const [users, setUsers] = useState([]);

  const handleUpload = async () => {

    if (!file) {
      alert('Please select file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {

      await api.post(
        '/import/users',
        formData
      );

      alert('✅ Import users success');

    } catch (err) {

      console.error(err);
      alert('❌ Import failed');

    }

  };

  const handleSearch = async () => {

    try {

      const res = await api.get(
        `/api/admin/users?username=${keyword}`
      );

      setUsers(res.data);

    } catch (err) {

      console.error(err);
      alert('❌ Search failed');

    }

  };

  const handleDelete = async (id) => {

    if (!window.confirm('Confirm delete?')) {
      return;
    }

    try {

      await api.delete(
        `/api/admin/users/${id}`
      );

      setUsers(
        users.filter(
          u => u.id !== id
        )
      );

      alert('✅ Delete success');

    } catch (err) {

      console.error(err);
      alert('❌ Delete failed');

    }

  };

  return (

    <div className="flex min-h-screen bg-gray-50">

      <AdminMenu />

      <div className="flex-1 p-6">

        {/* HEADER */}

        <div className="mb-6">

          <h1 className="text-3xl font-bold">
            User Management
          </h1>

          <p className="text-gray-500 mt-1">
            นำเข้าผู้ใช้จาก Excel และจัดการบัญชีผู้ใช้
          </p>

        </div>

        {/* IMPORT */}

        <div className="bg-white border rounded-lg p-6 mb-6">

          <h2 className="text-lg font-semibold mb-4">
            📥 Import Users
          </h2>

          <div className="space-y-4">

            <input
              type="file"
              accept=".xlsx"
              onChange={(e) =>
                setFile(
                  e.target.files[0]
                )
              }
              className="
                block
                w-full
                border
                rounded
                p-2
              "
            />

            <button
              onClick={handleUpload}
              className="
                bg-blue-600
                hover:bg-blue-700
                text-white
                px-4
                py-2
                rounded
              "
            >
              Upload Excel
            </button>

          </div>

        </div>

        {/* SEARCH */}

        <div className="bg-white border rounded-lg p-6">

          <h2 className="text-lg font-semibold mb-4">
            🔍 Search & Delete User
          </h2>

          <div className="flex gap-3 mb-4">

            <input
              type="text"
              placeholder="Search username..."
              value={keyword}
              onChange={(e) =>
                setKeyword(
                  e.target.value
                )
              }
              className="
                flex-1
                border
                rounded
                px-3
                py-2
              "
            />

            <button
              onClick={handleSearch}
              className="
                bg-green-600
                hover:bg-green-700
                text-white
                px-4
                py-2
                rounded
              "
            >
              Search
            </button>

          </div>

          {/* RESULT */}

          {users.length > 0 ? (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>

                  <tr className="bg-slate-700 text-white">

                    <th className="text-left px-4 py-2">
                      Username
                    </th>

                    <th className="text-center px-4 py-2 w-40">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {users.map(user => (

                    <tr
                      key={user.id}
                      className="border-b"
                    >

                      <td className="px-4 py-3">
                        {user.username}
                      </td>

                      <td className="text-center">

                        <button
                          onClick={() =>
                            handleDelete(user.id)
                          }
                          className="
                            bg-red-500
                            hover:bg-red-600
                            text-white
                            px-3
                            py-1
                            rounded
                          "
                        >
                          Delete
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          ) : (

            <div className="text-gray-500 text-center py-6">

              ไม่มีข้อมูลผู้ใช้

            </div>

          )}

        </div>

      </div>

    </div>

  );

}