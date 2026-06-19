import { useState } from 'react';
import api from '../../services/api';
import AdminMenu from '../../components/AdminMenu';

export default function ImportUsers() {
  const [file, setFile] = useState(null);

  // 🔹 state ใหม่
  const [keyword, setKeyword] = useState('');
  const [users, setUsers] = useState([]);

  // ✅ upload user (เดิม)
  const handleUpload = async () => {
    if (!file) {
      alert('Please select file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/import/users', formData);
      alert('Import users success ✅');
    } catch (err) {
      console.error(err);
      alert('Import failed ❌');
    }
  };

  // ✅ ค้นหา user
  const handleSearch = async () => {
    try {
      const res = await api.get(`/api/admin/users?username=${keyword}`);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      alert('Search failed ❌');
    }
  };

  // ✅ ลบ user
  const handleDelete = async (id) => {
    if (!window.confirm('Confirm delete?')) return;

    try {
      await api.delete(`/api/admin/users/${id}`);
      alert('Delete success ✅');

      // ลบออกจาก state
      setUsers(users.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
      alert('Delete failed ❌');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminMenu />

      <div style={{ padding: 20 }}>
        <h2>Import Users</h2>

        {/* ✅ upload */}
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <br /><br />

        <button onClick={handleUpload}>
          Upload Excel
        </button>

        <hr style={{ margin: '30px 0' }} />

        {/* ✅ search user */}
        <h2>Delete User</h2>

        <input
          type="text"
          placeholder="Search username..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <button onClick={handleSearch} style={{ marginLeft: 10 }}>
          Search
        </button>

        <br /><br />

        {/* ✅ แสดงผล */}
        {users.map((user) => (
          <div key={user.id} style={{ marginBottom: 10 }}>
            <span>{user.username}</span>

            <button
              onClick={() => handleDelete(user.id)}
              style={{ marginLeft: 10, color: 'red' }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}