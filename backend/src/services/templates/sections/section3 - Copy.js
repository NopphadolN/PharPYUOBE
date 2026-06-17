const renderSection3 = (data) => {
let { books, evaluations, grading } = data;
// ✅ FIX books
if (typeof books === 'string') {
  try {
    books = JSON.parse(books);
  } catch {
    books = [];
  }
}
// ✅ FIX grading
if (typeof grading === 'string') {
  try {
    grading = JSON.parse(grading);
  } catch {
    grading = [];
  }
}
  
  return `
    <div class="section">
      <p><b>8. รายชื่อหนังสือประกอบการสอน</b></p>
${(Array.isArray(books) && books.length ? books : ['-']).map((b, i) => `
  <div>${i + 1}. ${b}</div>
`).join('')}

      <p><b>9. สัดส่วนการให้คะแนน</b></p>
      <table>
        <tr>
          <th>รายการ</th>
          <th>CLO</th>
          <th>คะแนน</th>
          <th>หัวข้อ</th>
          <th>เครื่องมือ</th>
          <th>สัปดาห์</th>
        </tr>
${(data.evaluations || []).map(e => `
<tr>
  <td>${e.name}</td>
  <td>${e.clo_code || '-'}</td>
  <td>${e.total}</td>
  <td>${e.topics || '-'}</td>
  <td>${e.tool || '-'}</td>
  <td>${e.week || '-'}</td>
</tr>
`).join('')}
      </table>
      
      <p><b>10. เกณฑ์การประเมินผล</b></p>
      <div style="text-indent: 40px; justify-content:space-between;">
      <p>• ในกรณีที่ไม่สามารถมาเข้าชั้นเรียน นักศึกษาต้องแจ้งให้อาจารย์ประจำวิชาทราบ 
      โดยมีใบรับรองแพทย์ หรือหนังสือยืนยันจากผู้ปกครองทุกครั้งที่ขาดเรียน หากไม่ปฏิบัติตาม 
      จะถูกนับว่าขาดเรียนครั้งนั้น</p>
      <p>• กรณีที่นักศึกษาขาดสอบไล่ นักศึกษาจะได้รับเกรด F ในกระบวนวิชานั้น</p>
      <p>การประเมินผลการเรียน จะพิจารณาระดับผลการเรียนแบบอิงเกณฑ์ ดังนี้</p>
      </div>

${(Array.isArray(grading) && grading.length ? grading : []).map(g => `
  <div>${g.grade}: ${g.min} - ${g.max}</div>
`).join('')}

      <p><b>แนวทางการอุทธรณ์ของนักศึกษา/ผู้เรียน Appeal procedure</b></p>
      <p style="text-indent: 40px;" justify-content:space-between;>
      นักศึกษาสามารถทำเรื่องอุทธรณ์ผลการเรียนโดย Download แบบคำร้อง (ใช้คำร้องทั่วไป) ได้ที่ระบบ
e-registra และยื่นคำร้องได้ที่สำนักงานฝ่ายวิชาการและวิจัยภายใน 10 วันทำการ หลังจากประกาศผลการ
เรียนในระบบ e-registra</p>

    </div>
  `;
};

module.exports = { renderSection3 };