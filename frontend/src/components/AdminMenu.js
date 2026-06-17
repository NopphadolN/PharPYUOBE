import { NavLink, useNavigate } from 'react-router-dom';

const menus = [
  { name: 'Dashboard', path: '/admin', icon: '🏠' },

  { name: 'Import Users', path: '/admin/import-users' },
  { name: 'Import Courses', path: '/admin/import-courses' },

  { name: 'PLO Setup', path: '/admin/plos' },
  { name: 'Mapping PLO-Course', path: '/admin/mapping' },

  { name: 'PLO Evaluation', path: '/admin/Admin-PLO' },

  // ✅ YLO
  { name: 'YLO Setup', path: '/admin/ylo-setup' },
  { name: 'YLO Evaluation', path: '/admin/ylo-eval' }
];

export default function AdminMenu() {

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');   // ✅ ลบ token
    navigate('/');                      // ✅ กลับหน้า login
  };

  return (
    <div className="w-64 min-h-screen bg-white shadow-md p-4 flex flex-col">

      {/* HEADER */}
      <h2 className="text-lg font-bold mb-4">
        ⚙ Admin Panel
      </h2>

      {/* MENU LIST */}
      <div className="flex flex-col gap-1 flex-1">

        {menus.map((m) => (
          <NavLink
            key={m.path}
            to={m.path}
            className={({ isActive }) =>
              `
              px-3 py-2 rounded-lg text-sm transition
              ${isActive
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100 text-gray-700'}
              `
            }
          >
            {m.icon && `${m.icon} `}{m.name}
          </NavLink>
        ))}

      </div>

      {/* ✅ LOGOUT SECTION */}
      <div className="mt-4 border-t pt-3">

        <button
          onClick={handleLogout}
          className="
            w-full text-left px-3 py-2 rounded-lg
            bg-red-100 text-red-600
            hover:bg-red-200 transition
          "
        >
          🚪 Logout
        </button>

      </div>

    </div>
  );
}