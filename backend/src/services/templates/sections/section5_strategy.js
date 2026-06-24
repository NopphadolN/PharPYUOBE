// ✅ helper: ตรวจว่า JSON array มี id ไหม
const parseJSON = (val) => {
  if (Array.isArray(val)) return val;
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
};
const containsId = (arr, id) => {
  return parseJSON(arr).map(String).includes(String(id));
};

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

const renderSection5 = (data) => {

  const {
    clos = [],
    cloIndicators = [],
    courseContents = [],
    courseEvaluations = []
  } = data;

  return `
  <div class="section">

    <table style="width:100%; border-collapse: collapse; font-size:13px;">

      <thead>
        <tr>
          <th style="border:1px solid #000;">
            ผลลัพธ์การเรียนรู้ที่คาดหวังของรายวิชา (CLOs)
          </th>
          <th style="border:1px solid #000;">
            กลยุทธ์การสอนตาม CLOs
          </th>
          <th style="border:1px solid #000;">
            ตัวชี้วัดและค่าเป้าหมายการบรรลุ CLOs
          </th>
          <th style="border:1px solid #000;">
            กลยุทธ์สำหรับวิธีการวัดและประเมินผลตาม CLOs
          </th>
        </tr>
      </thead>

      <tbody>

      ${clos.map((clo, index) => {

        // ✅ 1. content ของ CLO
const contents = courseContents.filter(c =>
  normalizeIds(c.clo_ids).includes(String(clo.id))
);
console.log("MATCH CONTENT:", contents.map(c => c.id));
        const contentIds = contents.map(c => String(c.id));

        // ✅ 2. teaching strategy
        const hasLecture = contents.some(c => c.type === 'lecture');
        const hasLab = contents.some(c => c.type === 'lab');

        let teaching = [];
        if (hasLecture) teaching.push('บรรยาย');
        if (hasLab) teaching.push('ปฏิบัติการ');
        if (teaching.length === 0) teaching.push('-');

        const teachingHtml = teaching.map(t => `- ${t}`).join('<br>');

        // ✅ 3. indicator
const indicators = cloIndicators.filter(i =>
  String(i.clo_id) === String(clo.id) &&
  (!data.courseInstanceId || i.course_instance_id == data.courseInstanceId)
);
        const indicatorText = indicators.length > 0
          ? indicators.map(i =>
              `- ${i.description} (${i.target}%)`
            ).join('<br>')
          : '-';

        // ✅ ✅ ✅ 4. evaluation per CLO (🔥 สำคัญ)
const evals = courseEvaluations.filter(e => {

  const lectureIds = parseJSON(e.content_ids_lecture);
  const labIds = parseJSON(e.content_ids_lab);

  return contents.some(c =>
    lectureIds.map(String).includes(String(c.id)) ||
    labIds.map(String).includes(String(c.id))
  );
});

        // ✅ remove duplicate name
        const uniqueEvalNames = [...new Set(evals.map(e => e.name))];

        const evalText = uniqueEvalNames.length > 0
          ? uniqueEvalNames.map(n => `- ${n}`).join('<br>')
          : '-';


console.log("normalized clo_ids:",
  courseContents.map(c => normalizeIds(c.clo_ids))
);

console.log("==== DEBUG SECTION 5 ====");

clos.forEach(clo => {
  const contents = courseContents.filter(c =>
    normalizeIds(c.clo_ids).includes(String(clo.id))
  );

  const indicators = cloIndicators.filter(i =>
    String(i.clo_id) === String(clo.id)
  );

  console.log("CLO:", clo.id);
  console.log(" → contents:", contents.length);
  console.log(" → indicators:", indicators.length);
});
        return `
          <tr>

            <td style="border:1px solid #000; vertical-align:top;">
              CLO ${index + 1}:${clo.description || '-'}
            </td>

            <td style="border:1px solid #000; vertical-align:top;">
              ${teachingHtml}
            </td>

            <td style="border:1px solid #000; vertical-align:top;">
              ${indicatorText}
            </td>

            <td style="border:1px solid #000; vertical-align:top;">
              ${evalText}
            </td>

          </tr>
        `;
      }).join('')}

      </tbody>

    </table>

  </div>
  `;
};

module.exports = { renderSection5 };