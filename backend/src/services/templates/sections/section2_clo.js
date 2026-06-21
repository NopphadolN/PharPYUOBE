const renderSection2 = (data) => {
  const { clos } = data;

  return `
  <div class="section">
    <h2>หมวดที่ 2 CLO</h2>

    ${clos.map((c,i)=>`
      <p><strong>${i+1}. ${c.code}</strong> ${c.description}</p>
    `).join('')}

  </div>
  `;
};

module.exports = { renderSection2 };