import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import InstructorDashboard from './pages/instructor/Dashboard';
import StudentDashboard from './pages/student/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ImportUsers from './pages/admin/ImportUsers';
import ImportCourses from './pages/admin/ImportCourses';
import PLOPage from './pages/admin/PLOPage';
import MappingPage from './pages/admin/MappingPage';
import AdminPLOPage from './pages/admin/AdminPLOPage';

import YLOSetupPage from './pages/admin/YLOSetupPage';
import AdminYLOPage from './pages/admin/AdminYLOEvaluation';

import CoursePage from './pages/instructor/CoursePage';
import CLOPage from './pages/instructor/CLOPage';
import CourseStep2 from './pages/instructor/CourseStep2';
import StudentEnrollPage from './pages/instructor/StudentEnrollPage';
import PLOReportPage from './pages/instructor/PLOReportPage';
import ReportPage from './pages/instructor/ReportPage';
import BookPage from './pages/instructor/BookPage';
import PrintPage from './pages/instructor/PrintPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />}/>

        <Route path="/admin" 
        element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>}/>

        <Route
          path="/instructor"
          element={
            <ProtectedRoute role="instructor">
              <InstructorDashboard />
            </ProtectedRoute>}/>

        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>}/>
        
        <Route
          path="/admin/import-users"
          element={
            <ProtectedRoute role="admin">
              <ImportUsers />
            </ProtectedRoute>}/>

          <Route
            path="/admin/import-courses"
          element={
            <ProtectedRoute role="admin">
              <ImportCourses />
            </ProtectedRoute>}/>

          <Route
            path="/admin/plos"
          element={
            <ProtectedRoute role="admin">
              <PLOPage />
            </ProtectedRoute>}/>

          <Route
            path="/admin/mapping"
          element={
            <ProtectedRoute role="admin">
              <MappingPage />
            </ProtectedRoute>}/>

          <Route path="/admin/Admin-PLO" 
          element={
            <ProtectedRoute role="admin">
            <AdminPLOPage />
            </ProtectedRoute>} />

          <Route
            path="/instructor/course"
          element={
            <ProtectedRoute role="instructor">
              <CoursePage />
            </ProtectedRoute>}/>
        
          <Route
            path="/instructor/clo"
          element={
            <ProtectedRoute role="instructor">
              <CLOPage />
            </ProtectedRoute>}/>
          
          <Route
            path="/instructor/course/step2"
          element={
            <ProtectedRoute role="instructor">
              <CourseStep2 />
            </ProtectedRoute>}/>

          <Route
            path="/instructor/student"
          element={<StudentEnrollPage />}/>

<Route path="/instructor/plo-report"element={<PLOReportPage />}/>
<Route path="/instructor/report"element={<ReportPage />}/>
<Route path="/instructor/book"element={<BookPage />}/>
<Route path="/instructor/print" element={<PrintPage />} />
<Route path="/admin/ylo-setup" element={<YLOSetupPage />} />
<Route path="/admin/ylo-eval" element={<AdminYLOPage />} />


      </Routes>
    </BrowserRouter>
  );
}

export default App;