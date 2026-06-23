const renderSection2 = (data) => {
  const { clos } = data;

  return `
  <div class="section">
    <div style="border: 2px solid #000000; padding: 3px; margin: 20px 0;">
      <div style="border: 5px solid #000000; padding: 10px 0; text-align: center;">
        <h2 style="margin: 0; font-size: 24px;">หมวดที่ 2 ผลลัพธ์การเรียนรู้ระดับรายวิชา</h2>
      </div>
    </div>
<p>เมื่อสิ้นสุดการเรียนการสอนแล้ว นักศึกษาที่สำเร็จการศึกษาในรายวิชา สามารถ (CLOs)<p>
    ${clos.map((c,i)=>`
      <p style="margin-left: 80px;">${i+1}. ${c.description}</p>
    `).join('')}
  </div>
  `;
};

module.exports = { renderSection2 };