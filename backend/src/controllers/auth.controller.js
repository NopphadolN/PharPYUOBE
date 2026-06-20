const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.changePasswordFirstTime = async (req, res) => {
  const { username, newPassword } = req.body;
  try {
    const userRes = await pool.query(
      'SELECT must_change_password FROM users WHERE username=$1',
      [username]
    );
    const user = userRes.rows[0];
    // ✅ กันเปลี่ยนซ้ำ
    if (!user.must_change_password) {
      return res.status(400).json({
        message: 'คุณได้เปลี่ยนรหัสแล้ว'
      });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({
        message: 'Password ต้อง 8 ตัวขึ้นไป'
      });
    }

    const hashed = await bcrypt.hash(newPassword, 8);
    await pool.query(
      `UPDATE users 
       SET password=$1, must_change_password=false
       WHERE username=$2`,
      [hashed, username]
    );
    res.json({ message: 'เปลี่ยนรหัสสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  console.log('HEADERS:', req.headers['content-type']);
  console.log('BODY:', req.body);

  
  if (!req.body) {
    return res.status(400).json({ message: 'NO BODY RECEIVED' });
  }

  const { username, password } = req.body;

  try {

  const result = await pool.query(
    'SELECT id, password, role, name_th, must_change_password FROM users WHERE username=$1',
    [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Wrong password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      'SECRET_KEY',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      role: user.role,
      name: user.name_th,
      mustChangePassword: user.must_change_password
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};