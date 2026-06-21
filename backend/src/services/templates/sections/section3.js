const renderSection3 = (data) => {

  let { books, evaluations, grading, contents = [], clos = [], note } = data;

  // ✅ parse JSON
  if (typeof books === 'string') {
    try { books = JSON.parse(books); } catch { books = []; }
  }

  if (typeof grading === 'string') {
    try { grading = JSON.parse(grading); } catch { grading = []; }
  }

  const evalList = Array.isArray(evaluations) ? evaluations : [];

  // ✅ function หา CLO จาก content จริง
  const getCLOCodes = (e) => {

    const ids = [
      ...(e.content_ids_lecture || []),
      ...(e.content_ids_lab || [])
    ];

    const cloSet = new Set();

    ids.forEach(cid => {
      const content = contents.find(c =>
  String(c.order) === String(cid) ||   // ✅ เดิม
  String(c.id) === String(cid)         // ✅ FIX ใหม่
);
      if (!content) return;

      (content.clo_ids || []).forEach(cloId => {
        const clo = clos.find(c => c.id == cloId);
        if (clo) cloSet.add(clo.code);
      });
    });

    return Array.from(cloSet).sort().join(', ');
  };

const gradeOrder = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
// ✅ sort จาก A → F
let sortedGrading = Array.isArray(grading)
  ? [...grading].sort((a, b) =>
      gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade)
    )
  : [];

const totalEval = evalList.reduce(
  (sum, e) => sum + Number(e.total || 0),
  0
);

const formatContentRange = (ids) => {

  // ✅ map หา order + กัน id/order ปน
  let numbers = ids
    .map(cid => {
      const c = contents.find(x =>
        String(x.order) === String(cid) ||
        String(x.id) === String(cid)
      );
      return c ? Number(c.order) : Number(cid);
    })
    .filter(n => !isNaN(n));

  // ✅ remove duplicate
  numbers = [...new Set(numbers)];

  // ✅ sort
  numbers.sort((a, b) => a - b);

  // ✅ group เป็นช่วง
  const result = [];
  let start = numbers[0];
  let prev = numbers[0];

  for (let i = 1; i <= numbers.length; i++) {
    const curr = numbers[i];

    if (curr === prev + 1) {
      prev = curr;
      continue;
    }

    // ✅ push range
    if (start === prev) {
      result.push(`${start}`);
    } else {
      result.push(`${start}–${prev}`);
    }

    start = curr;
    prev = curr;
  }

  return result.join(', ') || '-';
};
  return `
    <div class="section">
      <div class="heading">
      <p style="margin-top: 20px;"><b>8. รายชื่อหนังสือประกอบการสอน</b></p>
      </div>
      <div style="text-indent: 40px;">
      ${(Array.isArray(books) && books.length
  ? [...books].sort((a, b) => a.localeCompare(b, 'th'))
  : ['-']).map((b, i) => `
  <div>${i + 1}. ${b}</div>
  `).join('')}
      </div>
      <div class="heading">  
      <p><b>9. สัดส่วนการให้คะแนน</b></p>
      </div>
<table>
  <tr>
    <th>การประเมิน</th>
    <th>CLOs</th>
    <th>คะแนน</th>
    <th>หัวข้อบรรยาย</th>
    <th>หัวข้อปฏิบัติ</th>
    <th>เครื่องมือ</th>
    <th>สัปดาห์</th>
  </tr>

  ${evalList.map(e => `
    <tr style="text-align:top">
      <td>${e.name || '-'}</td>
      <td style="text-align:center">${getCLOCodes(e) || '-'}</td>
      <td style="text-align:center">${e.total ?? '-'}</td>
      <td style="text-align:center">${formatContentRange(e.content_ids_lecture || [])}</td>
      <td style="text-align:center">${formatContentRange(e.content_ids_lab || [])}</td>
      <td style="text-align:center">${e.tool || '-'}</td>
      <td style="text-align:center">${e.week || '-'}</td>
    </tr>
  `).join('')}

  <!-- ✅ ✅ ✅ TOTAL ROW -->
  <tr style="font-weight:bold; text-align:center;">
    <td colspan="2">รวม</td>
    <td >${totalEval}</td>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
  </tr>
</table>
      <div class="heading">
      <p style="margin-top: 20px;"><b>10. เกณฑ์การประเมินผล</b></p>
      </div>
      <div style="text-indent: 40px; justify-content:space-between;">
      <p>• ในกรณีที่ไม่สามารถมาเข้าชั้นเรียน นักศึกษาต้องแจ้งให้อาจารย์ประจำวิชาทราบ 
      <b>โดยมีใบรับรองแพทย์ หรือหนังสือยืนยันจากผู้ปกครองทุกครั้งที่ขาดเรียน หากไม่ปฏิบัติตาม 
      จะถูกนับว่าขาดเรียน</b>ครั้งนั้น</p>
      <p>• กรณีที่นักศึกษาขาดสอบไล่ นักศึกษาจะได้รับเกรด F ในกระบวนวิชานั้น</p>
      </div>
      <p><b>การประเมินผลการเรียน</b> จะพิจารณาระดับผลการเรียนแบบอิงเกณฑ์ ดังนี้</p>
      
${sortedGrading.map(g => {
  let text = '';
  // ✅ กรณี A (>=)
  if (Number(g.min) >= 80) {
    text = `≥ ${Number(g.min).toFixed(2)} %`;
  }
  // ✅ กรณี F (<=)
  else if (g.grade === 'F') {
    text = `≤ ${Number(g.max).toFixed(2)} %`;
  }
  // ✅ กรณีช่วงทั่วไป
  else {
    text = `${Number(g.min).toFixed(2)} – ${Number(g.max).toFixed(2)} %`;
  }
  return `
    <div style="
      display:flex;
      margin-left: 120px;
      justify-content:space-between;
      width:250px;
      padding:2px 0;
    ">
      <div>${text}</div>
      <div>${g.grade}</div>
    </div>
  `;
}).join('')}
${note ? `<div style="text-indent: 40px; margin-top: 10px;">${note}</div>` : ''}
      <div class="heading">
      <p><b>แนวทางการอุทธรณ์ของนักศึกษา/ผู้เรียน Appeal procedure</b></p>
      </div>
      <p style="text-indent: 40px; text-align: justify;">
      นักศึกษาสามารถทำเรื่องอุทธรณ์ผลการเรียนโดย Download แบบคำร้อง (ใช้คำร้องทั่วไป) ได้ที่ระบบ
e-registra และยื่นคำร้องได้ที่สำนักงานฝ่ายวิชาการและวิจัยภายใน 10 วันทำการ หลังจากประกาศผลการ
เรียนในระบบ e-registra</p>

    </div>
  `;
};

module.exports = { renderSection3 };