const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const pool = require('../db');

const upload = multer({ dest: 'uploads/' });

// ✅ Import Courses
router.post('/courses', upload.single('file'), async (req, res) => {
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    for (let row of data) {
      await pool.query(`
        INSERT INTO courses (
          code_th, code_en, name_th, name_en,
          credits, credit_format, description
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)

        ON CONFLICT (code_en)
        DO UPDATE SET
          code_th = EXCLUDED.code_th,
          name_th = EXCLUDED.name_th,
          name_en = EXCLUDED.name_en,
          credits = EXCLUDED.credits,
          credit_format = EXCLUDED.credit_format,
          description = EXCLUDED.description
      `, [
        row.code_th,
        row.code_en,
        row.name_th,
        row.name_en,
        row.credits,
        row.credit_format,
        row.description
      ]);
    }

    res.json({ message: 'Courses imported successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Import failed' });
  }
});

const bcrypt = require('bcrypt');

// ✅ Import Users (Version สมบูรณ์)
router.post('/users', upload.single('file'), async (req, res) => {
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    for (let row of data) {

      // ✅ สร้าง password อัตโนมัติ
      const username = String(row.username);
      const passwordPlain = String(row.user_code);
      const hashedPassword = await bcrypt.hash(passwordPlain, 10);

      await pool.query(`
        INSERT INTO users (
          username,
          user_code,
          name_th,
          role,
          password
        )
        VALUES ($1,$2,$3,$4,$5)

        ON CONFLICT (user_code)
        DO UPDATE SET
          username = EXCLUDED.username,
          name_th = EXCLUDED.name_th,
          role = EXCLUDED.role,
          password = EXCLUDED.password
      `, [
        row.username,
        row.user_code,
        row.name_th,
        row.role,
        hashedPassword
      ]);
    }

    res.json({ message: 'Users imported successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Import users failed' });
  }
});

module.exports = router;
