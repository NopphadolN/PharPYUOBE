import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaBars,
  FaTimes
} from "react-icons/fa";

export default function InstructorMenu() {

  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* TOP BAR */}
      <header className="
        sticky top-0 z-50
        bg-gradient-to-r
        from-green-500
        to-blue-500
        text-white
        shadow-lg
      ">

        <div className="max-w-full px-4">

          <div className="flex items-center justify-between h-20">

            {/* LOGO */}
            <div className="flex items-center gap-3">

        <img
          src="/logoPhar.png"
          alt="logo"
          className="w-16 mb-1 mx-auto"
        />

              <div className="hidden md:block">
                <div className="font-semibold">
                  ระบบจัดการศึกษา
                </div>

                <div className="text-s opacity-90">
                  คณะเภสัชศาสตร์ มหาวิทยาลัยพายัพ
                </div>
              </div>

            </div>

            {/* DESKTOP MENU */}
            <nav className="hidden lg:flex items-center gap-1">

              <MenuItem
                to="/instructor"
                label="หน้าแรก"
                active={isActive('/instructor')}
              />

              <MenuItem
                to="/instructor/course"
                label="รายวิชา"
                active={isActive('/instructor/course')}
              />

              <MenuItem
                to="/instructor/student"
                label="นักศึกษา"
                active={isActive('/instructor/student')}
              />

              <MenuItem
                to="/instructor/clo"
                label="ประเมิน CLO"
                active={isActive('/instructor/clo')}
              />

              <MenuItem
                to="/instructor/CloRemedial"
                label="แก้ไข CLO"
                active={isActive('/instructor/CloRemedial')}
              />

              <MenuItem
                to="/instructor/plo-report"
                label="PLO/YLO"
                active={isActive('/instructor/plo-report')}
              />

              <MenuItem
                to="/instructor/report"
                label="รายงาน"
                active={isActive('/instructor/report')}
              />

              <MenuItem
                to="/instructor/print"
                label="พิมพ์"
                active={isActive('/instructor/print')}
              />

              <button
                onClick={handleLogout}
                className="
                  ml-2
                  px-3
                  py-2
                  rounded-lg
                  bg-red-500
                  hover:bg-red-600
                "
              >
                Logout
              </button>

            </nav>

            {/* MOBILE BUTTON */}
            <button
              className="lg:hidden text-xl"
              onClick={() => setOpen(!open)}
            >
              {open ? <FaTimes /> : <FaBars />}
            </button>

          </div>

        </div>

      </header>

      {/* MOBILE MENU */}

      {open && (
        <div className="
          lg:hidden
          bg-white
          shadow-md
          border-b
        ">

          <div className="flex flex-col p-3 gap-2">

            <MobileItem
              to="/instructor"
              label="หน้าแรก"
              setOpen={setOpen}
            />

            <MobileItem
              to="/instructor/course"
              label="จัดการรายวิชา"
              setOpen={setOpen}
            />

            <MobileItem
              to="/instructor/student"
              label="เพิ่มนักศึกษา"
              setOpen={setOpen}
            />

            <MobileItem
              to="/instructor/clo"
              label="ประเมิน CLO"
              setOpen={setOpen}
            />

            <MobileItem
              to="/instructor/CloRemedial"
              label="แก้ไข CLO"
              setOpen={setOpen}
            />

            <MobileItem
              to="/instructor/plo-report"
              label="รายงาน PLO/YLO"
              setOpen={setOpen}
            />

            <MobileItem
              to="/instructor/report"
              label="รายงานนักศึกษา"
              setOpen={setOpen}
            />

            <MobileItem
              to="/instructor/print"
              label="พิมพ์เอกสาร"
              setOpen={setOpen}
            />

            <button
              onClick={handleLogout}
              className="
                mt-2
                bg-red-500
                text-white
                py-2
                rounded-lg
              "
            >
              Logout
            </button>

          </div>

        </div>
      )}

    </>
  );
}

function MenuItem({ to, label, active }) {
  return (
    <Link
      to={to}
      className={`
        px-3 py-2 rounded-lg transition
        ${active
          ? 'bg-white text-green-700 font-semibold'
          : 'hover:bg-white/20'}
      `}
    >
      {label}
    </Link>
  );
}

function MobileItem({ to, label, setOpen }) {
  return (
    <Link
      to={to}
      onClick={() => setOpen(false)}
      className="
        px-3 py-2
        rounded-lg
        hover:bg-gray-100
      "
    >
      {label}
    </Link>
  );
}