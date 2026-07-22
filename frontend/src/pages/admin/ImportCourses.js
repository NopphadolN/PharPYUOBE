import { useState } from 'react';
import api from '../../services/api';
import AdminMenu from '../../components/AdminMenu';

export default function ImportCourses() {

  const [file, setFile] = useState(null);

  const handleUpload = async () => {

    if (!file) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {

      await api.post(
        '/import/courses',
        formData
      );

      alert('✅ Import courses success');

    } catch (err) {

      console.error(err);
      alert('❌ Import failed');

    }

  };

  return (

    <div className="flex min-h-screen bg-gray-50">

      <AdminMenu />

      <div className="flex-1 p-6">

        {/* HEADER */}

        <div className="mb-6">

          <h1 className="text-3xl font-bold">
            Import Courses
          </h1>

          <p className="text-gray-500 mt-1">
            นำเข้าข้อมูลรายวิชาจากไฟล์ Excel
          </p>

        </div>

        {/* SUMMARY */}

        <div className="grid md:grid-cols-2 gap-4 mb-6">

          <div className="bg-white border rounded-lg p-5">

            <div className="text-gray-500">
              Selected File
            </div>

            <div className="text-lg font-semibold mt-2 break-all">

              {file
                ? file.name
                : 'ยังไม่ได้เลือกไฟล์'}

            </div>

          </div>

          <div className="bg-white border rounded-lg p-5">

            <div className="text-gray-500">
              Status
            </div>

            <div className="text-lg font-semibold mt-2">

              {file
                ? 'Ready to Upload'
                : 'Waiting for File'}

            </div>

          </div>

        </div>

        {/* IMPORT CARD */}

        <div className="bg-white border rounded-lg p-6 max-w-2xl">

          <h2 className="text-lg font-semibold mb-4">
            📘 Upload Course File
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
                px-5
                py-2
                rounded
              "
            >
              Upload Excel
            </button>

          </div>

          <div className="mt-4 text-sm text-gray-500">

            รองรับไฟล์ Excel (.xlsx)

          </div>

        </div>

      </div>

    </div>

  );

}