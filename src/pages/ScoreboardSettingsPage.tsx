import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useScoreboard } from "../contexts/ScoreboardContext";
import { Participant } from "../types";
import "../App.css";

const ScoreboardSettingsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    scoreboards,
    addScoreboard,
    updateScoreboard,
    startScoreboard,
    stopScoreboard,
    restartScoreboard,
    addTeam,
    deleteTeam,
  } = useScoreboard();

  const isNew = id === "new";
  const existingScoreboard = !isNew ? scoreboards.find((sb) => sb.id === id) : null;

  const [name, setName] = useState(existingScoreboard?.name || "");
  const [notice, setNotice] = useState(existingScoreboard?.notice || "");
  const [duration, setDuration] = useState(existingScoreboard?.duration || 3600); // 기본 1시간
  const [startTime, setStartTime] = useState<string>(
    existingScoreboard?.startTime
      ? new Date(existingScoreboard.startTime).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [participants, setParticipants] = useState<Participant[]>(
    existingScoreboard?.participants || []
  );
  const [customUrl, setCustomUrl] = useState(existingScoreboard?.customUrl || "");
  const [newParticipantName, setNewParticipantName] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const handleAddParticipant = async () => {
    if (!newParticipantName.trim()) return;

    if (isNew) {
      // 새 대회인 경우 로컬에만 추가
      const newParticipant: Participant = {
        id: generateId(),
        name: newParticipantName.trim(),
        score: 0,
        history: [],
      };
      setParticipants([...participants, newParticipant]);
      setNewParticipantName("");
    } else {
      // 기존 대회인 경우 API 호출
      try {
        await addTeam(id!, newParticipantName.trim());
        const newParticipant: Participant = {
          id: generateId(),
          name: newParticipantName.trim(),
          score: 0,
          history: [],
        };
        setParticipants([...participants, newParticipant]);
        setNewParticipantName("");
      } catch (error) {
        alert("팀 추가에 실패했습니다.");
      }
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (isNew) {
      // 새 대회인 경우 로컬에서만 삭제
      setParticipants(participants.filter((p) => p.id !== participantId));
    } else {
      // 기존 대회인 경우 API 호출
      try {
        await deleteTeam(id!, participantId);
        setParticipants(participants.filter((p) => p.id !== participantId));
      } catch (error) {
        alert("팀 삭제에 실패했습니다.");
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("점수판 이름을 입력해주세요.");
      return;
    }
    if (participants.length === 0) {
      alert("최소 1명의 참여자를 추가해주세요.");
      return;
    }

    try {
      if (isNew) {
        const adminId = generateId();
        // startTime을 timestamp로 변환
        const startTimeTimestamp = startTime ? new Date(startTime).getTime() : Date.now();

        const scoreboardId = await addScoreboard({
          name: name.trim(),
          adminId,
          notice: notice.trim(),
          duration,
          startTime: startTimeTimestamp,
          isRunning: false,
          participants,
          customUrl: customUrl.trim() || undefined,
        });

        // 대회 생성 후 팀들도 등록
        for (const participant of participants) {
          try {
            await addTeam(scoreboardId, participant.name);
          } catch (error) {
            console.error(`팀 ${participant.name} 등록 실패:`, error);
          }
        }

        const viewerId = scoreboards.find((sb) => sb.id === scoreboardId)?.viewerId || "";
        const link = `${window.location.origin}/scoreboard/${viewerId}`;
        setGeneratedLink(link);
        setShowLinkModal(true);
      } else {
        // startTime을 timestamp로 변환
        const startTimeTimestamp = startTime ? new Date(startTime).getTime() : Date.now();

        await updateScoreboard(id!, {
          name: name.trim(),
          notice: notice.trim(),
          duration,
          startTime: startTimeTimestamp,
          participants,
          customUrl: customUrl.trim() || undefined,
        });
        alert("설정이 저장되었습니다.");
      }
    } catch (error) {
      console.error("저장 오류:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const handleStart = async () => {
    if (!id || id === "new") return;
    try {
      await startScoreboard(id);
      alert("대회가 시작되었습니다.");
    } catch (error) {
      console.error("대회 시작 오류:", error);
      alert("대회 시작 중 오류가 발생했습니다.");
    }
  };

  const handleStop = async () => {
    if (!id || id === "new") return;
    try {
      await stopScoreboard(id);
      alert("대회가 중지되었습니다.");
    } catch (error) {
      console.error("대회 중지 오류:", error);
      alert("대회 중지 중 오류가 발생했습니다.");
    }
  };

  const handleRestart = async () => {
    if (!id || id === "new") return;
    if (confirm("대회를 재시작하시겠습니까? 모든 점수와 히스토리가 초기화됩니다.")) {
      try {
        await restartScoreboard(id, "reset");
        alert("대회가 재시작되었습니다.");
      } catch (error) {
        console.error("대회 재시작 오류:", error);
        alert("대회 재시작 중 오류가 발생했습니다.");
      }
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    alert("링크가 클립보드에 복사되었습니다.");
  };

  const durationHours = Math.floor(duration / 3600);
  const durationMinutes = Math.floor((duration % 3600) / 60);

  return (
    <div className="container">
      <h1 className="page-title">점수판 설정</h1>

      <div className="form-group">
        <label className="form-label">점수판 이름</label>
        <input
          type="text"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="점수판 이름을 입력하세요"
        />
      </div>

      <div className="form-group">
        <label className="form-label">운영자 공지사항</label>
        <textarea
          className="input"
          value={notice}
          onChange={(e) => setNotice(e.target.value)}
          placeholder="공지사항을 입력하세요"
          rows={4}
          style={{ resize: "vertical" }}
        />
      </div>

      <div className="form-group">
        <label className="form-label">대회 시작 시간</label>
        <input
          type="datetime-local"
          className="input"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">경기 시간 (시간:분)</label>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="number"
            className="input"
            value={durationHours}
            onChange={(e) => {
              const hours = parseInt(e.target.value) || 0;
              const minutes = durationMinutes;
              setDuration(hours * 3600 + minutes * 60);
            }}
            min="0"
            style={{ width: "100px" }}
          />
          <span>시간</span>
          <input
            type="number"
            className="input"
            value={durationMinutes}
            onChange={(e) => {
              const hours = durationHours;
              const minutes = parseInt(e.target.value) || 0;
              setDuration(hours * 3600 + minutes * 60);
            }}
            min="0"
            max="59"
            style={{ width: "100px" }}
          />
          <span>분</span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">참여자 목록</label>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <input
            type="text"
            className="input"
            value={newParticipantName}
            onChange={(e) => setNewParticipantName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleAddParticipant();
              }
            }}
            placeholder="참여자 이름"
            style={{ flex: 1 }}
          />
          <button type="button" className="button button-primary" onClick={handleAddParticipant}>
            추가
          </button>
        </div>
        <div>
          {participants.map((participant) => (
            <div
              key={participant.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px",
                marginBottom: "8px",
                background: "#f9f9f9",
                borderRadius: "6px",
              }}
            >
              <span>{participant.name}</span>
              <button
                className="button button-danger"
                onClick={() => handleRemoveParticipant(participant.id)}
                style={{ padding: "4px 12px", fontSize: "0.9rem" }}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">커스텀 점수판 URL (선택사항)</label>
        <input
          type="text"
          className="input"
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
          placeholder="https://example.com"
        />
      </div>

      {!isNew && (
        <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button className="button button-primary" onClick={handleStart}>
            대회 시작
          </button>
          <button className="button button-danger" onClick={handleStop}>
            대회 중지
          </button>
          <button className="button button-secondary" onClick={handleRestart}>
            대회 재시작
          </button>
        </div>
      )}

      <div className="button-group">
        <button className="button button-primary" onClick={handleSave}>
          {isNew ? "등록" : "저장"}
        </button>
        <button className="button button-secondary" onClick={() => navigate("/admin")}>
          취소
        </button>
      </div>

      {showLinkModal && (
        <div className="modal" onClick={() => setShowLinkModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">점수판이 생성되었습니다!</h2>
            <div className="form-group">
              <label className="form-label">점수판 링크:</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  className="input"
                  value={generatedLink}
                  readOnly
                  style={{ flex: 1 }}
                />
                <button className="button button-primary" onClick={copyLink}>
                  복사
                </button>
              </div>
            </div>
            <div className="button-group">
              <button
                className="button button-primary"
                onClick={() => {
                  setShowLinkModal(false);
                  navigate("/admin");
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreboardSettingsPage;
