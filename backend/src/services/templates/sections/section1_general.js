const renderSection1 = (data) => {
  const c = data.course || {};
  const { instructors, guestTeachers, user_id, owner_id } = data;
  return `
    <div style="border: 1px solid #000000; padding: 3px; margin: 20px 0;">
      <div style="border: 4px solid #000000; padding: 8px 0; text-align: center;">
        <h1 style="margin: 0; font-size: 18px;">รายละเอียดของรายวิชา</h1>
      </div>
    </div>
    <p><strong>ชื่อสถาบันอุดมศึกษา</strong>
    <span style="margin-left:10px;">มหาวิทยาลัยพายัพ</span></p>
    <p><strong>วิทยาเขต/คณะ/ภาควิชา/สาขาวิชา</strong>
    <span style="margin-left:10px;">คณะเภสัชศาสตร์</span></p>
    
    <div style="border: 1px solid #000000; padding: 3px; margin: 20px 0;">
      <div style="border: 4px solid #000000; padding: 8px 0; text-align: center;">
        <h2 style="margin: 0; font-size: 16px;">หมวดที่ 1 ข้อมูลทั่วไป</h2>
      </div>
    </div>
    <p><strong>1. รหัสและชื่อรายวิชา</strong></p>
        <p style="margin-left: 40px;">${c.code_th || '-'} ${c.name_th || '-'}</p>
        <p style="margin-left: 40px;">${c.code_en || '-'} ${c.name_en || '-'}</p>

    <p><strong>2. จำนวนหน่วยกิต</strong></p> 
        <p style="margin-left: 40px;">${c.credits || '-'} หน่วยกิต (${c.credit_format || '-'})</p>

    <p><strong>3. หลักสูตรและประเภทของรายวิชา</strong></p>
        <p style="margin-left: 40px;">ชื่อหลักสูตร
        <span style="margin-left:20px;">เภสัชศาสตรบัณฑิต สาขาวิชาการบริบาลทางเภสัชกรรม (หลักสูตรปรับปรุง พ.ศ.2568)</span></p>
        <p style="margin-left: 40px;">ประเภทของรายวิชา
        <span style="margin-left:80px;">${c.course_type || '-'}</span></p>

    <p><strong>4. อาจารย์ผู้รับผิดชอบรายวิชาและอาจารย์ผู้สอน</strong></p>
        <p style="margin-left: 40px;">อาจารย์ผู้รับผิดชอบรายวิชา
        <span style="margin-left:5px;">
    ${instructors.find(i => i.id === c.owner_id)?.name_th || '-'}
    </span></p>
        <p style="margin-left: 40px;">อาจารย์ผู้สอน</p>
            <p style="margin-left: 80px;">ภาคบรรยาย</p>    
            ${instructors.map(i => `
            <div style="text-indent: 120px;">${i.name_th}</div>`).join('')}
    ${(Array.isArray(guestTeachers) && guestTeachers.length > 0)
    ? `
    ${guestTeachers.map(g => `
      <div style="margin-left: 120px;">${g}</div>`).join('')}
      `
    : ''
    }
            <p style="margin-left: 80px;">ภาคปฏิบัติ</p>

    <p><strong>5. ภาคการศึกษา / ชั้นปีที่เรียน</strong> 
        <p style="margin-left: 40px;">ภาคการศึกษาที่ ${c.semester || '-'} ปีการศึกษา ${c.year || '-'}</p>
        <p style="margin-left: 40px;">ชั้นปีที่........</p>

    <p><strong>6. รายวิชาที่ต้องเรียนมาก่อน (Pre-requisite) (ถ้ามี)</strong></p> 
        <p style="margin-left: 40px;">${c.prerequisite || '-'}</p>
    <p><strong>7. รายวิชาที่ต้องเรียนพร้อมกัน (Co-requisites) (ถ้ามี)</strong></p>
        <p style="margin-left: 40px;"> - </p>
    <p><strong>8. สถานที่เรียน</strong></p>
        <p style="margin-left: 40px;">คณะเภสัชศาสตร์ มหาวิทยาลัยพายัพ</p>
    <p><strong>9. วันที่จัดทำหรือปรับปรุงรายละเอียดของรายวิชาครั้งล่าสุด</strong></p>
        <p style="margin-left: 40px;"> - </p>
  `;

};

module.exports = { renderSection1 };