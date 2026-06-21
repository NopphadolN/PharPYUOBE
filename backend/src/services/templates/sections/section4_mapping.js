const renderMapping = ({ clos, subPlos, cloMappings }) => {

  return `
  <div class="section page-break">
    <h2>Mapping CLO – SubPLO</h2>

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