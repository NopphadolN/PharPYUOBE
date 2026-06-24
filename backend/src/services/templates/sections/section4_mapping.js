const renderHeader = (subPlos = []) => {
  // ✅ group subplo ตาม PLO
  const grouped = {};

  subPlos.forEach(sp => {
    // "SubPLO1.1" → ["1","1"]
    const match = sp.code.replace('SubPLO', '').split('.');
    const plo = match[0];
    const sub = match[1];

    if (!grouped[plo]) grouped[plo] = [];
    grouped[plo].push({ ...sp, sub });
  });

  // ✅ เรียง sub index
  Object.keys(grouped).forEach(k => {
    grouped[k].sort((a,b) => Number(a.sub) - Number(b.sub));
  });

  // ✅ แถวบน (PLO1,2,...)
  const topHeader = Object.keys(grouped).map(plo => `
    <th colspan="${grouped[plo].length}" style="border:1px solid #000;">
      PLO${plo}
    </th>
  `).join('');

  // ✅ แถวล่าง (1,2,3,...)
  const bottomHeader = Object.values(grouped).map(arr =>
    arr.map(sp => `
      <th style="border:1px solid #000;">
        ${sp.sub}
      </th>
    `).join('')
  ).join('');

  return `
    <thead>
      <tr>
        <th rowspan="2" style="border:1px solid #000;">
          Course Learning Outcomes (CLOs)
        </th>
        ${topHeader}
      </tr>

      <tr>
        ${bottomHeader}
      </tr>
    </thead>
  `;
};

const renderMapping = (data) => {
  const clos = data.clos || [];
  const subPlos = data.subPlos || [];
  const cloMappings = data.cloMappings || [];
  const header = renderHeader(subPlos);

  return `
  <div class="section">

    <p>Mapping CLO – PLO</p>

    <table style="width:100%; border-collapse:collapse; text-align:center;">

      ${header}

      <tbody>
        ${clos.map(clo => {

          const map = cloMappings.find(m => m.cloId == clo.id);

          return `
          <tr>
            <td style="border:1px solid #000;">
              ${clo.code}
            </td>

            ${subPlos.map(sp => {
              const checked =
                map?.subPloIds?.includes(String(sp.id));
              return `
                <td style="border:1px solid #000;">
                  ${checked ? '✓' : ''}
                </td>
              `;
            }).join('')}

          </tr>
          `;
        }).join('')}
      </tbody>

    </table>

    <p>**เป็นไปตามตาราง mapping รายวิชากับ KSEC</p>

  </div>
  `;
};

module.exports = { renderMapping };