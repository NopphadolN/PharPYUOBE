// ✅ helper: convert clo_ids → CLO1, CLO2
const normalizeIds = (val) => {
  if (!val) return [];

  // ✅ already array
  if (Array.isArray(val)) {
    return val.map(v => String(v).trim());
  }

  // ✅ string JSON
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) {
      return parsed.map(v => String(v).trim());
    }
  } catch (e) {}

  return [];
};


const formatClos = (cloIds, clos) => {
  const ids = normalizeIds(cloIds);

  return ids.map(id => {
    const index = clos.findIndex(c => String(c.id) === id);
    return index >= 0 ? `CLO${index + 1}` : null;
  }).filter(Boolean).join(', ') || '-';
};


// ✅ helper: activity mapping
const getActivity = (type) => {
  if (type === 'lecture') return 'บรรยาย';
  if (type === 'lab') return 'ปฏิบัติการ';
  return '-';
};


const renderSection6 = (data) => {

  const {
    clos = [],
    courseContents = [],
    instructors = []
  } = data;

  // ✅ sort ตาม week/order
  const sortedContents = [...courseContents].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  return `
  <div class="section page-break">

    <div style="border: 1px solid #000; padding: 3px; margin: 20px 0;">
      <div style="border: 4px solid #000; padding: 8px 0; text-align: center;">
        <h2 style="margin: 0; font-size: 16px;">
          หมวดที่ 5 แผนการสอนและการประเมินผล
        </h2>
      </div>
    </div>

    <p><strong>1. แผนการสอน</strong></p>

    <table style="width:100%; border-collapse: collapse; font-size:14px;">

      <thead>
        <tr>
          <th style="border:1px solid #000;">CLOs</th>
          <th style="border:1px solid #000;">สัปดาห์ที่</th>
          <th style="border:1px solid #000;">หัวข้อ/รายละเอียด</th>
          <th style="border:1px solid #000;">LLOs</th>
          <th style="border:1px solid #000;">จำนวนชั่วโมง</th>
          <th style="border:1px solid #000;">กิจกรรมการเรียนการสอน</th>
          <th style="border:1px solid #000;">อาจารย์ผู้สอน</th>
        </tr>
      </thead>

      <tbody>

        ${sortedContents.map((c, index) => {

          // ✅ CLO mapping
          const cloText = formatClos(c.clo_ids, clos);

          // ✅ week
          const week = c.order || (index + 1);

          // ✅ topic
          const topic = c.topic || '-';

          // ✅ LLO (fallback ใช้ topic)
          const llo = topic || '-';

          // ✅ hours
          const hours = c.hours || '-';

          // ✅ activity
          const activity = getActivity(c.type);

          // ✅ instructor
          const instructor =
            instructors.find(i => i.id == c.instructor_id)?.name_th || '-';

          return `
          <tr>

            <td style="border:1px solid #000;">
              ${cloText}
            </td>

            <td style="border:1px solid #000; text-align:center;">
              ${week}
            </td>

            <td style="border:1px solid #000;">
              ${topic}
            </td>

            <td style="border:1px solid #000;">
              ${llo}
            </td>

            <td style="border:1px solid #000; text-align:center;">
              ${hours}
            </td>

            <td style="border:1px solid #000;">
              - ${activity}
            </td>

            <td style="border:1px solid #000;">
              ${instructor}
            </td>

          </tr>
          `;
        }).join('')}

      </tbody>

    </table>

  </div>
  `;
};

module.exports = { renderSection6 };