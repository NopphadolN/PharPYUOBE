const renderSection7 = (data) => {

  let { books, courseEvaluations, grading, courseContents = [], clos = [], note } = data;

  // ✅ parse
  if (typeof books === 'string') {
    try { books = JSON.parse(books); } catch { books = []; }
  }

  if (typeof grading === 'string') {
    try { grading = JSON.parse(grading); } catch { grading = []; }
  }

  const evalList = Array.isArray(courseEvaluations) ? courseEvaluations : [];

  // ✅ map CLO จาก content
  const getCLOCodes = (e) => {

    const ids = [
      ...(e.content_ids_lecture || []),
      ...(e.content_ids_lab || [])
    ];

    const cloSet = new Set();

    ids.forEach(cid => {
      const content = courseContents.find(c =>
        String(c.order) === String(cid) ||
        String(c.id) === String(cid)
      );
      if (!content) return;

      (content.clo_ids || []).forEach(cloId => {
        const clo = clos.find(c => String(c.id) === String(cloId));
        if (clo) cloSet.add(clo.code || `CLO${clos.findIndex(x => x.id == cloId)+1}`);
      });
    });

    return Array.from(cloSet).sort().join(', ');
  };

  // ✅ format content range
  const formatContentRange = (ids) => {

    let numbers = ids
      .map(cid => {
        const c = courseContents.find(x =>
          String(x.order) === String(cid) ||
          String(x.id) === String(cid)
        );
        return c ? Number(c.order) : Number(cid);
      })
      .filter(n => !isNaN(n));

    numbers = [...new Set(numbers)].sort((a, b) => a - b);

    const result = [];
    let start = numbers[0];
    let prev = numbers[0];

    for (let i = 1; i <= numbers.length; i++) {
      const curr = numbers[i];

      if (curr === prev + 1) {
        prev = curr;
        continue;
      }

      result.push(start === prev ? `${start}` : `${start}–${prev}`);
      start = curr;
      prev = curr;
    }

    return result.join(', ') || '-';
  };

  // ✅ total
  const totalEval = evalList.reduce(
    (sum, e) => sum + Number(e.total || 0), 0
  );

  // ✅ grading sort
  const gradeOrder = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];

  const sortedGrading = Array.isArray(grading)
    ? [...grading].sort(
        (a, b) => gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade)
      )
    : [];

  return `
  <div class="section page-break">
    <p><strong>2. แผนการประเมินผลการเรียนรู้</strong></p>
    <table style="width:100%; border-collapse: collapse; font-size:13px;">
      <tr>
        <th style="border:1px solid #000;">การประเมิน</th>
        <th style="border:1px solid #000;">CLOs</th>
        <th style="border:1px solid #000;">คะแนน</th>
        <th style="border:1px solid #000;">หัวข้อบรรยาย</th>
        <th style="border:1px solid #000;">หัวข้อปฏิบัติ</th>
        <th style="border:1px solid #000;">เครื่องมือ</th>
        <th style="border:1px solid #000;">สัปดาห์</th>
      </tr>

      ${evalList.map(e => `
        <tr style="vertical-align:top">
          <td style="border:1px solid #000;">${e.name || '-'}</td>
          <td style="border:1px solid #000; text-align:center;">${getCLOCodes(e) || '-'}</td>
          <td style="border:1px solid #000; text-align:center;">${e.total ?? '-'}</td>
          <td style="border:1px solid #000; text-align:center;">${formatContentRange(e.content_ids_lecture || [])}</td>
          <td style="border:1px solid #000; text-align:center;">${formatContentRange(e.content_ids_lab || [])}</td>
          <td style="border:1px solid #000; text-align:center;">${e.tool || '-'}</td>
          <td style="border:1px solid #000; text-align:center;">${e.week || '-'}</td>
        </tr>
      `).join('')}
      <tr style="font-weight:bold; text-align:center;">
        <td colspan="2">รวม</td>
        <td>${totalEval}</td>
        <td></td><td></td><td></td><td></td>
      </tr>
    </table>

    <!-- ✅ เกณฑ์ -->
    <p style="margin-top:20px;"><strong>3. เกณฑ์การประเมินผล</strong></p>
    <p style="margin-left:40px;">เกณฑ์การประเมินผลใช้วิธีการตัดเกรดแบบอิงเกณฑ์ ดังนี้</p>
    ${sortedGrading.map(g => {
      let text = '';

      if (Number(g.min) >= 80) {
        text = `≥ ${Number(g.min).toFixed(2)} %`;
      } else if (g.grade === 'F') {
        text = `≤ ${Number(g.max).toFixed(2)} %`;
      } else {
        text = `${Number(g.min).toFixed(2)} – ${Number(g.max).toFixed(2)} %`;
      }

      return `
      <div style="display:flex; justify-content:space-between; width:250px; margin-left:120px;">
        <div>${text}</div>
        <div>${g.grade}</div>
      </div>
      `;
    }).join('')}

    ${note ? `<div style="text-indent: 40px;">${note}</div>` : ''}
      <p><strong>แนวทางการอุทธรณ์ของนักศึกษา/ผู้เรียน Appeal procedure</strong></p>
      </div>
      <p style="text-indent: 40px; text-align: justify;">
      นักศึกษาสามารถทำเรื่องอุทธรณ์ผลการเรียนโดย Download แบบคำร้อง (ใช้คำร้องทั่วไป) ได้ที่ระบบ
e-registra และยื่นคำร้องได้ที่สำนักงานฝ่ายวิชาการและวิจัยภายใน 10 วันทำการ หลังจากประกาศผลการ
เรียนในระบบ e-registra</p>

    <!-- ✅ หมวดที่ 6 -->
    <div style="margin-top:30px;">
      <div style="border: 1px solid #000; padding: 3px;">
        <div style="border: 4px solid #000; padding: 8px; text-align:center;">
          <h2 style="margin:0; font-size: 16px;">หมวดที่ 6 ทรัพยากรประกอบการเรียนการสอน</h2>
        </div>
      </div>

      <p><strong>1. ตำราและเอกสารหลัก</strong></p>

      <div style="text-indent: 40px;">
        ${(Array.isArray(books) && books.length
          ? books
          : ['-']
        ).map((b, i) => `
          <div>${i + 1}. ${b}</div>
        `).join('')}
      </div>
      <p><strong>2. เอกสาร และข้อมูลสำคัญ</strong></p>
      <p><strong>3. เอกสาร และข้อมูลแนะนำ</strong></p>
    </div>

  </div>
  `;
};

module.exports = { renderSection7 };