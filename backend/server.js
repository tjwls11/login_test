const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3011;
const saltRounds = 10;
const secretKey = 'your_secret_key_here'; // 여기에 비밀 키를 설정하세요

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL 연결 설정
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'tjwls100',
  database: 'test_db'
});

// MySQL 연결 확인
db.connect(err => {
  if (err) {
    console.error('MySQL 연결 실패:', err);
  } else {
    console.log('MySQL 연결 성공');
  }
});

// 기본 라우트 설정
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// 회원가입 엔드포인트
app.post('/signup', (req, res) => {
  const { name, user_id, password } = req.body;

  if (!name || !user_id || !password) {
    return res.status(400).json({ isSuccess: false, message: '모든 필드를 입력해주세요.' });
  }

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      console.error('비밀번호 해시 오류:', err);
      return res.status(500).json({ isSuccess: false, message: '서버 오류' });
    }

    const sql = 'INSERT INTO users (name, user_id, password) VALUES (?, ?, ?)';
    db.query(sql, [name, user_id, hash], (err, result) => {
      if (err) {
        console.error('사용자 생성 실패:', err);
        return res.status(500).json({ isSuccess: false, message: '사용자 생성 실패' });
      }
      res.status(201).json({ isSuccess: true, message: '사용자 생성 성공' });
    });
  });
});

// 로그인 엔드포인트
app.post('/login', (req, res) => {
  const { user_id, password } = req.body;

  if (!user_id || !password) {
    return res.status(400).json({ isSuccess: false, message: '모든 필드를 입력해주세요.' });
  }

  const sql = 'SELECT * FROM users WHERE user_id = ?';
  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error('서버 오류:', err);
      return res.status(500).json({ isSuccess: false, message: '서버 오류' });
    }
    if (results.length === 0) {
      return res.status(401).json({ isSuccess: false, message: '사용자 없음' });
    }

    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('비밀번호 비교 오류:', err);
        return res.status(500).json({ isSuccess: false, message: '서버 오류' });
      }
      if (!isMatch) {
        return res.status(401).json({ isSuccess: false, message: '비밀번호 불일치' });
      }

      // 로그인 성공 시 JWT 토큰 발급
      const token = jwt.sign({ id: user.id, name: user.name, user_id: user.user_id }, secretKey, { expiresIn: '1h' });
      res.json({ isSuccess: true, message: '로그인 성공', token, user: { id: user.id, name: user.name, user_id: user.user_id } });
    });
  });
});

// 마이페이지 엔드포인트 (토큰 검증 예시)
app.get('/userinfo', verifyToken, (req, res) => {
  const { id, name, user_id } = req.user;
  res.json({ isSuccess: true, user: { id, name, user_id } });
});

// 비밀번호 변경 엔드포인트
app.post('/changepassword', verifyToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ isSuccess: false, message: '모든 필드를 입력해주세요.' });
  }

  // 사용자 정보를 조회합니다.
  const sql = 'SELECT * FROM users WHERE id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('서버 오류:', err);
      return res.status(500).json({ isSuccess: false, message: '서버 오류' });
    }
    if (results.length === 0) {
      return res.status(401).json({ isSuccess: false, message: '사용자 없음' });
    }

    const user = results[0];

    // 현재 비밀번호와 데이터베이스에 저장된 해시 비밀번호를 비교합니다.
    bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
      if (err) {
        console.error('비밀번호 비교 오류:', err);
        return res.status(500).json({ isSuccess: false, message: '서버 오류' });
      }
      if (!isMatch) {
        return res.status(401).json({ isSuccess: false, message: '현재 비밀번호 불일치' });
      }

      // 새로운 비밀번호를 해시화합니다.
      bcrypt.hash(newPassword, saltRounds, (err, hash) => {
        if (err) {
          console.error('비밀번호 해시 오류:', err);
          return res.status(500).json({ isSuccess: false, message: '서버 오류' });
        }

        // 비밀번호를 업데이트합니다.
        const updateSql = 'UPDATE users SET password = ? WHERE id = ?';
        db.query(updateSql, [hash, userId], (err, result) => {
          if (err) {
            console.error('비밀번호 변경 실패:', err);
            return res.status(500).json({ isSuccess: false, message: '비밀번호 변경 실패' });
          }
          res.json({ isSuccess: true, message: '비밀번호 변경 성공' });
        });
      });
    });
  });
});


// JWT 토큰 검증 미들웨어
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  if (!bearerHeader) {
    return res.status(403).json({ isSuccess: false, message: '토큰이 없습니다.' });
  }

  const token = bearerHeader.split(' ')[1];

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      console.error('토큰 검증 오류:', err);
      return res.status(401).json({ isSuccess: false, message: '토큰 검증 실패' });
    }

    req.user = decoded;
    next();
  });
}

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
