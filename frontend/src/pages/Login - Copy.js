import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post('/auth/login', {
        username,   // ✅ เปลี่ยนจาก user_code
        password
      });

      // ✅ เก็บ token
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);

      // ✅ redirect ตาม role
      if (res.data.role === 'admin') {
        navigate('/admin');
      } else if (res.data.role === 'instructor') {
        navigate('/instructor');
      } else {
        navigate('/student');
      }

    } catch (err) {
      console.error(err);
      alert('Login failed ❌');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-white">

      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">

        {/* ✅ LOGO */}
        <div className="flex flex-col items-center mb-4">
          <img
            src="/logoPhar.png"
            alt="logo"
            className="w-32 mb-2"
          />

          <h2 className="text-lg font-semibold text-center">
            ระบบจัดการการศึกษา
          </h2>

          <p className="text-sm text-gray-500 text-center">
            คณะเภสัชศาสตร์ มหาวิทยาลัยพายัพ
          </p>
        </div>

        {/* ✅ FORM */}
        <form onSubmit={handleLogin} className="space-y-3">

          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="
              w-full border rounded-lg px-3 py-2
              focus:outline-none focus:ring-2 focus:ring-blue-400
            "
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="
              w-full border rounded-lg px-3 py-2
              focus:outline-none focus:ring-2 focus:ring-blue-400
            "
          />

          <button
            type="submit"
            className="
              w-full bg-blue-500 hover:bg-blue-600
              text-white py-2 rounded-lg
              font-medium transition
            "
          >
            Login
          </button>

        </form>

      </div>

    </div>
  );
}
