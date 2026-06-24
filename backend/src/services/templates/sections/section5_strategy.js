// ✅ helper: ตรวจว่า JSON array มี id ไหม
const containsId = (arr, id) => {
  if (!Array.isArray(arr)) return false;
  return arr.map(String).includes(String(id));
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
          containsId(c.clo_ids, clo.id)
        );

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
        const indicators = cloIndicators.filter(i => i.clo_id == clo.id);

        const indicatorText = indicators.length > 0
          ? indicators.map(i =>
              `- ${i.description} (${i.target}%)`
            ).join('<br>')
          : '-';

        // ✅ ✅ ✅ 4. evaluation per CLO (🔥 สำคัญ)
        const evals = courseEvaluations.filter(e => {

          const lectureIds = e.content_ids_lecture || [];
          const labIds = e.content_ids_lab || [];

          return contentIds.some(id =>
            containsId(lectureIds, id) ||
            containsId(labIds, id)
          );
        });

        // ✅ remove duplicate name
        const uniqueEvalNames = [...new Set(evals.map(e => e.name))];

        const evalText = uniqueEvalNames.length > 0
          ? uniqueEvalNames.map(n => `- ${n}`).join('<br>')
          : '-';

        return `
          <tr>

            <td style="border:1px solid #000; vertical-align:top;">
              <b>CLO ${index + 1}:</b><br>
              ${clo.description || '-'}
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