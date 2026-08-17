// ✅ helper: แปลง credit → ชั่วโมง
const calculateHours = (creditFormat = "0-0-0") => {
  if (!creditFormat) return { lecture: 0, lab: 0, self: 0 };
  const [lec, lab, self] = creditFormat
    .replace(/\s/g, '')
    .split('-')
    .map(Number);
  return {
    lecture: (lec || 0) * 15,
    lab: (lab || 0) * 15,
    self: (self || 0) * 15
  };
};

const renderSection2 = (data) => {
  const { clos = [], subPlos, cloMappings, cloKsecMappings } = data;
  const c = data.course || {};
  // ✅ คำนวณชั่วโมง
  const hours = calculateHours(c.credit_format);

const profile = data.instructorProfile || {};

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
  <!-- ✅ หมวดที่ 2 -->
  <div class="section">
    <div class="heading">
    <div style="border: 1px solid #000; padding: 3px; margin: 20px 0;">
      <div style="border: 4px solid #000; padding: 8px 0; text-align: center;">
        <h2 style="margin: 0; font-size: 23px;">
          หมวดที่ 2 ผลลัพธ์การเรียนรู้ระดับรายวิชา
        </h2>
      </div>
    </div>
    <p>เมื่อสิ้นสุดการเรียนการสอนแล้ว นักศึกษาที่สำเร็จการศึกษาในรายวิชา สามารถ (CLOs)</p>
    </div> 
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
    
    <div class="heading">
    <div style="border: 1px solid #000; padding: 3px; margin: 20px 0;">
      <div style="border: 4px solid #000; padding: 8px 0; text-align: center;">
        <h2 style="margin: 0; font-size: 23px;">
          หมวดที่ 3 ลักษณะและการดำเนินการ
        </h2>
      </div>
    </div>
        <p><strong>1. คำอธิบายรายวิชา</strong></p>
    </div>
    <p style="text-indent:40px; 
    text-align: justify; text-justify: inter-word;">
      ${c.description || '-'}
    </p>

    <!-- ✅ ตารางชั่วโมง -->
    <div class="heading">
    <p><strong>2. จำนวนชั่วโมงที่ใช้ต่อภาคการศึกษา</strong></p>
    </div>
    <table style="width:100%; border-collapse: collapse; margin-top:10px; 
    font-size: 21px; text-align: center;">
    <thead>
      <tr>
        <td style="padding:6px">
          <b>บรรยาย</b>
        </td>
        <td style="padding:6px">
          <b>สอนเสริม</b>
        </td>
        <td style="padding:6px">
          <b>การฝึกปฏิบัติงาน ภาคสนาม/การฝึกงาน</b>
        </td>
        <td style="padding:6px">
          <b>การศึกษาด้วยตนเอง</b>
        </td>
      </tr>
    </thead>
      <tr>
        <td style="padding:6px">
          ${hours.lecture} ชั่วโมง/ภาคการศึกษา
        </td>
        <td style="padding:6px">
          ตามความต้องการของนักศึกษารายบุคคลและกลุ่มผู้เรียน
        </td>
        <td style="padding:6px">
          ${hours.lab} ชั่วโมง/ภาคการศึกษา
        </td>
        <td style="padding:6px">
          ${hours.self} ชั่วโมง/ภาคการศึกษา
        </td>
      </tr>
    </table>
    <div class="heading">
    <p><strong>3. จำนวนชั่วโมงต่อสัปดาห์ที่อาจารย์ให้คำปรึกษาและแนะนำทางวิชาการแก่นักศึกษาเป็นรายบุคคล</strong></p>
    </div>
<p style="text-indent:10px;">นักศึกษาสามารถเข้าพบอาจารย์เพื่อขอคำปรึกษาและแนะนำในเนื้อหาที่เกี่ยวข้องกับรายวิชาได้ดังนี้
<p>1. ห้องพักอาจารย์: ${profile.office || '-'}</p>
<p>2. Email: ${profile.email || '-'}</p>
<p>3. MS Teams ของรายวิชาและของอาจารย์ผู้สอนแต่ละท่าน</p>
<p>4. จัดเวลาให้คำปรึกษาเป็นรายบุคคลหรือรายกลุ่มตามความต้องการ 1 ชั่วโมงต่อสัปดาห์ (เฉพาะรายที่
ต้องการ)</p>
<p style="text-indent:10px;">วันให้คำปรึกษา: ${profile.consultation_day || '-'}</p>
<p style="text-indent:10px;">เวลา: ${profile.consultation_time || '-'}</p>
  </div>
  `;
};

module.exports = { renderSection2 };