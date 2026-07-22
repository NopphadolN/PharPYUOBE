import { useEffect, useState } from 'react';
import api from '../../services/api';
import AdminMenu from '../../components/AdminMenu';

export default function AdminDashboard() {

  const [year, setYear] = useState('');
  const [data, setData] = useState(null);

  const loadData = async () => {
    try {
      const res = await api.get('/admin/summary');
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveAll = async () => {

    if (!year) {
      alert('⚠️ กรุณาเลือกปีการศึกษา');
      return;
    }

    await api.post(
      '/admin/save-all-results',
      { year }
    );

    alert('✅ บันทึกผลทั้งหมดแล้ว');
  };

  if (!data) {

    return (

      <div className="flex min-h-screen bg-gray-50">

        <AdminMenu />

        <div className="p-8">
          Loading...
        </div>

      </div>

    );

  }

  return (

    <div className="flex min-h-screen bg-gray-50">

      <AdminMenu />

      <div className="flex-1 p-6">

        {/* HEADER */}

        <div className="mb-6">

          <h1 className="text-3xl font-bold">
            Admin Dashboard
          </h1>

          <p className="text-gray-500 mt-1">
            ภาพรวมระบบบริหารหลักสูตร
          </p>

        </div>

        {/* KPI */}

        <div className="grid md:grid-cols-4 gap-4 mb-6">

          <DashboardCard
            title="Users"
            value={
              data.users.reduce(
                (sum, u) => sum + Number(u.count),
                0
              )
            }
          />

          <DashboardCard
            title="Courses"
            value={
              data.courses.reduce(
                (sum, c) => sum + Number(c.count),
                0
              )
            }
          />

          <DashboardCard
            title="PLOs"
            value={data.plos}
          />

          <DashboardCard
            title="YLOs"
            value={data.ylos}
          />

        </div>

        {/* STRUCTURE */}

        <div className="grid md:grid-cols-2 gap-4 mb-6">

          <div className="bg-white border rounded-lg p-5">

            <h2 className="font-semibold text-lg mb-4">
              🎯 PLO Structure
            </h2>

            <div className="space-y-2">

              <InfoRow
                label="PLOs"
                value={data.plos}
              />

              <InfoRow
                label="SubPLOs"
                value={data.subplos}
              />

              <InfoRow
                label="Indicators"
                value={data.indicators}
              />

              <InfoRow
                label="Mappings"
                value={data.mapping}
              />

            </div>

          </div>

          <div className="bg-white border rounded-lg p-5">

            <h2 className="font-semibold text-lg mb-4">
              📘 YLO Structure
            </h2>

            <div className="space-y-2">

              <InfoRow
                label="YLOs"
                value={data.ylos}
              />

              <InfoRow
                label="YLO Indicators"
                value={data.yloIndicators}
              />

            </div>

          </div>

        </div>

        {/* LISTS */}

        <div className="grid md:grid-cols-2 gap-4 mb-6">

          {/* USERS */}

          <div className="bg-white border rounded-lg p-5">

            <h2 className="font-semibold text-lg mb-4">
              👤 Users by Role
            </h2>

            <table className="w-full">

              <thead>

                <tr className="border-b">

                  <th className="text-left py-2">
                    Role
                  </th>

                  <th className="text-right py-2">
                    Count
                  </th>

                </tr>

              </thead>

              <tbody>

                {data.users.map((u, i) => (

                  <tr
                    key={i}
                    className="border-b"
                  >

                    <td className="py-2">
                      {u.role}
                    </td>

                    <td className="text-right">
                      {u.count}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          {/* COURSES */}

          <div className="bg-white border rounded-lg p-5">

            <h2 className="font-semibold text-lg mb-4">
              📚 Courses by Year
            </h2>

            <table className="w-full">

              <thead>

                <tr className="border-b">

                  <th className="text-left py-2">
                    Year
                  </th>

                  <th className="text-right py-2">
                    Count
                  </th>

                </tr>

              </thead>

              <tbody>

                {data.courses.map((c, i) => (

                  <tr
                    key={i}
                    className="border-b"
                  >

                    <td className="py-2">
                      {c.year}
                    </td>

                    <td className="text-right">
                      {c.count}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

        {/* SAVE ALL */}

        <div className="bg-white border rounded-lg p-5">

          <h2 className="font-semibold text-lg mb-4">
            🚀 Save All Results
          </h2>

          <div className="flex flex-wrap gap-3 items-center">

            <select
              value={year}
              onChange={(e) =>
                setYear(e.target.value)
              }
              className="
                border
                rounded
                px-3
                py-2
              "
            >

              <option value="">
                -- เลือกปีการศึกษา --
              </option>

              <option value="2568">2568</option>
              <option value="2569">2569</option>
              <option value="2570">2570</option>
              <option value="2571">2571</option>
              <option value="2572">2572</option>
              <option value="2573">2573</option>

            </select>

            <button
              onClick={handleSaveAll}
              className="
                bg-blue-600
                hover:bg-blue-700
                text-white
                px-5
                py-2
                rounded
              "
            >
              Save All Results
            </button>

          </div>

        </div>

      </div>

    </div>

  );
}

function DashboardCard({
  title,
  value
}) {

  return (

    <div className="bg-white border rounded-lg p-5">

      <div className="text-gray-500">
        {title}
      </div>

      <div className="text-3xl font-bold mt-2">
        {value}
      </div>

    </div>

  );

}

function InfoRow({
  label,
  value
}) {

  return (

    <div className="flex justify-between border-b pb-2">

      <span>{label}</span>

      <span className="font-semibold">
        {value}
      </span>

    </div>

  );

}