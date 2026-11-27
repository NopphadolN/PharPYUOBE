import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import InstructorMenu
from '../../components/InstructorMenu';
import Card
from '../../components/ui/Card';
import Select
from '../../components/ui/Select';
import Button
from '../../components/ui/Button';
import Input
from '../../components/ui/Input';

export default function CloRemedialPage() {
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [courseId, setCourseId] = useState('');
  const [instanceId, setInstanceId] = useState(null);
  const [owner, setOwner] = useState(null);
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [failedScores, setFailedScores] = useState([]);
  const [remedials, setRemedials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newScore, setNewScore] = useState({});
  const [method, setMethod] = useState({});
  const [remark, setRemark] = useState({});
  const [students, setStudents] = useState([]);
  const remedialMethods = [
    'สอบซ่อม',
    'Assignment เพิ่มเติม',
    'Case Study เพิ่มเติม',
    'Project เพิ่มเติม',
    'Practical เพิ่มเติม',
    'กิจกรรมเสริม'
  ];

  /* =====================
     USER
  ===================== */
  useEffect(() => {
    api.get('/instructor/me')
      .then(res => {
        setUser(res.data);
      })
      .catch(console.error);
  }, []);

  /* =====================
     COURSES
  ===================== */

  useEffect(() => {
    api.get('/instructor/courses')
      .then(res => {
        setCourses(res.data);
      })
      .catch(console.error);
  }, []);

  /* =====================
     INSTANCE
  ===================== */

  useEffect(() => {
    if (
      !courseId ||
      !year ||
      !semester
    ) {
      return;
    }
    (async () => {
      try {
        const res =
          await api.get(
            '/instructor/instance',
            {
              params: {
                course_id: courseId,
                year,
                semester
              }
            }
          );
        if (!res.data) {
          setOwner(null);
          setInstanceId(null);
          setFailedScores([]);
          setRemedials([]);
          return;
        }
        setOwner(res.data.owner);
        setInstanceId(res.data.id);
 const instanceIdLocal = res.data.id;
        setInstanceId(instanceIdLocal);
 const stuRes = await api.get(
    '/student/course-students',
    {
      params:{
        course_instance_id:
          instanceIdLocal
      }
    }
  );
setStudents(stuRes.data || []); 

      }
      catch(err){
        console.error(err);
      }
    })();
  }, [
    courseId,
    year,
    semester
  ]);

  const isOwner = user &&
    (user.id === owner?.id || user.can_edit_all_courses === true);

  /* =====================
     FAILED
  ===================== */
  const loadFailed = async(instanceIdLocal) => {
    try {
      const res = await api.get(
          '/instructor/indicator-failed',
          {
            params: {
              course_instance_id:
                instanceIdLocal
            }
          }
        );
      setFailedScores(res.data || []);
    }
    catch(err){
      console.error(err);
    }
  };

  /* =====================
     HISTORY
  ===================== */
  const loadHistory = async(instanceIdLocal) => {
    try {
      const res = await api.get('/instructor/indicator-remedials',
          {
            params: {
              course_instance_id:
                instanceIdLocal
            }
          }
        );
      setRemedials(res.data || []);
    }
    catch(err){console.error(err);}
  };

  /* =====================
     AUTO LOAD
  ===================== */
  useEffect(() => {
    if (!instanceId) {
      return;
    }
    loadFailed(instanceId);
    loadHistory(instanceId);
  }, [instanceId]);

  /* =====================
     SAVE REMEDIAL
  ===================== */
  const saveRemedial = async(row) => {
      if (!newScore[row.id] && newScore[row.id] !== 0) {
        alert('กรุณากรอกคะแนนใหม่');
        return;
      }
      if (!method[row.id]) {
        alert('กรุณาเลือกวิธีการแก้ไข');
        return;
      }
      try {
        setLoading(true);
        await api.post('/instructor/indicator-remedial',
          {
            scoreId: row.id,
            newScore: Number(newScore[row.id]),
            method: method[row.id],
            remark: remark[row.id] || '',
            userId: user.id
          }
        );
        alert('✅ บันทึกสำเร็จ');
        await loadFailed(instanceId);
        await loadHistory(instanceId);
      }
      catch(err){
        console.error(err);
        alert('❌ บันทึกไม่สำเร็จ');
      }
      finally{setLoading(false);}
    };

/* =====================
   FAILED SUMMARY
===================== */
const failedSummary = {};
failedScores.forEach(row => {
  const cloCode = row.clo_code || 'Unknown';
  if (!failedSummary[cloCode]) {
    failedSummary[cloCode] = new Set();
  }
  failedSummary[cloCode].add(row.student_id);
});
const totalStudentCount = students.length || 0;

/* =====================
   REMEDIAL SUMMARY
===================== */
const remedialSummary = {};
remedials.forEach(item => {
  const key =
    `${item.clo_code} | ${item.indicator_description}`;
  if (!remedialSummary[key]) {
    remedialSummary[key] = {
      passStudents: new Set(),
      currentFailed: new Set()
    };
  }
  const target =
    Number(item.indicator_target || 50);
  if (Number(item.new_percent || 0) >= target) 
    {
    remedialSummary[key]
      .passStudents
      .add(item.student_id);
  }
});
failedScores.forEach(item => {
  const key =
    `${item.clo_code} | ${item.indicator_description}`;
  if (!remedialSummary[key]) {
    remedialSummary[key] = {
      passStudents: new Set(),
      currentFailed: new Set()
    };
  }
  remedialSummary[key]
    .currentFailed
    .add(item.student_id);
});

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <InstructorMenu />
      <div className="p-6 space-y-6">
        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="text-xl font-bold">
            📌 CLO Remedial
          </h2>
          {owner && (
            <div className="text-sm text-gray-600 mt-2">
              👑 ผู้รับผิดชอบ: {owner.name_th}
            </div>
          )}
          {!isOwner && owner && (
            <div className="text-red-500 text-sm mt-2">
              🔒 คุณไม่มีสิทธิ์แก้ไข
            </div>
          )}
        </div>

        {/* FILTER */}
        <Card>
          <div className="flex flex-wrap gap-3">
            <Select
              value={year}
              onChange={e =>
                setYear(
                  e.target.value
                )
              }
            >
              <option value="">
                ปี
              </option>
              {[2568,2569,2570,2571,2572,2573]
                .map(y => (
                  <option
                    key={y}
                    value={y}
                  >
                    {y}
                  </option>
                ))
              }
            </Select>
            <Select
              value={semester}
              onChange={e =>
                setSemester(
                  e.target.value
                )
              }
            >
              <option value="">
                เทอม
              </option>
              <option value="1">
                1
              </option>
              <option value="2">
                2
              </option>
            </Select>
            <Select
              value={courseId}
              onChange={e =>
                setCourseId(
                  e.target.value
                )
              }
            >
              <option value="">
                วิชา
              </option>
              {courses.map(c => (
                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.code_en}
                  {' - '}
                  {c.name_th}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        {/* FAILED TABLE */}
<Card>
  <h3 className="font-semibold mb-3">
    📊 สรุปนักศึกษาที่ยังไม่ผ่านตาม CLO
  </h3>
  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
    {Object.entries(failedSummary)
      .sort((a,b) => b[1].size - a[1].size)
      .map(([cloCode, studentSet]) => {
        const count = studentSet.size;
        const percent = totalStudentCount > 0
            ? (count / totalStudentCount) * 100
            : 0;
        return (
          <div
            key={cloCode}
            className="
              border
              rounded-xl
              p-4
              bg-red-50
            "
          >
            <div className="font-semibold">
              {cloCode}
            </div>
            <div className="text-2xl font-bold text-red-600">
              {count}
            </div>
            <div className="text-sm text-gray-600">
              จาก {totalStudentCount} คน
            </div>
            <div className="text-sm font-semibold text-red-500 mt-1">
              {percent.toFixed(1)}%
            </div>
          </div>
        );
      })}
  </div>
</Card>

        <Card>
          <h3 className="font-semibold mb-4">
            นักศึกษาที่ยังไม่ผ่าน
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">รหัส</th>
                  <th className="border p-2">ชื่อ</th>
                  <th className="border p-2">CLO</th>
                  <th className="border p-2">Indicator</th>
                  <th className="border p-2">Evaluation</th>
                  <th className="border p-2">Target</th>
                  <th className="border p-2">เดิม</th>
                  <th className="border p-2">%</th>
                  <th className="border p-2">คะแนนใหม่</th>
                  <th className="border p-2">วิธีการแก้ไข</th>
                  <th className="border p-2">หมายเหตุ</th>
                  <th className="border p-2">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {failedScores.map(row => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="border p-2">
                      {row.user_code}
                    </td>
                    <td className="border p-2">
                      {row.name_th}
                    </td>
                    <td className="border p-2 text-center">
                      {row.clo_code}
                    </td>
                    <td className="border p-2">
                      {row.indicator_description}
                    </td>
                    <td className="border p-2">
                      {row.evaluation_name}
                    </td>
                    <td className="border p-2 text-center">
                      {row.indicator_target}%
                    </td>
                    <td className="border p-2 text-center">
                      {row.score}
                      /
                      {row.full_score}
                    </td>
                    <td className="border p-2 text-center text-red-600 font-semibold">
                      {Number(
                        row.percent || 0
                      ).toFixed(2)}
                      %
                    </td>
                    <td className="border p-2">
                      <Input
                        type="number"
                        disabled={!isOwner}
                        value={
                          newScore[row.id] || ''
                        }
                        onChange={e =>
                          setNewScore(
                            prev => ({
                              ...prev,
                              [row.id]:
                                e.target.value
                            })
                          )
                        }
                      />
                    </td>
                    <td className="border p-2">
                      <Select
                        disabled={!isOwner}
                        value={
                          method[row.id] || ''
                        }
                        onChange={e =>
                          setMethod(
                            prev => ({
                              ...prev,

                              [row.id]:
                                e.target.value
                            })
                          )
                        }
                      >
                        <option value="">เลือก</option>
                        {remedialMethods.map(m => (
                          <option
                            key={m}
                            value={m}
                          >
                            {m}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="border p-2">
                      <Input
                        disabled={!isOwner}
                        value={
                          remark[row.id] || ''
                        }
                        onChange={e =>
                          setRemark(
                            prev => ({
                              ...prev,
                              [row.id]:
                                e.target.value
                            })
                          )
                        }
                      />
                    </td>
                    <td className="border p-2 text-center">
                      <Button
                        disabled={
                          !isOwner ||
                          loading
                        }
                        onClick={() =>
                          saveRemedial(row)
                        }
                      >
                        💾
                      </Button>
                    </td>
                  </tr>
                ))}
                {failedScores.length === 0 && (
                  <tr>
                    <td
                      colSpan="12"
                      className="
                        text-center
                        p-6
                        text-gray-500
                      "
                    >
                      ✅ ไม่มีนักศึกษาที่ไม่ผ่าน
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* HISTORY */}
<Card>
  <h3 className="font-semibold mb-3">
    ✅ สรุปผลการแก้ไขตาม CLO / Indicator
  </h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {Object.entries(remedialSummary)
      .sort((a,b) => {
  const rateA =
    a[1].passStudents.size /
    Math.max(
      a[1].passStudents.size +
      a[1].currentFailed.size,
      1
    );
  const rateB =
    b[1].passStudents.size /
    Math.max(
      b[1].passStudents.size +
      b[1].currentFailed.size,
      1
    );
  return rateA - rateB;
})
    .map(([key, data]) => {
      const passCount = data.passStudents.size;
      const failCount = data.currentFailed.size;
      const total = passCount + failCount;
      const successRate = total > 0
          ? (passCount / total) * 100
          : 0;
      return (
        <div
          key={key}
          className="
            border
            rounded-xl
            p-4
            bg-blue-50
          "
        >
          <div className="font-semibold mb-2">
            {key}
          </div>
          <div className="flex gap-6">
            <div>
              <div className="text-green-600 font-bold text-xl">
                {passCount}
              </div>
              <div className="text-sm">
                ผ่าน
              </div>
            </div>
            <div>
              <div className="text-red-500 font-bold text-xl">
                {failCount}
              </div>
              <div className="text-sm">
                ยังไม่ผ่านปัจจุบัน
              </div>
            </div>
          </div>
          <div className="mt-2 text-sm font-semibold text-blue-600">
            Success Rate :
            {' '}
            {successRate.toFixed(1)}
            %
          </div>
        </div>
      );
    })}
  </div>
</Card>

        <Card>
          <h3 className="font-semibold mb-4">
            ประวัติการแก้ไขผลการเรียนรู้
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100">
               <tr>
                  <th className="border p-2">
                    วันที่
                  </th>
                  <th className="border p-2">
                    รหัส
                  </th>
                  <th className="border p-2">
                    ชื่อ
                  </th>
                  <th className="border p-2">
                    CLO
                  </th>
                  <th className="border p-2">
                    Indicator
                  </th>
                  <th className="border p-2">
                    Evaluation
                  </th>
                  <th className="border p-2">
                    ผลการแก้ไข
                  </th>
                  <th className="border p-2">
                    วิธีการ
                  </th>
                  <th className="border p-2">
                    หมายเหตุ
                  </th>
                </tr>
              </thead>
              <tbody>
                {remedials.map(item => (
                  <tr key={item.id}>
                    <td className="border p-2 text-center">
                      {
                        item.remedial_date
                          ?.substring(0,10)
                      }
                    </td>
                    <td className="border p-2">
                      {item.user_code}
                    </td>
                    <td className="border p-2">
                      {item.name_th}
                    </td>

                    <td className="border p-2 text-center">
                      {item.clo_code}
                    </td>
                    <td className="border p-2">
                      {item.indicator_description}
                    </td>
                    <td className="border p-2">
                      {item.evaluation_name}
                    </td>
                    <td className="border p-2 text-center">
                      <span className="text-red-500">
                        {Number(
                          item.old_percent || 0
                        ).toFixed(2)}
                        %
                      </span>
                      {' → '}
                      <span className="text-green-600 font-semibold">
                        {Number(
                          item.new_percent || 0
                        ).toFixed(2)}
                        %
                      </span>
                    </td>
                    <td className="border p-2">
                      {item.remedial_method}
                    </td>
                    <td className="border p-2">
                      {item.remark}
                    </td>
                  </tr>
                ))}
                {remedials.length === 0 && (
                  <tr>
                    <td
                      colSpan="9"
                      className="
                        text-center
                        p-6
                        text-gray-500
                      "
                    >
                      ยังไม่มีประวัติการแก้ไข
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );

}    

