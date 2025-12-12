import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { formatTime, getElapsedTime } from "../utils/timeUtils";
import { useScoreboardSocket, WsMessage, ScoreBoard, Team, ScoreHistory } from "../contexts/useScoreboardSocket"; // ← 실제 경로에 맞게 수정
import type { ScoreChangeLog } from "../types"; // ← ScoreChangeLog가 정의된 위치에 맞게 수정
import "../App.css";
import { useScoreboard } from "../contexts/ScoreboardContext";

const ScoreboardDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { fetchCompData, fetchHistory } = useScoreboard();

  const [scoreBoard, setScoreBoard] = useState<ScoreBoard | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [histories, setHistories] = useState<ScoreChangeLog[]>([]);

  // WS ScoreHistory → 화면에서 쓰는 ScoreChangeLog로 변환
  const toChangeLog = (h: ScoreHistory): ScoreChangeLog => ({
    teamName: h.teamName,
    againstTeamName: h.againstTeamName,
    delta: h.delta,
    reason: h.reason,
    changedAt: h.changedAt,
  });

  // ✅ 1) 첫 로딩: REST로 점수판 + 히스토리 불러오기
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const loadInitial = async () => {
      try {
        const [compData, historyData] = await Promise.all([fetchCompData(id), fetchHistory(id)]);

        if (cancelled) return;
        if (!compData) return;

        const initialScoreBoard: ScoreBoard = {
          competitionName: compData.competitionName,
          announcement: compData.announcement,
          description: compData.description,
          startTime: compData.startTime,
          totalTime: compData.totalTime,
          state: compData.state as ScoreBoard["state"],
          teams: compData.teams.map((t) => ({
            teamId: t.teamId,
            name: t.name,
            score: t.score,
          })),
        };

        setScoreBoard(initialScoreBoard);
        setTeams(initialScoreBoard.teams);
        setHistories(historyData ?? []);
      } catch (e) {
        console.error("초기 점수판/히스토리 조회 실패:", e);
      }
    };

    loadInitial();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ✅ 2) 이후: WebSocket으로 들어오는 변경 반영
  const handleWsMessage = useCallback((msg: WsMessage) => {
    switch (msg.type) {
      case "COMPETITION_DATA_CHANGE":
        setScoreBoard(msg.payload.scoreBoard);
        setTeams(msg.payload.scoreBoard.teams);
        setHistories(msg.payload.scoreHistories.map(toChangeLog));
        break;

      case "SCORE_UPDATE":
        setTeams(msg.payload.teams);
        setHistories((prev) => [...prev, ...msg.payload.scoreHistories.map(toChangeLog)]);
        break;
    }
  }, []);

  useScoreboardSocket(handleWsMessage, { viewerId: id });

  // ✅ 3) 초기 데이터도 못 받았으면 로딩 문구
  if (!scoreBoard) {
    return (
      <div className="container">
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>점수판을 불러오는 중입니다...</div>
      </div>
    );
  }

  // getElapsedTime(startTime: number | null, duration: number)
  const parsedStart = Date.parse(scoreBoard.startTime);
  const startMs = Number.isNaN(parsedStart) ? null : parsedStart;

  const { elapsed, remaining } = getElapsedTime(startMs, scoreBoard.totalTime);
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="container">
      {/* 상단 정보 */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 className="page-title" style={{ marginBottom: "20px" }}>
          {scoreBoard.competitionName}
        </h1>

        {scoreBoard.announcement && (
          <div
            style={{
              background: "#fff3cd",
              border: "1px solid #ffc107",
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "20px",
              color: "#856404",
            }}
          >
            <strong>운영자 공지:</strong> {scoreBoard.announcement}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "30px",
            marginBottom: "30px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              backgroundColor: "blue",
              padding: "10px",
              borderRadius: "10px",
              color: "white",
              display: "flex",
              alignItems: "center",
            }}
          >
            {scoreBoard.state}
          </span>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "0.9rem",
                color: "#666",
                marginBottom: "5px",
              }}
            >
              진행 시간
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: "#2196F3",
              }}
            >
              {formatTime(elapsed)}
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "0.9rem",
                color: "#666",
                marginBottom: "5px",
              }}
            >
              남은 시간
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: remaining < 300 ? "#f44336" : "#4CAF50",
              }}
            >
              {formatTime(remaining)}
            </div>
          </div>
        </div>
      </div>

      {/* 팀 순위 리스트 */}
      <div>
        {sortedTeams.map((team, index) => (
          <div
            key={team.teamId}
            className="card"
            style={{
              cursor: "default",
              background: index === 0 ? "#fff9e6" : "white",
              border: index === 0 ? "2px solid #ffc107" : undefined,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color: index === 0 ? "#ffc107" : index === 1 ? "#c0c0c0" : index === 2 ? "#cd7f32" : "#666",
                    minWidth: "40px",
                    textAlign: "center",
                  }}
                >
                  {index + 1}등
                </div>
                <div>
                  <h3 style={{ marginBottom: "5px", color: "#333" }}>{team.name}</h3>
                  <div style={{ color: "#2196F3", fontWeight: 600 }}>{team.score}점</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 히스토리 리스트: fetchHistory + WebSocket 합쳐진 배열을 나열 */}
      <div style={{ marginTop: "40px" }}>
        <h2>점수 히스토리</h2>
        {histories.length === 0 ? (
          <div
            style={{
              marginTop: "10px",
              textAlign: "center",
              color: "#777",
              fontSize: "0.9rem",
            }}
          >
            아직 기록된 점수 변경 이력이 없습니다.
          </div>
        ) : (
          histories.map((h, idx) => (
            <div key={idx} className="card" style={{ marginTop: "10px" }}>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#888",
                  marginBottom: "4px",
                }}
              >
                {new Date(h.changedAt).toLocaleString()}
              </div>
              <div>
                <strong>{h.teamName}</strong> vs {h.againstTeamName} →{" "}
                <span style={{ color: "#2196F3" }}>{h.delta}점</span> ({h.reason})
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ScoreboardDetailPage;
