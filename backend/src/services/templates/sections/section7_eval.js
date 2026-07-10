const renderSection7 = (data) => {

  let { books, courseEvaluations, grading, courseContents = [], clos = [], note } = data;

  // ✅ parse
  if (typeof books === 'string') {
    try { books = JSON.parse(books); } catch { books = []; }
  }

  if (typeof grading === 'string') {
    try { grading = JSON.parse(grading); } catch { grading = []; }
  }

  const evalList = Array.isArray(courseEvaluations) ? courseEvaluations : [];

const getCLOCodes = (e) => {
  const cloIds = e.clo_ids || e.cloIds || [];
  return cloIds
    .map(cloId =>
      clos.find(c => String(c.id) === String(cloId))?.code
    )
    .filter(Boolean)
    .join(', ');
};

  // ✅ format content range
  const formatContentRange = (ids) => {

    let numbers = ids
      .map(cid => {
        const c = courseContents.find(x =>
          String(x.order) === String(cid) ||
          String(x.id) === String(cid)
        );
        return c ? Number(c.order) : Number(cid);
      })
      .filter(n => !isNaN(n));

    numbers = [...new Set(numbers)].sort((a, b) => a - b);

    const result = [];
    let start = numbers[0];
    let prev = numbers[0];

    for (let i = 1; i <= numbers.length; i++) {
      const curr = numbers[i];

      if (curr === prev + 1) {
        prev = curr;
        continue;
      }

      result.push(start === prev ? `${start}` : `${start}–${prev}`);
      start = curr;
      prev = curr;
    }

    return result.join(', ') || '-';
  };

  // ✅ total
  const totalEval = evalList.reduce(
    (sum, e) => sum + Number(e.total || 0), 0
  );

  // ✅ grading sort
  const gradeOrder = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];

  const sortedGrading = Array.isArray(grading)
    ? [...grading].sort(
        (a, b) => gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade)
      )
    : [];

  return `
  <div class="section">
  <div class="heading">
    <p><strong>2. แผนการประเมินผลการเรียนรู้</strong></p>
  </div>
<table style="table-layout:fixed;">
<thead>
<tr>
  <th style="width:16%;">
    วิธีการประเมิน
  </th>
  <th style="width:18%;">
    ผลลัพธ์การเรียนรู้ที่คาดหวังของรายวิชา<br>
    (CLOs)
  </th>
  <th style="width:22%;">
    หัวข้อที่ประเมิน
  </th>
  <th style="width:25%;">
    การวัดผลประเมินผล/<br>
    เครื่องมือที่ใช้ในการวัดผล<br>
  </th>
  <th style="width:8%;">
    สัปดาห์ที่<br>
    ประเมิน
  </th>
  <th style="width:11%;">
    สัดส่วนการ<br>
    ประเมินผล (%)
  </th>
</tr>
</thead>

<tbody>
${evalList.map(e => {
  const cloText = getCLOCodes(e) || '-';
  const lectureText = formatContentRange(
    e.content_ids_lecture || []
  );
  const labText = formatContentRange(
    e.content_ids_lab || []
  );
  let topicText = '-';
  if (
    lectureText !== '-' &&
    labText !== '-'
  ) {
    topicText =
      `${lectureText} (บรรยาย)<br>${labText} (ปฏิบัติ)`;
  }
  else if (lectureText !== '-') {
    topicText = `${lectureText} (บรรยาย)`;
  }
  else if (labText !== '-') {
    topicText = `${labText} (ปฏิบัติ)`;
  }
  return `

  <tr style="vertical-align:top;">
    <td style="
      text-align:center;
    ">
      ${e.name || '-'}
    </td>
    <td style="
      text-align:center;
    ">
      ${cloText}
    </td>
    <td style="
      text-align:center;
    ">
      ${topicText}
    </td>
    <td style="
      text-align:center;
    ">
      ${e.tool || '-'}
    </td>
    <td style="
      text-align:center;
    ">
      ${e.week || '-'}
    </td>
    <td style="
      text-align:center;
    ">
      ${e.total ?? '-'}
    </td>
  </tr>
  `;
}).join('')}
<tr style="
  font-weight:bold;
  text-align:center;
">
  <td colspan="5">
    รวม
  </td>
  <td>
    ${totalEval}
  </td>
</tr>
</tbody>
</table>

    <!-- ✅ เกณฑ์ -->
  <div class="heading">
    <p style="margin-top:20px;"><strong>3. เกณฑ์การประเมินผล</strong></p>
  </div>
    <p style="margin-left:40px;">เกณฑ์การประเมินผลใช้วิธีการตัดเกรดแบบอิงเกณฑ์ ดังนี้</p>
    ${sortedGrading.map(g => {
      let text = '';

      if (Number(g.min) >= 80) {
        text = `≥ ${Number(g.min).toFixed(2)} %`;
      } else if (g.grade === 'F') {
        text = `≤ ${Number(g.max).toFixed(2)} %`;
      } else {
        text = `${Number(g.min).toFixed(2)} – ${Number(g.max).toFixed(2)} %`;
      }

      return `
<div style="
  display:grid;
  grid-template-columns: 150px 150px;
  width:300px;
  margin-left:120px;
  padding:2px 0;
">
  <div>${text}</div>
  <div style="text-align:left;">
    ได้อักษรระดับคะแนน ${g.grade}
  </div>
</div>
      `;
    }).join('')}

    ${note ? `<div style="text-indent: 40px; 
      text-align: justify; text-justify: inter-word;">
      ${note}</div>` : ''}
    
    <div class="heading">
      <p><strong>แนวทางการอุทธรณ์ของนักศึกษา/ผู้เรียน Appeal procedure</strong></p>
    </div>
      <p style="text-indent: 40px; 
      text-align: justify; text-justify: inter-word;">
      นักศึกษาสามารถทำเรื่องอุทธรณ์ผลการเรียนโดย Download แบบคำร้อง (ใช้คำร้องทั่วไป) ได้ที่ระบบ
e-registra และยื่นคำร้องได้ที่สำนักงานฝ่ายวิชาการและวิจัยภายใน 10 วันทำการ หลังจากประกาศผลการ
เรียนในระบบ e-registra</p>

    <!-- ✅ หมวดที่ 6 -->   
    <div style="margin-top:30px;">
    <div class="heading">
      <div style="border: 1px solid #000; padding: 3px;">
        <div style="border: 4px solid #000; padding: 8px; text-align:center;">
          <h2 style="margin:0; font-size: 23px;">หมวดที่ 6 ทรัพยากรประกอบการเรียนการสอน</h2>
        </div>
      </div>
      <p><strong>1. ตำราและเอกสารหลัก</strong></p>
    </div>
      <div style="text-indent: 40px;">
        ${(Array.isArray(books) && books.length
          ? books
          : ['-']
        ).map((b, i) => `
          <div>${i + 1}. ${b}</div>
        `).join('')}
      </div>
      <p><strong>2. เอกสาร และข้อมูลสำคัญ -</strong></p>
      <p><strong>3. เอกสาร และข้อมูลแนะนำ -</strong></p>
    </div>

  </div>
  `;
};

module.exports = { renderSection7 };