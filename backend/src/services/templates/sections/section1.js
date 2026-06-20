const renderSection1 = (data) => {

  const { course, clos, instructors, guestTeachers, user_id, owner_id } = data;

  return `
  <div class="section">
    
    <div style="display: flex; justify-content: space-between;">
      <div>
      <b>1. รหัสรายวิชา:</b>
      <span style="margin-left:20px;">${course.code_th} ${course.name_th}
      </div>

      <div>
      หน่วยกิต ${course.credits} (${course.credit_format || '-'})
      </div>
    </div>

    <div style="text-indent: 120px;">${course.code_en} 
      ${course.name_en}</div>

    <p><b>2. เงื่อนไขที่ต้องผ่านก่อน:</b> ${course.prerequisite || '-'}</p>
    <p><b>3. ประเภทของรายวิชา:</b> ${course.course_type || '-'}</p>
    <p><b>4. คำอธิบายลักษณะกระบวนวิชา:</b></p>   
            <div style="text-indent: 40px; justify-content:space-between;">
            ${course.description || '-'}
            </div>

    <p><b>5. อาจารย์ผู้สอน:</b></p>
    <p style="margin-left: 40px;"><b>5.1 อาจารย์ผู้รับผิดชอบ</b>
    <span style="margin-left:20px;">
    ${instructors.find(i => i.id === owner_id)?.name_th || '-'}
    </span></p>
    <p style="margin-left: 120px;"><b>ประเภท</b>  อาจารย์ประจำ</p>
    
    <p style="margin-left: 40px;"><b>5.2 อาจารย์ผู้สอน</p></b></p>
    ${instructors.map(i => `
      <div style="text-indent: 80px;">- ${i.name_th}</div>`).join('')}
      <p style="margin-left: 120px;"><b>ประเภท</b>  อาจารย์ประจำ</p>

    ${(Array.isArray(guestTeachers) && guestTeachers.length > 0)
    ? `
    ${guestTeachers.map(g => `
      <div style="text-indent: 80px; margin-top:15px;">- ${g}</div>`).join('')}
      <p style="margin-left: 120px;"><b>ประเภท</b> อาจารย์พิเศษ</p>
      `
    : ''
    }

    <p><b>6. ผลลัพธ์การเรียนรู้</b></p>
    <p style="margin-left: 40px;">
    เมื่อสิ้นสุดการเรียนการสอนแล้ว นักศึกษาที่สำเร็จการศึกษาในรายวิชา สามารถ<p>
    ${clos.map((c, i) => `
      <div style="text-indent: 40px;"><b>6.${i+1}. ${c.code}</b>
      ${c.description}</div>
    `).join('')}

  </div>
  `;
};

module.exports = { renderSection1 };