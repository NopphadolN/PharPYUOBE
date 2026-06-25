const renderSection8 = (data) => {

  const { revision_note = '-' } = data;

  return `
  <div class="section page-break">

    <!-- ✅ หมวดที่ 7 -->
    <div style="border: 1px solid #000; padding: 3px; margin: 20px 0;">
      <div style="border: 4px solid #000; padding: 8px; text-align:center;">
        <h2 style="margin:0; font-size: 16px;">หมวดที่ 7 การประเมินและปรับปรุงการดำเนินการของรายวิชา</h2>
      </div>
    </div>

    <p><strong>1. กลยุทธ์การประเมินประสิทธิผลของรายวิชาโดยนักศึกษา</strong></p>
    <p style="margin-left:40px;">
      ให้นักศึกษาประเมินการสอนของอาจารย์ผู้สอนโดยใช้แบบประเมินผลการสอนผ่านระบบออนไลน์
      และเสนอแนะเพื่อการปรับปรุงรายวิชา
    </p>

    <p><strong>2. กลยุทธ์การประเมินการสอน</strong></p>
    <p style="margin-left:40px;">
      ประเมินจากผลการเรียนของนักศึกษา การสังเกตพฤติกรรมการเรียนรู้ของนักศึกษา
      และจากการประชุมแลกเปลี่ยนความคิดเห็นของคณาจารย์ผู้สอน
    </p>

    <p><strong>3. การปรับปรุงการสอน</strong></p>

    <!-- ✅ TABLE (dynamic) -->
    <table style="width:100%; border-collapse: collapse; font-size:14px; margin-top:10px;">
      <tr>
        <th style="border:1px solid #000;">ประเด็นที่ทำการปรับปรุง</th>
      </tr>
      <tr>
        <td style="border:1px solid #000; vertical-align:top;">
          ${revision_note || '-'}
        </td>
      </tr>
    </table>

    <p><strong>4. การทวนสอบมาตรฐานผลสัมฤทธิ์ของนักศึกษาในรายวิชา</strong></p>
    <p style="margin-left:40px;">
      มีการทวนสอบผลสัมฤทธิ์ของนักศึกษาโดยการตรวจสอบข้อสอบและเกณฑ์การประเมิน
      รวมถึงการประชุมร่วมกันของอาจารย์ผู้สอนเพื่อพิจารณาความเหมาะสมของผลการเรียน
    </p>

    <p><strong>5. การดำเนินการทบทวนและการวางแผนปรับปรุงประสิทธิผลของรายวิชา</strong></p>
    <p style="margin-left:40px;">
      มีการวิเคราะห์ผลการประเมินรายวิชาและนำผลที่ได้มาปรับปรุงการจัดการเรียนการสอน
      ในปีการศึกษาถัดไป
    </p>


    <!-- ✅ หมวดที่ 8 -->
    <div style="border: 1px solid #000; padding: 3px; margin: 30px 0 20px 0;">
      <div style="border: 4px solid #000; padding: 8px; text-align:center;">
        <h2 style="margin:0; font-size: 16px;">หมวดที่ 8 การบูรณาการของรายวิชา</h2>
      </div>
    </div>

    <p><strong>1. การบูรณาการกับรายวิชาอื่น</strong></p>
    <p style="margin-left:40px;">
      รายวิชานี้มีการบูรณาการองค์ความรู้กับรายวิชาที่เกี่ยวข้องเพื่อเสริมสร้างความเข้าใจ
      และการนำไปประยุกต์ใช้ในทางปฏิบัติ
    </p>

    <p><strong>2. การบูรณาการกับการวิจัย/บริการวิชาการ</strong></p>
    <p style="margin-left:40px;">
      มีการเชื่อมโยงเนื้อหากับงานวิจัยและการบริการวิชาการเพื่อให้นักศึกษาได้เห็นการประยุกต์ใช้จริง
    </p>

    <p><strong>3. การบูรณาการกับศิลปะและวัฒนธรรม</strong></p>
    <p style="margin-left:40px;">
      ส่งเสริมให้นักศึกษาตระหนักถึงคุณค่าทางศิลปะและวัฒนธรรม
      และสามารถนำไปประยุกต์ใช้กับวิชาชีพได้อย่างเหมาะสม
    </p>

    <p><strong>4. การบูรณาการกับสิ่งแวดล้อม</strong></p>
    <p style="margin-left:40px;">
      สอดแทรกแนวคิดด้านสิ่งแวดล้อมและความยั่งยืนในการจัดการเรียนการสอน
    </p>

  </div>
  `;
};

module.exports = { renderSection8 };
``