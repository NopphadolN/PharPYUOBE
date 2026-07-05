import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaBook,
  FaUsers,
  FaClipboardCheck,
  FaChartBar,
  FaFileAlt,
  FaPrint
} from "react-icons/fa";

export default function InstructorMenu() {

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-60 min-h-screen flex flex-col justify-between 
                    bg-gradient-to-b from-green-400 to-blue-400 
                    text-white p-5">

      {/* LOGO */}
      <div>
        <img
          src="/logoPhar.png"
          alt="logo"
          className="w-40 mb-3 mx-auto"
        />

        <h2 className="text-m text-center font-semibold leading-snug mb-6">
          ระบบจัดการศึกษา<br />
          คณะเภสัชศาสตร์<br />
          มหาวิทยาลัยพายัพ
        </h2>

        {/* MENU */}
        <nav className="flex flex-col gap-2">

          <MenuItem to="/instructor" label="หน้าแรก" icon={<FaHome />} active={isActive('/instructor')} />
          <MenuItem to="/instructor/course" label="จัดการรายวิชา" icon={<FaBook />} active={isActive('/instructor/course')} />
          <MenuItem to="/instructor/student" label="เพิ่มนักศึกษา" icon={<FaUsers />} active={isActive('/instructor/student')} />
          <MenuItem to="/instructor/clo" label="ประเมิน CLOs" icon={<FaClipboardCheck />} active={isActive('/instructor/clo')} />
          <MenuItem to="/instructor/plo-report" label="รายงานผล PLOs YLOs" icon={<FaChartBar />} active={isActive('/instructor/plo-report')} />
          <MenuItem to="/instructor/report" label="รายงานนักศึกษา" icon={<FaFileAlt />} active={isActive('/instructor/report')} />
          <MenuItem to="/instructor/print" label="ภาระการสอน (ยังไม่พร้อมใช้งาน)" icon={<FaPrint />} active={isActive('/instructor/workload')} />
          <MenuItem to="/instructor/print" label="อาจารย์ที่ปรึกษา (ยังไม่พร้อมใช้งาน)" icon={<FaPrint />} active={isActive('/instructor/advisor')} />
          <MenuItem to="/instructor/print" label="พิมพ์เอกสาร" icon={<FaPrint />} active={isActive('/instructor/print')} />
          <p></p>
          <p></p>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 transition 
                   py-2 rounded-lg font-medium"
            >
            Logout
          </button>
        </nav>
      </div>

      {/* FOOTER */}


    </div>
  );
}

/* ✅ Menu Item */

function MenuItem({ to, label, icon, active }) {
  return (
    <Link
      to={to}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg
        transition
        ${active ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'}
      `}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}