const renderSection8 = (data) => {

  const { revision_note = '-' } = data;

  return `
  <div class="section page-break">

    <!-- ✅ หมวดที่ 7 -->
    <div style="border: 1px solid #000; padding: 3px; margin: 20px 0;">
      <div style="border: 4px solid #000; padding: 8px; text-align:center;">
        <h2 style="margin:0; font-size:16px;">
          หมวดที่ 7 การประเมินและปรับปรุงการดำเนินการของรายวิชา
        </h2>
      </div>
    </div>

    <!-- ✅ ตาราง checkbox -->
    <table style="width:100%; border-collapse: collapse; font-size:14px;">

      <!-- ✅ ข้อ 1 -->
      <tr>
        <td style="border:1px solid #000; width:40%;">
          <b>1. กลยุทธ์การประเมินประสิทธิผลของรายวิชาโดยนักศึกษา</b>
        </td>
        <td style="border:1px solid #000;">
          ☐ แบบประเมินการสอนของนักศึกษา<br>
          ☐ การเสนอแนะจากนักศึกษา<br>
          ☐ อื่น ๆ ............................................................
        </td>
      </tr>

      <!-- ✅ ข้อ 2 -->
      <tr>
        <td style="border:1px solid #000;">
          <b>2. กลยุทธ์การประเมินการสอน</b>
        </td>
        <td style="border:1px solid #000;">
          ☐ ผลการเรียนของนักศึกษา<br>
          ☐ การสังเกตพฤติกรรม<br>
          ☐ การประชุมอาจารย์ผู้สอน<br>
          ☐ อื่น ๆ ............................................................
        </td>
      </tr>

      <!-- ✅ ข้อ 3 (dynamic table) -->
      <tr>
        <td style="border:1px solid #000;">
          <b>3. การปรับปรุงการสอน</b>
        </td>
        <td style="border:1px solid #000; padding:0;">
          
          <table style="width:100%; border-collapse: collapse;">
            <tr>
              <th style="border:1px solid #000;">ประเด็นที่ทำการปรับปรุง</th>
            </tr>
            <tr>
              <td style="border:1px solid #000; height:60px; vertical-align:top;">
                ${revision_note || '-'}
              </td>
            </tr>
          </table>

        </td>
      </tr>

      <!-- ✅ ข้อ 4 -->
      <tr>
        <td style="border:1px solid #000;">
          <b>4. การทวนสอบมาตรฐานผลสัมฤทธิ์ของนักศึกษา</b>
        </td>
        <td style="border:1px solid #000;">
          ☐ มีการทวนสอบข้อสอบ<br>
          ☐ มีการประชุมร่วมกันของผู้สอน<br>
          ☐ อื่น ๆ ............................................................
        </td>
      </tr>

      <!-- ✅ ข้อ 5 -->
      <tr>
        <td style="border:1px solid #000;">
          <b>5. การดำเนินการทบทวนและการวางแผนปรับปรุง</b>
        </td>
        <td style="border:1px solid #000;">
          ☐ นำผลการประเมินมาปรับปรุง<br>
          ☐ วิเคราะห์ผลการเรียน<br>
          ☐ อื่น ๆ ............................................................
        </td>
      </tr>

    </table>



    <!-- ✅ หมวดที่ 8 -->
    <div style="border: 1px solid #000; padding: 3px; margin: 30px 0 20px 0;">
      <div style="border: 4px solid #000; padding: 8px; text-align:center;">
        <h2 style="margin:0; font-size:16px;">
          หมวดที่ 8 การบูรณาการของรายวิชา
        </h2>
      </div>
    </div>

    <table style="width:100%; border-collapse: collapse; font-size:14px;">

      <tr>
        <td style="border:1px solid #000; width:40%;">
          <b>1. การบูรณาการกับรายวิชาอื่น</b>
        </td>
        <td style="border:1px solid #000;">
          ☐ มีการบูรณาการ<br>
          ☐ ไม่มี
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000;">
          <b>2. การบูรณาการกับการวิจัย/บริการวิชาการ</b>
        </td>
        <td style="border:1px solid #000;">
          ☐ มีการบูรณาการ<br>
          ☐ ไม่มี
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000;">
          <b>3. การบูรณาการกับศิลปะและวัฒนธรรม</b>
        </td>
        <td style="border:1px solid #000;">
          ☐ มีการบูรณาการ<br>
          ☐ ไม่มี
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000;">
          <b>4. การบูรณาการกับสิ่งแวดล้อม</b>
        </td>
        <td style="border:1px solid #000;">
          ☐ มีการบูรณาการ<br>
          ☐ ไม่มี
        </td>
      </tr>

    </table>

  </div>
  `;
};

module.exports = { renderSection8 };