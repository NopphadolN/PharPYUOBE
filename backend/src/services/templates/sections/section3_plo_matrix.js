// ✅ helper: convert mapping → Set
const buildMappedSet = (mappings = []) => {
  return new Set(
    mappings.map(m => String(m.subPlo).trim())
  );
};

// ✅ helper: render 1 SubPLO row
const subPloRow = (code, checks = [], mappedSet) => {

  const isMapped = mappedSet.has(code);

  const rowStyle = isMapped
    ? ''
    : 'background-color:#e0e0e0;'; // ✅ เทา

  // ✅ สร้าง cell ✓
  const cells = checks.map(v => `
    <td style="border:1px solid #000; text-align:center;">
      ${v ? '✓' : ''}
    </td>
  `).join('');

  return `
    <tr style="${rowStyle}">
      <td style="border:1px solid #000;">
        SubPLO ${code}
      </td>
      ${cells}
    </tr>
  `;
};

// ✅ helper: PLO header row
const ploHeaderRow = (label) => `
  <tr>
    <td style="border:1px solid #000;"><b>${label}</b></td>
    <td style="border:1px solid #000;"></td>
    <td style="border:1px solid #000;"></td>
    <td style="border:1px solid #000;"></td>
    <td style="border:1px solid #000;"></td>
    <td style="border:1px solid #000;"></td>
    <td style="border:1px solid #000;"></td>
  </tr>
`;


const renderSection3 = (data) => {

  const mappedSet = buildMappedSet(data.cloMappings);

  return `
  <div class="section">

    <div style="border: 2px solid #000; padding: 3px; margin: 20px 0;">
      <div style="border: 5px solid #000; padding: 10px 0; text-align: center;">
        <h2 style="margin: 0; font-size: 24px;">
          หมวดที่ 4 การพัฒนาผลการเรียนรู้ของนักศึกษา
        </h2>
      </div>
    </div>

    <table style="width:100%; border-collapse: collapse; font-size:14px;">

      <!-- ✅ HEADER -->
      <tr>
        <th style="border:1px solid #000;">ผลลัพธ์การเรียนรู้ระดับหลักสูตร (PLOs)</th>
        <th style="border:1px solid #000;">ทักษะทั่วไป (Generic Skill)</th>
        <th style="border:1px solid #000;">ทักษะเฉพาะ (Specific Skill)</th>
        <th style="border:1px solid #000;">ด้านความรู้</th>
        <th style="border:1px solid #000;">ด้านทักษะ</th>
        <th style="border:1px solid #000;">ด้านจริยธรรม</th>
        <th style="border:1px solid #000;">ด้านลักษณะบุคคล</th>
      </tr>

      <!-- ✅ PLO 1 -->
      ${ploHeaderRow('PLO 1')}
      ${subPloRow('1.1', [1,0,1,0,0,0], mappedSet)}
      ${subPloRow('1.2', [0,1,0,1,0,0], mappedSet)}
      ${subPloRow('1.3', [1,0,0,1,1,0], mappedSet)}
      ${subPloRow('1.4', [0,1,1,1,1,1], mappedSet)}

      <!-- ✅ PLO 2 -->
      ${ploHeaderRow('PLO 2')}
      ${subPloRow('2.1', [0,1,1,1,1,1], mappedSet)}
      ${subPloRow('2.2', [0,1,1,1,1,1], mappedSet)}
      ${subPloRow('2.3', [0,1,1,1,1,1], mappedSet)}
      ${subPloRow('2.4', [0,1,1,1,1,1], mappedSet)}
      ${subPloRow('2.5', [0,1,1,1,1,1], mappedSet)}

      <!-- ✅ PLO 3 -->
      ${ploHeaderRow('PLO 3')}
      ${subPloRow('3.1', [0,1,1,1,0,1], mappedSet)}
      ${subPloRow('3.2', [0,1,1,1,0,0], mappedSet)}
      ${subPloRow('3.3', [0,1,1,1,0,1], mappedSet)}
      ${subPloRow('3.4', [0,1,1,1,0,1], mappedSet)}
      ${subPloRow('3.5', [0,1,1,1,0,1], mappedSet)}

      <!-- ✅ PLO 4 -->
      ${ploHeaderRow('PLO 4')}
      ${subPloRow('4.1', [0,1,1,0,0,0], mappedSet)}
      ${subPloRow('4.2', [0,1,1,0,0,0], mappedSet)}
      ${subPloRow('4.3', [0,1,1,1,0,1], mappedSet)}

      <!-- ✅ PLO 5 -->
      ${ploHeaderRow('PLO 5')}
      ${subPloRow('5.1', [0,1,1,1,0,1], mappedSet)}
      ${subPloRow('5.2', [0,1,1,1,1,0], mappedSet)}
      ${subPloRow('5.3', [0,1,1,1,1,0], mappedSet)}

      <!-- ✅ PLO 6 -->
      ${ploHeaderRow('PLO 6')}
      ${subPloRow('6.1', [0,1,1,1,0,1], mappedSet)}
      ${subPloRow('6.2', [0,1,1,1,0,1], mappedSet)}

      <!-- ✅ PLO 7 -->
      ${ploHeaderRow('PLO 7')}
      ${subPloRow('7.1', [1,0,0,1,0,1], mappedSet)}
      ${subPloRow('7.2', [1,0,0,1,0,1], mappedSet)}
      ${subPloRow('7.3', [1,0,0,1,0,1], mappedSet)}

    </table>

  </div>
  `;
};

module.exports = { renderSection3 };