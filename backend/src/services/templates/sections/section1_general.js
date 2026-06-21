const renderSection1 = (data) => {
  const { course, instructors } = data;

  return `
  <div class="section">
    <h2>หมวดที่ 1 ข้อมูลทั่วไป</h2>

    <p><strong>รหัส:</strong> ${course.code_th}</p>
    <p><strong>ชื่อวิชา:</strong> ${course.name_th}</p>
    <p><strong>หน่วยกิต:</strong> ${course.credits}</p>

    <p><strong>อาจารย์:</strong></p>
    <ul>
      ${instructors.map(i => `<li>${i.name_th}</li>`).join('')}
    </ul>
  </div>
  `;
};

module.exports = { renderSection1 };