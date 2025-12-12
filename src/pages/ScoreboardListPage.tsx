import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useScoreboard } from "../contexts/ScoreboardContext";
import { formatTime, getElapsedTime } from "../utils/timeUtils";
import "../App.css";
import type { CompetitionItem, ScoreboardRow } from "../types";

const ScoreboardListPage = () => {
  const navigate = useNavigate();
  const { fetchScoreboards, fetchCompList } = useScoreboard();
  const [scoreboards, setScoreboards] = useState<ScoreboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCompList(30);
        setScoreboards(data.scoreBoardRows || []);
      } catch (e) {
        console.error("점수판 목록 조회 실패:", e);
        setScoreboards([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [fetchScoreboards]);

  const handleCreateClick = () => {
    if (localStorage.getItem("accessToken")) {
      navigate("/admin");
      return;
    }
    navigate("/login");
  };

  const handleScoreboardClick = (viewerId: string) => {
    navigate(`/scoreboard/${viewerId}`);
  };

  return (
    <div className="container">
      <h1 className="page-title">오픈하우스 점수판</h1>

      <div style={{ marginBottom: "30px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>점수판을 불러오는 중입니다...</div>
        ) : scoreboards.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>등록된 점수판이 없습니다.</div>
        ) : (
          scoreboards.map((scoreboard) => {
            return (
              <div
                key={scoreboard.publicId}
                className="card"
                onClick={() => handleScoreboardClick(scoreboard.publicId)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h3 style={{ marginBottom: "8px", color: "#333" }}>{scoreboard.name}</h3>
                  </div>
                  <div style={{ color: "#2196F3", fontWeight: 500 }}>Viewer</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <button className="button button-primary" onClick={handleCreateClick}>
          점수판 만들기
        </button>
      </div>
    </div>
  );
};

export default ScoreboardListPage;
