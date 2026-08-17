const renderSection1 = (data) => {

  const { course, clos, subPlos, instructors, guestTeachers, user_id, owner_id, cloMappings, cloKsecMappings } = data;
  
  const getPLOCodes = (cloId) => {
  const mapping = cloMappings.find(
    m => String(m.cloId) === String(cloId)
  );
  if (!mapping) return '';
  return mapping.subPloIds
    .map(id => {
      const subPlo = subPlos.find(
        p => String(p.id) === String(id)
      );
      if (!subPlo) return null;
      return subPlo.code.replace(/^SubPLO/i, 'PLO');
    })
    .filter(Boolean)
    .join(', ');
};

  const getKSECCodes = (cloId) => {
  const mapping = cloKsecMappings.find(
    m => String(m.cloId) === String(cloId)
  );
  if (!mapping) return '';
  return mapping.ksecCodes.join(', ');
};

  return `
  <div class="section">
    
    <div style="display: flex; justify-content: space-between;">
      <div>
      <b>1. รหัสรายวิชา:</b>
      <span style="margin-left:15px;">${course.code_th} ${course.name_th}
      </div>

      <div>
      หน่วยกิต ${course.credits} (${course.credit_format || '-'})
      </div>
    </div>

    <div style="text-indent: 117px;">${course.code_en} 
      ${course.name_en}</div>

    <p><b>2. เงื่อนไขที่ต้องผ่านก่อน:</b> ${course.prerequisite || '-'}</p>
    <p><b>3. ประเภทของรายวิชา:</b> ${course.course_type || '-'}</p>
    <p><b>4. คำอธิบายลักษณะกระบวนวิชา:</b></p>   
            <div style="text-indent: 40px; text-align: justify; text-justify: inter-word;">
            ${course.description || '-'}
            </div>

    <p><b>5. อาจารย์ผู้สอน:</b></p>
    <p style="margin-left: 40px;"><b>5.1 อาจารย์ผู้รับผิดชอบ</b>
    <span style="margin-left:5px;">
    ${instructors.find(i => i.id === owner_id)?.name_th || '-'}
    </span></p>
    <p style="margin-left: 120px;"><b>ประเภท</b>  อาจารย์ประจำ</p>
    
    <p style="margin-left: 40px;"><b>5.2 อาจารย์ผู้สอน</p></b></p>
    ${instructors.map(i => `
      <div style="text-indent: 120px;">${i.name_th}</div>`).join('')}
      <p style="margin-left: 120px;"><b>ประเภท</b>  อาจารย์ประจำ</p>

    ${(Array.isArray(guestTeachers) && guestTeachers.length > 0)
    ? `
    ${guestTeachers.map(g => `
      <div style="text-indent: 120px; margin-top:15px;">${g}</div>`).join('')}
      <p style="margin-left: 120px;"><b>ประเภท</b> อาจารย์พิเศษ</p>
      `
    : ''
    }
    <div class="heading">
    <p><b>6. ผลลัพธ์การเรียนรู้</b></p>
    </div>
    <p style="margin-left: 40px;">
    เมื่อสิ้นสุดการเรียนการสอนแล้ว นักศึกษาที่สำเร็จการศึกษาในรายวิชา สามารถ<p>
    ${clos.map((c, i) => {
    const ploText = getPLOCodes(c.id);
    const ksecText = getKSECCodes(c.id);
    return `
      <div style="
        text-indent:40px;
        text-align:justify;
        text-justify:inter-word;
      ">
      <b>6.${i+1}.</b>${c.description}
      (${c.code})
      ${ploText ? `(${ploText})` : ''}
      ${ksecText ? `(${ksecText})` : ''}
    </div>
    `;
    }).join('')}

  </div>
  `;
};

module.exports = { renderSection1 };