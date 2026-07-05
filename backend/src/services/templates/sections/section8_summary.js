const renderSection8 = (data) => {

  const { revision_note = '-' } = data;

  // ✅ helper checkbox
  const box = (checked) => checked ? '☑' : '☐';

  return `
  <div class="section page-break">

    <!-- ✅ หมวดที่ 7 -->
    <div style="border: 1px solid #000; padding: 3px; margin: 20px 0;">
      <div style="border: 4px solid #000; padding: 8px; text-align:center;">
        <h2 style="margin:0; font-size:23px;">
          หมวดที่ 7 การประเมินและปรับปรุงการดำเนินการของรายวิชา
        </h2>
      </div>
    </div>

    <!-- ✅ กล่องใหญ่ -->
    <div style="border:1px solid #000; padding:15px;">

      <!-- ✅ ข้อ 1 -->
      <div>
        <b>1. กลยุทธ์การประเมินประสิทธิผลของรายวิชาโดยนักศึกษา</b>
        <div style="margin-top:10px; margin-left:40px; line-height:1.4;">
          <div>${box(false)} การประเมินผลรายวิชา</div>
          <div>${box(true)} การประเมินการสอน</div>
          <div>${box(false)} การสนทนากลุ่มระหว่างผู้สอนและผู้เรียน</div>
          <div>
            ${box(true)} ข้อเสนอแนะผ่านเวบบอร์ด/ สื่อสังคมออนไลน์ 
            ที่อาจารย์ผู้สอนได้จัดทำเป็นช่องทางการสื่อสารกับนักศึกษา
          </div>
          <div>
            ${box(false)} อื่นๆ (ระบุ) 
            ............................................
          </div>
        </div>
      </div>

      <!-- ✅ เส้นแบ่ง -->
      <div style="border-top:1px solid #000; margin:15px 0;"></div>

      <!-- ✅ ข้อ 2 -->
      <div>
        <b>2. กลยุทธ์การประเมินการสอน</b>
        <div style="margin-top:10px; margin-left:40px; line-height:1.4;">
          <div>${box(false)} การประเมินการสอน</div>
          <div>${box(true)} ผลการสอบ/ ผลการเรียนรู้ของผู้เรียน</div>
          <div>${box(false)} การสังเกตพฤติกรรมของผู้เรียน</div>
          <div>${box(true)} การทวนสอบผลประเมินการเรียนรู้</div>
          <div>
            ${box(true)} การประเมินข้อสอบโดยคณะกรรมการ โดยคณะกรรมการบริหารหลักสูตร 
            และ/หรือคณะกรรมการกำกับมาตรฐานวิชาการ
          </div>
          <div>${box(false)} การสังเกตการณ์สอนของผู้ร่วมทีมการสอน</div>
          <div>
            ${box(false)} อื่นๆ (ระบุ) 
            ............................................
          </div>
        </div>
      </div>

    <!-- ✅ เส้นแบ่ง -->
    <div style="border-top:1px solid #000; margin:15px 0;"></div>

<!-- ✅ ข้อ 3 -->
<div style="margin-top:20px;">
  <b>3. การปรับปรุงการสอน</b>
  <!-- ✅ checkbox ด้านบน -->
  <div style="margin-top:10px; margin-left:40px; line-height:1.4;">
    <div>☐ การประชุม/สัมมนาการจัดการเรียนการสอน</div>
    <div>☑ การประชุมทีมผู้สอน</div>
    <div>☐ การวิจัยในและนอกชั้นเรียน</div>
    <div>☑ ประชุมกรรมการบริหารหลักสูตร</div>
    <div>☐ อื่นๆ (ระบุ) ..............................................</div>
  </div>
  <!-- ✅ ตารางด้านล่าง -->
  <table style="width:100%; border-collapse: collapse; margin-top:10px;">
    <tr>
      <th style="border:1px solid #000; width:50%;">
        ประเด็นที่ทำการปรับปรุง
      </th>
      <th style="border:1px solid #000;">
        ที่มาของข้อมูลที่นำมาปรับปรุง
      </th>
    </tr>
    <tr>
      <!-- ✅ revision_note -->
      <td style="border:1px solid #000; vertical-align:top; padding:5px;">
        ${revision_note || '-'}
      </td>
      <!-- ✅ checkbox ด้านขวา -->
      <td style="border:1px solid #000; vertical-align:top; padding:10px; line-height:1.4;">
        <div>☑ รายงานผลการดำเนินการของรายวิชา (มคอ.5)</div>
        <div>☐ ฝึกงาน/สหกิจศึกษา/แหล่งฝึก</div>
        <div>☐ ผู้มีส่วนได้ส่วนเสียอื่นๆ</div>
      </td>
    </tr>
  </table>
</div>

    <!-- ✅ เส้นแบ่ง -->
    <div style="border-top:1px solid #000; margin:15px 0;"></div>

      <!-- ✅ ข้อ 4 -->
      <div>
        <b>4. การทวนสอบมาตรฐานผลสัมฤทธิ์ของนักศึกษา</b>
        <div style="margin-top:10px; margin-left:40px; line-height:1.4;">
          <div>${box(true)} ประเมินรายละเอียดรายวิชาว่าผลการเรียนรู้ที่กำหนดสอดคล้องกับความรับผิดชอบในหลักสูตร</div>
          <div>${box(true)} ประเมินข้อสอบของรายวิชาว่าครอบคลุมผลการเรียนรู้ตามที่กำหนดไว้ในรายละเอียดวิชา</div>
          <div>${box(true)} คณะกรรมการวิชาการประจำสาขาวิชาพิจารณาความเหมาะสมของข้อสอบให้เป็นไปตามแผนการสอน และมีการประเมินข้อสอบโดยผู้ทรงคุณวุฒิภายนอก</div>
          <div>${box(true)} มีระบบประกันคุณภาพในการดำเนินการทวนสอบมาตรฐานผลการเรียนรู้และรายงานผล</div>
          <div>${box(false)} อื่นๆ (ระบุ) 
            ............................................
          </div>
        </div>
      </div>
    
    <!-- ✅ เส้นแบ่ง -->
    <div style="border-top:1px solid #000; margin:15px 0;"></div>

      <!-- ✅ ข้อ 5 -->
      <div>
        <b>5. การดำเนินการทบทวนและการวางแผนปรับปรุงประสิทธิผลของรายวิชา</b>
        <div style="margin-top:10px; margin-left:40px; line-height:1.4;">
          <div>${box(false)} ปรับปรุงกระบวนวิชา ตามข้อเสนอแนะและผลการทวนสอบมาตรฐานผลสัมฤทธิ์ตามข้อ 4</div>
          <div>${box(true)} ปรับปรุงกระบวนวิชา ตามผลการประเมินผู้สอนโดยนักศึกษา</div>
          <div>${box(false)} การประชุมร่วมกับคณะกรรมการบริหารหลักสูตรเพื่อทบทวนกลยุทธ์การสอน วิธีการวัดและการประเมินผลการเรียนรู้</div>
          <div>
            ${box(true)} นำข้อมูลที่ได้จากรายงานผลการดำเนินการของรายวิชา (มคอ.5) ไปปรับปรุงรายละเอียดของรายวิชา (มคอ.3) ในภาคการศึกษาถัดไป
          </div>
          <div>${box(false)} ปรับปรุงกระบวนวิชาในช่วงเวลาการปรับปรุงหลักสูตร</div>
          <div>
            ${box(false)} อื่นๆ (ระบุ) 
            ............................................
          </div>
        </div>
      </div>
    </div>  

    <!-- ✅ หมวดที่ 8 -->
    <div style="border: 1px solid #000; padding: 3px; margin: 30px 0 20px 0;">
      <div style="border: 4px solid #000; padding: 8px; text-align:center;">
        <h2 style="margin:0; font-size:23px;">
          หมวดที่ 8 การบูรณาการของรายวิชา
        </h2>
      </div>
    </div>
        <p>รายวิชามีการบูรณาการกับ</p>
        <td style="border:1px solid #000;">
          ☐ งานวิจัย...........................................<br>
          ☐ การบริการวิชาการ....................................<br>
          ☐ ทำนุบำรุงศิลปวัฒนธรรม................................
        </td>

  </div>
  `;
};

module.exports = { renderSection8 };