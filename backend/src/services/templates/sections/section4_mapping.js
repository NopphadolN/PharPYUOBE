const renderMapping = (data) => {
  const clos = data.clos || [];
  const subPlos = data.subPlos || [];
  const cloMappings = data.cloMappings || [];

  return `
  <div class="section page-break">
    <h1>Mapping CLO – SubPLO</h1>
    <table>
      <thead>
        <tr>
          <th>CLO</th>
          ${subPlos.map(sp => `<th>${sp.code}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${clos.map(clo => {
          const map = cloMappings.find(m => m.cloId == clo.id);
          return `
          <tr>
            <td>${clo.code}</td>

            ${subPlos.map(sp => {
              const checked =
                map?.subPloIds?.includes(String(sp.id));
              return `<td>${checked ? '✓' : ''}</td>`;
            }).join('')}
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </div>
  `;
};

module.exports = { renderMapping };