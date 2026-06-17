import { useState } from 'react';
import api from '../../services/api';
import AdminMenu from '../../components/AdminMenu';

export default function ImportUsers() {
  const [file, setFile] = useState(null);

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

  return (
  <div className="flex min-h-screen bg-gray-50">
    <AdminMenu />
    <div style={{ padding: 20 }}>

      <h2>Import Users</h2>

      <input
        type="file"
        accept=".xlsx"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />

      <button onClick={handleUpload}>
        Upload Excel
      </button>
    </div>
  </div>
  );
}