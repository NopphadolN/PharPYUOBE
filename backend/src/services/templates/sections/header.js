const renderHeader = (data) => {

  const year = data.course.year || '';
  const semester = data.course.semester || '';
  const renderHeader = (data) => {
  if (!data || !data.course) {
    return '<div>NO DATA</div>';
  }
  return `...`;
};

  return `
    <div style="margin-bottom:30px;" class="header">
      <p><strong>ประมวลรายวิชา หลักสูตรเภสัชศาสตร์บัณฑิต</strong></p>
      <div><b>สาขาการบริบาลทางเภสัชกรรม</b></div>
      <div><b>คณะเภสัชศาสตร์ มหาวิทยาลัยพายัพ</b></div>
      <div><b>ประจำภาคการศึกษาที่ ${semester} ปีการศึกษา ${year}</b></div>
    </div>
  `;
};

module.exports = { renderHeader };
