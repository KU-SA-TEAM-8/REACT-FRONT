import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useScoreboard } from "../contexts/ScoreboardContext";
import "../App.css";
import { CompetitionDetail } from "../types";

interface TeamData {
  id: string;
  delta: number;
  reason: string;
}

const ScoreManagementPage = () => {
  const location = useLocation();
  const { publicId, compId, name } = location.state || {};
  const navigate = useNavigate();
  const { fetchCompetition, patchScore } = useScoreboard();
  const [compData, setCompData] = useState<CompetitionDetail>();
  const [inputs, setInputs] = useState<TeamData[]>([]);

  useEffect(() => {
    if (compData) {
      const arr = compData.teams.map((team) => ({
        id: team.teamId,
        delta: 0,
        reason: "",
      }));
      setInputs(arr);
    }
  }, [compData]);

  const handleScoreSubmit = async (teamId: string) => {
    const target = inputs.find((item) => item.id === teamId);
    if (!target) return;
    const data = {
      delta: target.delta,
      reason: target.reason,
      eventType: "NORMAL",
      policyType: "INCREASE",
    };
    await patchScore(compId, teamId, data);
    const response = await fetchCompetition(publicId);
    setCompData(response);
    setInputs((prev) => prev.map((item) => (item.id === teamId ? { ...item, reason: "" } : item)));
  };

  useEffect(() => {
    const getData = async () => {
      const response = await fetchCompetition(publicId);
      setCompData(response);
    };
    getData();
  }, []);

  return (
    <div className="container">
      <div style={{ cursor: "pointer" }} onClick={() => navigate(-1)}>
        이전으로
      </div>
      <h1 className="page-title">{name} - 점수 관리</h1>

      <div style={{ marginBottom: "30px" }}>
        {compData?.teams.map((participant) => (
          <div key={participant.teamId} className="card" style={{ cursor: "default" }}>
            <div style={{ marginBottom: "15px" }}>
              <h3 style={{ marginBottom: "10px", color: "#333" }}>{participant.teamName}</h3>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#2196F3", marginBottom: "10px" }}>
                점수: {participant.scoreValue}
              </div>
              <>{inputs.find((input) => input.id === participant.teamId)?.delta}</>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap" }}>
              <button
                className="button button-primary"
                onClick={() => {
                  setInputs((prev) =>
                    prev.map((item) => (item.id === participant.teamId ? { ...item, delta: item.delta + 1 } : item))
                  );
                }}
                style={{ padding: "8px 16px" }}
              >
                +1
              </button>
              <button
                className="button button-danger"
                onClick={() => {
                  setInputs((prev) =>
                    prev.map((item) => (item.id === participant.teamId ? { ...item, delta: item.delta - 1 } : item))
                  );
                }}
                style={{ padding: "8px 16px" }}
              >
                -1
              </button>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <input
                type="text"
                className="input"
                placeholder="점수 히스토리 입력"
                value={inputs.find((val) => val.id === participant.teamId)?.reason ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setInputs((prev) =>
                    prev.map((item) => (item.id === participant.teamId ? { ...item, reason: value } : item))
                  );
                }}
              />
              <button
                className="button button-secondary"
                onClick={() => handleScoreSubmit(participant.teamId)}
                style={{ padding: "6px 12px", fontSize: "0.9rem", marginTop: "10px" }}
              >
                점수 변경
              </button>
            </div>

            {/* {participant.history.length > 0 && (
              <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #eee" }}>
                <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "8px" }}>히스토리:</div>
                <div style={{ fontSize: "0.85rem", color: "#888" }}>
                  {participant.history.slice(-5).map((h, idx) => (
                    <div key={idx} style={{ marginBottom: "4px" }}>
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            )} */}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
        {/* <button className="button button-secondary" onClick={copyAdminId}>
          관리ID 공유
        </button> */}
        {/* <button className="button button-primary" onClick={() => navigate(`/admin/settings/${scoreboard.id}`)}>
          설정 탭 이동
        </button> */}
      </div>
    </div>
  );
};

export default ScoreManagementPage;
