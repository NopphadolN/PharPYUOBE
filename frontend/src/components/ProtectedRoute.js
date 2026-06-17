import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  // ❌ ไม่มี token → กลับ login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // ❌ role ไม่ตรง → กลับ login
  if (role && userRole !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;

