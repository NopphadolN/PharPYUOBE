import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post('/auth/login', {
        username,
        password
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);

      // ✅ ถ้ายังไม่เคยเปลี่ยนรหัส
      if (res.data.mustChangePassword) {
        setShowChangePassword(true);
        return;
      }

      redirectByRole(res.data.role);

    } catch (err) {
      console.error(err);
      alert('Login failed ❌');
    }
  };

  const redirectByRole = (role) => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'instructor') navigate('/instructor');
    else navigate('/student');
  };

const handleChangePassword = async (e) => {
  e.preventDefault();

  // ✅ validation
  if (newPassword.length < 8) {
    alert('รหัสต้องมีอย่างน้อย 8 ตัว');
    return;
  }

  if (newPassword !== confirmPassword) {
    alert('Password ไม่ตรงกัน');
    return;
  }

  try {
    await api.post('/auth/change-password-first-time', {
      username,
      newPassword
    });

    alert('เปลี่ยนรหัสผ่านสำเร็จ ✅');

    setShowChangePassword(false);

    const role = localStorage.getItem('role');
    redirectByRole(role);

  } catch (err) {
    console.error(err);
    alert('เปลี่ยน password ไม่สำเร็จ ❌');
  }
};

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-white">

      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">

        {/* LOGO */}
        <div className="flex flex-col items-center mb-4">
          <img src="/logoPhar.png" alt="logo" className="w-32 mb-2" />
          <h2 className="text-lg font-semibold text-center">
            ระบบจัดการการศึกษา
          </h2>
          <p className="text-sm text-gray-500 text-center">
            คณะเภสัชศาสตร์ มหาวิทยาลัยพายัพ
          </p>
        </div>

        {/* ✅ ถ้ายังไม่เคยเปลี่ยนรหัส */}
        {showChangePassword ? (
<form onSubmit={handleChangePassword} className="space-y-3">
  <p className="text-red-500 text-sm text-center">
    กรุณาเปลี่ยนรหัสผ่านก่อนใช้งาน (ครั้งแรกเท่านั้น)
  </p>

  {/* New Password */}
  <div className="relative">
    <input
      type={showNewPassword ? "text" : "password"}
      placeholder="New Password"
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      className="w-full border rounded-lg px-3 py-2 pr-10"
      required
    />
    <span
      className="absolute right-3 top-2.5 cursor-pointer text-sm text-gray-500"
      onClick={() => setShowNewPassword(!showNewPassword)}
    >
      {showNewPassword ? '🙈' : '👁️'}
    </span>
  </div>

  {/* Confirm Password */}
  <input
    type="password"
    placeholder="Confirm Password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    className="w-full border rounded-lg px-3 py-2"
    required
  />
  <button
    type="submit"
    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg"
  >
    เปลี่ยนรหัสผ่าน
  </button>
</form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-3">

            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />

            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
            >
              Login
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
