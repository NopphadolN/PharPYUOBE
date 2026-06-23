const renderSection1 = (data) => {
  const c = data.course || {};
  const { instructors, guestTeachers, user_id, owner_id } = data;
  return `
    <div style="border: 2px solid #000000; padding: 3px; margin: 20px 0;">
      <div style="border: 5px solid #000000; padding: 10px 0; text-align: center;">
        <h1 style="margin: 0; font-size: 26px;">รายละเอียดของรายวิชา</h1>
      </div>
    </div>
    <p><strong>ชื่อสถาบันอุดมศึกษา</strong>
    <span style="margin-left:10px;">มหาวิทยาลัยพายัพ</span></p>
    <p><strong>วิทยาเขต/คณะ/ภาควิชา/สาขาวิชา</strong>
    <span style="margin-left:10px;">คณะเภสัชศาสตร์</span></p>
    
    <div style="border: 2px solid #000000; padding: 3px; margin: 20px 0;">
      <div style="border: 5px solid #000000; padding: 10px 0; text-align: center;">
        <h2 style="margin: 0; font-size: 24px;">หมวดที่ 1 ข้อมูลทั่วไป</h2>
      </div>
    </div>
    <p><strong>1. รหัสและชื่อรายวิชา</strong></p>
        <p style="margin-left: 80px;">${c.code_th || '-'} ${c.name_th || '-'}</p>
        <p style="margin-left: 80px;">${c.code_en || '-'} ${c.name_en || '-'}</p>

    <p><strong>2. จำนวนหน่วยกิต</strong></p> 
        <p style="margin-left: 80px;">${c.credits || '-'} หน่วยกิต (${c.credit_format || '-'})</p>

    <p><strong>3. หลักสูตรและประเภทของรายวิชา</strong></p>
        <p style="margin-left: 80px;">ชื่อหลักสูตร
        <span style="margin-left:40px;">เภสัชศาสตรบัณฑิต สาขาวิชาการบริบาลทางเภสัชกรรม (หลักสูตรปรับปรุง พ.ศ.2568)</span></p>
        <p style="margin-left: 80px;">ประเภทของรายวิชา
        <span style="margin-left:20px;">${c.course_type || '-'}</span></p>

    <p><strong>4. อาจารย์ผู้รับผิดชอบรายวิชาและอาจารย์ผู้สอน</strong></p>
        <p style="margin-left: 80px;">อาจารย์ผู้รับผิดชอบรายวิชา
        <span style="margin-left:5px;">
    ${instructors.find(i => i.id === c.owner_id)?.name_th || '-'}
    </span></p>
        <p style="margin-left: 80px;">อาจารย์ผู้สอน</p>
            <p style="margin-left: 120px;">ภาคบรรยาย</p>    
            ${instructors.map(i => `
            <div style="text-indent: 200px;">${i.name_th}</div>`).join('')}
    ${(Array.isArray(guestTeachers) && guestTeachers.length > 0)
    ? `
    ${guestTeachers.map(g => `
      <div style="text-indent: 200px;">${g}</div>`).join('')}
      `
    : ''
    }
            <p style="margin-left: 120px;">ภาคปฏิบัติ</p>
    <p><strong>5. ภาคการศึกษา / ชั้นปีที่เรียน</strong> 
        <p style="margin-left: 80px;">ภาคการศึกษาที่ ${c.semester || '-'} ปีการศึกษา ${c.year || '-'}</p>
        <p style="margin-left: 80px;">ชั้นปีที่........</p>

    <p><strong>6. รายวิชาที่ต้องเรียนมาก่อน (Pre-requisite) (ถ้ามี)</strong></p> 
        <p style="margin-left: 80px;">${c.prerequisite || '-'}</p>
    <p><strong>7. รายวิชาที่ต้องเรียนพร้อมกัน (Co-requisites) (ถ้ามี)</strong></p>
        <p style="margin-left: 80px;"> - </p>
    <p><strong>8. สถานที่เรียน</strong></p>
        <p style="margin-left: 80px;">คณะเภสัชศาสตร์ มหาวิทยาลัยพายัพ</p>
    <p><strong>9. วันที่จัดทำหรือปรับปรุงรายละเอียดของรายวิชาครั้งล่าสุด</strong></p>
        <p style="margin-left: 80px;"> - </p>
  `;

};

module.exports = { renderSection1 };