import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useScoreboard } from "../contexts/ScoreboardContext";
import "../App.css";
import { CompetitionItem } from "../types";

const AdminHomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { fetchScoreboards } = useScoreboard();
  const [showAdminIdModal, setShowAdminIdModal] = useState(false);
  const [adminIdInput, setAdminIdInput] = useState("");
  const [competitionList, setCompetitionList] = useState<CompetitionItem[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }

    const fetchCompetitions = async () => {
      const data = await fetchScoreboards();
      setCompetitionList(data);
    };
    fetchCompetitions();
  }, [isAuthenticated]);

  const handleCreateClick = () => {
    navigate("/admin/settings/create");
  };

  const handleManageClick = (publicId: string, compId: string, name: string) => {
    navigate(`/admin/score/${publicId}`, {
      state: {
        publicId: publicId,
        compId: compId,
        name: name,
      },
    });
  };

  const handleAdminIdManage = () => {
    navigate(`/admin/score/${adminIdInput.trim()}`);
    setShowAdminIdModal(false);
    setAdminIdInput("");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          관리자 화면
        </h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="button button-secondary"
            onClick={() => {
              navigate("/");
            }}
            style={{ padding: "8px 16px" }}
          >
            점수판 리스트로
          </button>
          <button className="button button-secondary" onClick={logout} style={{ padding: "8px 16px" }}>
            로그아웃
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "30px" }}>
        {competitionList?.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>등록된 점수판이 없습니다.</div>
        ) : (
          competitionList?.map((competition) => (
            <div key={competition.competitionId} className="card" style={{ cursor: "default" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ marginBottom: "8px", color: "#333" }}>{competition.competitionName}</h3>
                  <div style={{ color: "#666", fontSize: "0.9rem" }}>관리 ID: {competition.manageBoardPublicId}</div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="button button-secondary"
                    onClick={() =>
                      handleManageClick(
                        competition.manageBoardPublicId,
                        competition.competitionId,
                        competition.competitionName
                      )
                    }
                    style={{ padding: "8px 16px" }}
                  >
                    점수 관리
                  </button>
                  <button
                    className="button button-primary"
                    onClick={() => navigate(`/admin/settings/${competition.competitionId}`)}
                    style={{ padding: "8px 16px" }}
                  >
                    수정
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
        {/* <button className="button button-secondary" onClick={() => setShowAdminIdModal(true)}>
          공유ID로 관리
        </button> */}
        <button className="button button-primary" onClick={handleCreateClick}>
          점수판 생성
        </button>
      </div>

      {showAdminIdModal && (
        <div className="modal" onClick={() => setShowAdminIdModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">공유ID로 관리</h2>
            <div className="form-group">
              <label className="form-label">관리 ID 입력</label>
              <input
                type="text"
                className="input"
                value={adminIdInput}
                onChange={(e) => setAdminIdInput(e.target.value)}
                placeholder="관리 ID를 입력하세요"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAdminIdManage();
                  }
                }}
              />
            </div>
            <div className="button-group">
              <button className="button button-primary" onClick={handleAdminIdManage}>
                이동
              </button>
              <button
                className="button button-secondary"
                onClick={() => {
                  setShowAdminIdModal(false);
                  setAdminIdInput("");
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHomePage;
