const renderSection1 = (data) => {
  const c = data.course || {};
  const { instructors, guestTeachers, user_id, owner_id } = data;
  return `
    <div style="border: 3px solid #000000; padding: 3px; margin: 20px 0;">
      <div style="border: 1px solid #000000; padding: 10px 0; text-align: center;">
        <h1 style="margin: 0; font-size: 22px;">รายละเอียดของรายวิชา</h1>
      </div>
    </div>
    <p><b>ชื่อสถาบันอุดมศึกษา</b>
    <span style="margin-left:10px;">มหาวิทยาลัยพายัพ</span></p>
    <p><b>วิทยาเขต/คณะ/ภาควิชา/สาขาวิชา</b>
    <span style="margin-left:10px;">คณะเภสัชศาสตร์</span></p>
    
    <div style="border: 3px solid #000000; padding: 3px; margin: 20px 0;">
      <div style="border: 1px solid #000000; padding: 10px 0; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">หมวดที่ 1 ข้อมูลทั่วไป</h2>
      </div>
    </div>
    <p><b>1. รหัสและชื่อรายวิชา</b></p>
        <p style="margin-left: 80px;">${c.code_th || '-'} ${c.name_th || '-'}</p>
        <p style="margin-left: 80px;">${c.code_en || '-'} ${c.name_en || '-'}</p>

    <p><b>2. จำนวนหน่วยกิต</b></p> 
        <p style="margin-left: 80px;">${c.credits || '-'} หน่วยกิต (${c.credit_format || '-'})</p>

    <p><b>3. หลักสูตรและประเภท:</b></p>
        <p style="margin-left: 80px;">ชื่อหลักสูตร
        <span style="margin-left:80px;">เภสัชศาสตรบัณฑิต สาขาวิชาการบริบาลทางเภสัชกรรม (หลักสูตรปรับปรุง พ.ศ.2568)</span></p>
        <p style="margin-left: 80px;">ประเภทของรายวิชา
        <span style="margin-left:40px;">${c.course_type || '-'}</span></p>

    <p><b>4. อาจารย์ผู้รับผิดชอบรายวิชาและอาจารย์ผู้สอน</b></p>
        <p style="margin-left: 80px;">อาจารย์ผู้รับผิดชอบรายวิชา
        <span style="margin-left:5px;">
    ${instructors.find(i => i.id === c.owner_id)?.name_th || '-'}
    </span></p>
        <p style="margin-left: 80px;">อาจารย์ผู้สอน</p>
            <p style="margin-left: 120px;">ภาคบรรยาย</p>    
            ${instructors.map(i => `
            <div style="text-indent: 100px;">- ${i.name_th}</div>`).join('')}
    ${(Array.isArray(guestTeachers) && guestTeachers.length > 0)
    ? `
    ${guestTeachers.map(g => `
      <div style="text-indent: 100px;">- ${g}</div>`).join('')}
      `
    : ''
    }
            <p style="margin-left: 120px;">ภาคปฏิบัติ</p>
    <p><b>5. ภาคการศึกษา / ชั้นปีที่เรียน</b> 
        <p style="margin-left: 80px;">ภาคการศึกษาที่ ${c.semester || '-'} ปีการศึกษา ${c.year || '-'}</p>
        <p style="margin-left: 80px;">ชั้นปีที่........</p>

    <p><b>6. รายวิชาที่ต้องเรียนมาก่อน (Pre-requisite) (ถ้ามี)</b></p> 
        <p style="margin-left: 80px;">${c.prerequisite || '-'}</p>
    <p><b>7. รายวิชาที่ต้องเรียนพร้อมกัน (Co-requisites) (ถ้ามี)</b></p>
        <p style="margin-left: 80px;"> - </p>
    <p><b>8. สถานที่เรียน</b></p>
        <p style="margin-left: 80px;">คณะเภสัชศาสตร์ มหาวิทยาลัยพายัพ</p>
    <p><b>9. วันที่จัดทำหรือปรับปรุงรายละเอียดของรายวิชาครั้งล่าสุด</b></p>
        <p style="margin-left: 80px;"> - </p>
  `;

};

module.exports = { renderSection1 };