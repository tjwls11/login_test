import React, { useEffect, useState } from "react";

function Mypage() {
  const [user, setUser] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
      alert("로그인이 필요합니다.");
      window.location.href = "/";
      return;
    }

    setUser(user);
    fetch('http://localhost:3011/userinfo', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => response.json())
      .then(data => {
        if (!data.isSuccess) {
          alert("인증 오류");
          window.location.href = "/";
        } else {
          setUser(data.user);
        }
      })
      .catch(error => {
        console.error("유저 정보 요청 오류:", error);
        alert("유저 정보 요청 중 오류가 발생했습니다.");
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const handleChangePassword = () => {
    const token = localStorage.getItem("token");
    fetch('http://localhost:3011/changepassword', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    })
      .then(response => response.json())
      .then(data => {
        if (data.isSuccess) {
          alert("비밀번호가 변경되었습니다.");
          setCurrentPassword("");
          setNewPassword("");
        } else {
          alert(data.message);
        }
      })
      .catch(error => {
        console.error("비밀번호 변경 오류:", error);
        alert("비밀번호 변경 중 오류가 발생했습니다.");
      });
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="page">
      <div className="title">MY PAGE</div>
      <div className="content">
        <p>Name: {user.name}</p>
        <p>ID: {user.user_id}</p>
      </div>
      <div className="password-change">
        <h3>비밀번호 변경</h3>
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <input
        className="input"
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button className="Change-button" onClick={handleChangePassword}>비밀번호 바꾸기</button>
        <span className="out" onClick={handleLogout}>Logout</span>
      </div>
    </div>
  );
}

export default Mypage;
