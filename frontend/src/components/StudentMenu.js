import { useNavigate } from 'react-router-dom';

export default function StudentMenu() {

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="w-60 bg-white shadow-md h-screen p-4 flex flex-col">

      {/* ✅ TITLE */}
      <div className="text-lg font-bold mb-6 text-blue-600">
        🎓 Student Panel
      </div>

      {/* ✅ MENU */}
      <div className="flex flex-col gap-2">

        <button
          onClick={() => navigate('/student/dashboard')}
          className="text-left px-3 py-2 rounded-lg hover:bg-blue-50"
        >
          📊 Dashboard
        </button>

        <button
          onClick={() => navigate('/student/report')}
          className="text-left px-3 py-2 rounded-lg hover:bg-blue-50"
        >
          📄 รายงานผล
        </button>

      </div>

      {/* ✅ Spacer */}
      <div className="flex-1" />

      {/* ✅ Logout */}
      <button
        onClick={handleLogout}
        className="px-3 py-2 mt-4 text-left text-red-500 hover:bg-red-50 rounded-lg"
      >
        🚪 Logout
      </button>

    </div>
  );
}