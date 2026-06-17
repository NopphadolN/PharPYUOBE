const PDFDocument = require('pdfkit');
require('pdfkit-table');
const path = require('path');

const generatePlanPDF = async (data, res) => {

  const { 
    course, 
    clos, 
    contents, 
    instructors, 
    evaluations, 
    books, 
    grading 
  } = data;

  const lecture = contents.filter(c => c.type === 'lecture');
  const lab = contents.filter(c => c.type === 'lab');

  const totalLecture = lecture.reduce((sum, r) => sum + Number(r.hours), 0);
  const totalLab = lab.reduce((sum, r) => sum + Number(r.hours), 0);

  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);

  doc.registerFont(
    'THSarabun',
    path.join(__dirname, '../../fonts/THSarabun.ttf')
  );

  doc.registerFont(
    'THSarabunBold',
    path.join(__dirname, '../../fonts/THSarabunBold.ttf')
  );

  // ✅ HEADER
  doc.font('THSarabunBold').fontSize(18);
  doc.text('ประมวลรายวิชา หลักสูตรเภสัชศาสตร์', { align: 'center' });
  doc.text('สาขาการบริบาลทางเภสัชกรรม', { align: 'center' });
  doc.text('คณะเภสัชศาสตร์ มหาวิทยาลัยพายัพ', { align: 'center' });

  doc.moveDown();

  // ✅ SECTION 1–4
  doc.font('THSarabun').fontSize(16);

  doc.text(`1. รหัสรายวิชา: ${course.code_th} ${course.name_th}`);
  doc.text(`${course.code_en} ${course.name_en}`);
  doc.text(`หน่วยกิต ${course.credits}`);

  doc.moveDown();

  doc.text(`2. เงื่อนไขที่ต้องผ่านก่อน: ${course.prerequisite || '-'}`);
  doc.text(`3. ประเภทของรายวิชา: ${course.course_type || '-'}`);
  doc.text(`4. คำอธิบายลักษณะกระบวนวิชา: ${course.description || '-'}`);

  doc.moveDown();

  // ✅ SECTION 5
  doc.text('5. อาจารย์ผู้สอน');

  instructors.forEach(i => {
    doc.text(`   - ${i.name_th}`);
  });

  doc.moveDown();

  // ✅ SECTION 6
  doc.text('6. ผลลัพธ์การเรียนรู้ระดับรายวิชา');

  clos.forEach((c, i) => {
    doc.text(`6.${i + 1} ${c.code}`);
    doc.text(`     ${c.description}`);
  });

  doc.moveDown();

  // ✅ SECTION 7
  doc.text('7. เนื้อหากระบวนวิชา (บรรยาย)');

  await doc.table({
    headers: ['วันที่', 'ลำดับ', 'เนื้อหา', 'ชม'],
    rows: lecture.map(r => [
      r.date,
      r.order,
      r.topic,
      r.hours
    ])
  });

  doc.text(`รวมชั่วโมง: ${totalLecture}`);

  if (lab.length > 0) {
    doc.moveDown();

    doc.text('ปฏิบัติการ');

    await doc.table({
      headers: ['วันที่', 'ลำดับ', 'เนื้อหา', 'ชม'],
      rows: lab.map(r => [
        r.date,
        r.order,
        r.topic,
        r.hours
      ])
    });

    doc.text(`รวมชั่วโมง: ${totalLab}`);
  }

  doc.moveDown();

  // ✅ SECTION 8
  doc.text('8. รายชื่อหนังสือ');

  (books || []).forEach((b, i) => {
    doc.text(`${i + 1}. ${b}`);
  });

  doc.moveDown();

  // ✅ SECTION 9
  doc.text('9. สัดส่วนการให้คะแนน');

  await doc.table({
    headers: ['การประเมิน', 'คะแนน', 'เครื่องมือ', 'สัปดาห์'],
    rows: (evaluations || []).map(r => [
      r.name,
      r.total,
      r.tool || '-',
      r.week || '-'
    ])
  });

  doc.moveDown();

  // ✅ SECTION 10
  doc.text('10. เกณฑ์การประเมินผล');

  (grading || []).forEach(g => {
    doc.text(`${g.grade}: ${g.min} - ${g.max}`);
  });

  doc.addPage();

  doc.text('แนวทางการอุทธรณ์ของนักศึกษา');

  doc.end();
};

module.exports = { generatePlanPDF };