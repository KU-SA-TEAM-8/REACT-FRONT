import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../App.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // 회원가입 폼 상태
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const success = await login(email, password);
      if (success) {
        navigate("/admin");
      } else {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch (error) {
      setError("로그인 중 오류가 발생했습니다.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");

    try {
      const result = await register(registerName, registerEmail, registerPassword);

      if (result.success) {
        setRegisterSuccess(result.message);
        // 2초 후 모달 닫기
        setTimeout(() => {
          setShowRegisterModal(false);
          setRegisterName("");
          setRegisterEmail("");
          setRegisterPassword("");
          setRegisterSuccess("");
        }, 2000);
      } else {
        setRegisterError(result.message);
      }
    } catch (error) {
      setRegisterError("회원가입 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="container" style={{ maxWidth: "400px", marginTop: "100px" }}>
      <h1 className="page-title" style={{ textAlign: "center" }}>
        관리자 로그인
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">이메일</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력하세요"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">비밀번호</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div style={{ color: "#f44336", marginBottom: "15px", fontSize: "0.9rem" }}>{error}</div>}

        <div className="button-group">
          <button type="submit" className="button button-primary">
            로그인
          </button>
        </div>
      </form>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => {
            setShowRegisterModal(true);
            setRegisterError("");
            setRegisterSuccess("");
          }}
          style={{ width: "100%" }}
        >
          회원가입
        </button>
      </div>

      {showRegisterModal && (
        <div className="modal" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">회원가입</h2>

            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label className="form-label">이름</label>
                <input
                  type="text"
                  className="input"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">이메일</label>
                <input
                  type="email"
                  className="input"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="이메일을 입력하세요"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">비밀번호</label>
                <input
                  type="password"
                  className="input"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요 (4자 이상)"
                  required
                  minLength={4}
                />
              </div>

              {registerError && (
                <div style={{ color: "#f44336", marginBottom: "15px", fontSize: "0.9rem" }}>{registerError}</div>
              )}

              {registerSuccess && (
                <div style={{ color: "#4CAF50", marginBottom: "15px", fontSize: "0.9rem" }}>{registerSuccess}</div>
              )}

              <div className="button-group">
                <button type="submit" className="button button-primary">
                  가입하기
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setShowRegisterModal(false);
                    setRegisterName("");
                    setRegisterEmail("");
                    setRegisterPassword("");
                    setRegisterError("");
                    setRegisterSuccess("");
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
