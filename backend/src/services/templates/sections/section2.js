const renderSection2 = (data) => {

  const lecture = data.courseContents
    .filter(c => c.type === 'lecture')
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
  const lab = data.courseContents
    .filter(c => c.type === 'lab')
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
  const totalLecture = lecture.reduce((s, r) => s + Number(r.hours), 0);
  const totalLab = lab.reduce((s, r) => s + Number(r.hours), 0);

  const formatDate = (d) => {
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear() + 543;
    return `${day}/${month}/${year}`;
  };

  const formatTopic = (text = '') => {
  return text
    .replace(/(\d+\.\d+)/g, '<br>$1')
    .replace(/^<br>/, '');
};

const shortName = (name) => {
  if (!name) return '-';
  return name.trim().split(/\s+/)[0];
};

const getInstructorName = (r) => { 
  // ✅ FIX: faculty → คณาจารย์
  if (r.guest_teacher_name === 'faculty') {
    return 'คณาจารย์';
  } 
  // ✅ อ. พิเศษ
  if (r.guest_teacher_name) {
    return shortName(r.guest_teacher_name);
  }
  // ✅ อ. ประจำ
  const found = data.instructors.find(
    i => i.id == r.instructor_id
  );
  return found ? shortName(found.name_th) : '-';
};

  const renderTable = (rows, total, title) => `
  
    <p><b>${title}</b></p>
    <table>
      <thead>
        <tr>
          <th>วันที่</th>
          <th>หัวข้อ</th>
          <th>เนื้อหา</th>
          <th>จำนวนชั่วโมง</th>
          <th>อาจารย์</th>
        </tr>
      </thead>

      <tbody>
        ${rows.map(r => `
          <tr style="vertical-align: top">
            <td>${formatDate(r.date)}</td>
            <td style="text-align: center">${r.order}</td>
            <td>${formatTopic(r.topic)}</td>
            <td style="text-align: center">${r.hours}</td>
            <td style="text-align: center; white-space: nowrap;">${getInstructorName(r)}</td>
          </tr>
        `).join('')}

        <tr style="text-align:center">
          <td colspan="3"><b>รวมชั่วโมง</b></td>
          <td><b>${total}</b></td>
          <td></td>
        </tr>
      </tbody>
    </table>
  `;

  return `
  <div class="heading">
  <p><b>7. เนื้อหากระบวนวิชา</b></p>
  </div>
    <div>
      ${renderTable(lecture, totalLecture, '(บรรยาย)')}
      ${lab.length > 0
        ? renderTable(lab, totalLab, '(ปฏิบัติการ)')
        : ''
      }
    </div>
  `;
};

module.exports = { renderSection2 };