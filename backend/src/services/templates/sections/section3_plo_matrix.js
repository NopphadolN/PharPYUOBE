// ✅ helper: build mapped set จาก cloMappings
const buildMappedSet = (cloMappings = []) => {
  const all = cloMappings.flatMap(m => m.subPloIds || []);
  return new Set(all.map(id => String(id)));
};

// ✅ helper: render row
const subPloRow = (subPlo, checks = [], mappedSet) => {
  const isMapped = mappedSet.has(String(subPlo.id));
  const rowStyle = isMapped
    ? ''
    : 'background-color:#e0e0e0;';
  const cells = checks.map(v => `
    <td style="border:1px solid #000; text-align:center;">
      ${v ? '✓' : ''}
    </td>
  `).join('');

  return `
    <tr style="${rowStyle}">
      <td style="border:1px solid #000;">
        ${subPlo.code}
      </td>
      ${cells}
    </tr>
  `;
};

// ✅ helper: header row
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
  const { subPlos = [], cloMappings = [] } = data;
  // ✅ เอา logic จาก mapping มา reuse
  const mappedSet = buildMappedSet(cloMappings);
  // ✅ helper: หา subplo จาก code
  const find = (code) =>
    subPlos.find(sp => sp.code === `SubPLO${code}`);

  return `
  <div class="section">
    <div style="border: 2px solid #000; padding: 3px; margin: 20px 0;">
      <div style="border: 5px solid #000; padding: 10px 0; text-align: center;">
        <h2 style="margin: 0; font-size: 24px;">
          หมวดที่ 4 การพัฒนาผลการเรียนรู้ของนักศึกษา
        </h2>
      </div>
    </div>
    <table style="width:100%; border-collapse: collapse; font-size:16px;">
      <!-- HEADER -->
<thead>
  <tr>
    <!-- คอลัมน์แรก -->
    <th rowspan="2" style="border:1px solid #000; color:red;">
      ผลลัพธ์การเรียนรู้ระดับหลักสูตร (PLOs)
    </th>

    <!-- Generic -->
    <th rowspan="2" style="border:1px solid #000; color:red;">
      ทักษะทั่วไป<br>(Generic Skill)
    </th>

    <!-- Specific -->
    <th rowspan="2" style="border:1px solid #000; color:red;">
      ทักษะเฉพาะ<br>(Specific Skill)
    </th>

    <!-- กลุ่มใหญ่ -->
    <th colspan="4" style="border:1px solid #000; color:red;">
      มาตรฐานด้านผลลัพธ์การเรียนรู้ผู้เรียน 4 ด้าน<br>พ.ศ. 2565
    </th>
  </tr>

  <tr>
    <!-- sub columns -->
    <th style="border:1px solid #000; color:red;">ด้านความรู้</th>
    <th style="border:1px solid #000; color:red;">ด้านทักษะ</th>
    <th style="border:1px solid #000; color:red;">ด้านจริยธรรม</th>
    <th style="border:1px solid #000; color:red;">ด้านลักษณะบุคคล</th>
  </tr>
</thead>

      <!-- ✅ PLO 1 -->
      ${ploHeaderRow('PLO 1')}
      ${subPloRow(find('1.1') || {}, [1,0,1,0,0,0], mappedSet)}
      ${subPloRow(find('1.2') || {}, [0,1,0,1,0,0], mappedSet)}
      ${subPloRow(find('1.3') || {}, [1,0,0,1,1,0], mappedSet)}
      ${subPloRow(find('1.4') || {}, [0,1,1,1,1,1], mappedSet)}

      <!-- ✅ PLO 2 -->
      ${ploHeaderRow('PLO 2')}
      ${subPloRow(find('2.1') || {}, [0,1,1,1,1,1], mappedSet)}
      ${subPloRow(find('2.2') || {}, [0,1,1,1,1,1], mappedSet)}
      ${subPloRow(find('2.3') || {}, [0,1,1,1,1,1], mappedSet)}
      ${subPloRow(find('2.4') || {}, [0,1,1,1,1,1], mappedSet)}
      ${subPloRow(find('2.5') || {}, [0,1,1,1,1,1], mappedSet)}

      <!-- ✅ PLO 3 -->
      ${ploHeaderRow('PLO 3')}
      ${subPloRow(find('3.1') || {}, [0,1,1,1,0,1], mappedSet)}
      ${subPloRow(find('3.2') || {}, [0,1,1,1,0,0], mappedSet)}
      ${subPloRow(find('3.3') || {}, [0,1,1,1,0,1], mappedSet)}
      ${subPloRow(find('3.4') || {}, [0,1,1,1,0,1], mappedSet)}
      ${subPloRow(find('3.5') || {}, [0,1,1,1,0,1], mappedSet)}

      <!-- ✅ PLO 4 -->
      ${ploHeaderRow('PLO 4')}
      ${subPloRow(find('4.1') || {}, [0,1,1,0,0,0], mappedSet)}
      ${subPloRow(find('4.2') || {}, [0,1,1,0,0,0], mappedSet)}
      ${subPloRow(find('4.3') || {}, [0,1,1,1,0,1], mappedSet)}

      <!-- ✅ PLO 5 -->
      ${ploHeaderRow('PLO 5')}
      ${subPloRow(find('5.1') || {}, [0,1,1,1,0,1], mappedSet)}
      ${subPloRow(find('5.2') || {}, [0,1,1,1,1,0], mappedSet)}
      ${subPloRow(find('5.3') || {}, [0,1,1,1,1,0], mappedSet)}

      <!-- ✅ PLO 6 -->
      ${ploHeaderRow('PLO 6')}
      ${subPloRow(find('6.1') || {}, [0,1,1,1,0,1], mappedSet)}
      ${subPloRow(find('6.2') || {}, [0,1,1,1,0,1], mappedSet)}

      <!-- ✅ PLO 7 -->
      ${ploHeaderRow('PLO 7')}
      ${subPloRow(find('7.1') || {}, [1,0,0,1,0,1], mappedSet)}
      ${subPloRow(find('7.2') || {}, [1,0,0,1,0,1], mappedSet)}
      ${subPloRow(find('7.3') || {}, [1,0,0,1,0,1], mappedSet)}

    </table>

  </div>
  `;
};

module.exports = { renderSection3 };