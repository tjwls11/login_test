import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const [credentials, setCredentials] = useState({
    user_id: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // 폼 제출 기본 동작 방지

    fetch("http://localhost:3011/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          alert("로그인 성공!");
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          navigate("/mypage"); // 로그인 성공 후 마이페이지로 이동
        } else {
          alert("로그인 실패: " + data.message);
        }
      })
      .catch((error) => {
        console.error("로그인 오류:", error);
        alert("로그인 중 오류가 발생했습니다.");
      });
  };

  return (
    <div className="page">
      <div className="title">LOGIN</div>
      <form className="content" onSubmit={handleSubmit}>
        <input
          className="input"
          type="text"
          name="user_id"
          placeholder="ID"
          value={credentials.user_id}
          onChange={handleChange}
        />
        <input
          className="input"
          type="password"
          name="password"
          placeholder="Password"
          value={credentials.password}
          onChange={handleChange}
        />
        <button
          className={`login-button ${credentials.user_id && credentials.password ? 'enabled' : ''}`}
          disabled={!credentials.user_id || !credentials.password}
          type="submit"
        >
          로그인
        </button>
      </form>
      <div className="actions">
        <Link to="/signup" className="signup-link">
          회원가입
        </Link>
      </div>
    </div>
  );
}

export default Login;
