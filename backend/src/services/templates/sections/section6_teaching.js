const renderSection6 = (data) => {

  const { courseContents = [], clos = [], instructors = [], guestTeachers = [] } = data;

  // ✅ sort ตามวันที่
  const sorted = [...courseContents].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // ✅ base date (ใช้ตัวแรก)
  const baseDate = sorted.length > 0 ? new Date(sorted[0].date) : null;

  // ✅ format วันที่
  const formatDate = (d) => {
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear() + 543;
    return `${day}/${month}/${year}`;
  };

  // ✅ short name
  const shortName = (name) => {
    if (!name) return '-';
    return name.trim().split(/\s+/)[0];
  };

  // ✅ หา instructor name
  const getInstructorName = (c) => {

    // faculty
    if (c.guest_teacher_name === 'faculty') {
      return 'คณาจารย์';
    }

    // guest teacher
    if (c.guest_teacher_name) {
      return shortName(c.guest_teacher_name);
    }

    // instructor
    const found = instructors.find(i => i.id == c.instructor_id);
    return found ? shortName(found.name_th) : '-';
  };

  // ✅ week จาก date
  const getWeek = (date) => {
    if (!baseDate) return '-';

    const diff = new Date(date) - baseDate;
    const week = Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) + 1;

    return week;
  };

  // ✅ CLO mapping
  const normalizeIds = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(v => String(v));
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed.map(v => String(v)) : [];
    } catch {
      return [];
    }
  };

  const formatClos = (cloIds) => {
    const ids = normalizeIds(cloIds);

    return ids.map(id => {
      const index = clos.findIndex(c => String(c.id) === id);
      return index >= 0 ? `CLO${index + 1}` : null;
    }).filter(Boolean).join(', ') || '-';
  };

  // ✅ LLO
const getLLO = (c) => {
  // ✅ ถ้ามี LLO (จาก DB) ให้ใช้ก่อน
  if (typeof c.llos === 'string' && c.llos.trim()) {
    return c.llos.replace(/\n/g, '<br>')
  }
  // ✅ fallback logic เดิม
  if (!c.topic) return '-';
  if (c.type === 'lecture') {
    return `อธิบาย เลือก หรือระบุ ${c.topic}`;
  }
  if (c.type === 'lab') {
    return `ปฏิบัติ ${c.topic}`;
  }
  return c.topic;
};

const formatTopic = (text = '') => {
  return text
    .replace(/(\d+\.\d+)/g, '<br>$1')
    .replace(/^<br>/, '');
};

  // ✅ activity
  const getActivity = (c) => {
    if (c.type === 'lecture') return '- บรรยาย';
    if (c.type === 'lab') return '- ปฏิบัติการ';
    return '-';
  };

  return `
  <div class="section">
  <div class="heading">
    <div style="border: 1px solid #000; padding: 3px; margin: 20px 0;">
      <div style="border: 4px solid #000; padding: 8px 0; text-align: center;">
        <h2 style="margin: 0; font-size: 23px;">
          หมวดที่ 5 แผนการสอนและการประเมินผล
        </h2>
      </div>
    </div>
    <p><strong>1. แผนการสอน</strong></p>
  </div>
    <table style="width:100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="border:1px solid #000;">ผลลัพธ์การเรียนรู้ที่คาดหวังของรายวิชา CLOs</th>
          <th style="border:1px solid #000;">สัปดาห์</th>
          <th style="border:1px solid #000;">หัวข้อ/รายละเอียด</th>
          <th style="border:1px solid #000;">วัตถุประสงค์การสอน (เฉพาะบท) LLOs</th>
          <th style="border:1px solid #000;">จำนวนชั่วโมง</th>
          <th style="border:1px solid #000;">กิจกรรมการเรียนการสอน และสื่อที่ใช้</th>
          <th style="border:1px solid #000;">อาจารย์ผู้สอน</th>
        </tr>
      </thead>

      <tbody>
        ${sorted.map(c => `
          <tr style="vertical-align:top">
            <td style="border:1px solid #000; text-align:center;">
              ${formatClos(c.clo_ids)}
            </td>
            <td style="border:1px solid #000; text-align:center;">
              ${getWeek(c.date)}
            </td>
            <td style="border:1px solid #000; 
            text-align:justify; text-justify: inter-word;">
              ${formatTopic(c.topic || '-')}
            </td>
            <td style="border:1px solid #000;
            text-align:justify; text-justify: inter-word;">
              ${getLLO(c)}
            </td>
            <td style="border:1px solid #000; text-align:center;">
              ${c.hours || '-'}
            </td>
            <td style="border:1px solid #000;">
              ${getActivity(c)}
              <p>- เอกสารประกอบการสอน</p>
            </td>
            <td style="border:1px solid #000; text-align:center; white-space: nowrap;">
              ${getInstructorName(c)}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  `;
};

module.exports = { renderSection6 };