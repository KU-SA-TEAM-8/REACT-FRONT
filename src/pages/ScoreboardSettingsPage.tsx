import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useScoreboard } from "../contexts/ScoreboardContext";
import "../App.css";
import { PatchScoreboardRequest, ResponseTeam } from "../types";

interface TeamInput {
  teamId?: string;
  name: string;
  initialScore: number;
}

export const PAGE_TYPE = {
  CREATION: "Creation",
  EDIT: "Edit",
} as const;

export type PageType = (typeof PAGE_TYPE)[keyof typeof PAGE_TYPE];

const ScoreboardSettingsPage = () => {
  const { id } = useParams<{ id: string }>();
  const pageType = id === "create" ? PAGE_TYPE.CREATION : PAGE_TYPE.EDIT;
  const navigate = useNavigate();
  const { fetchDetailScoreboard, addScoreboard, patchScoreboard, changeCompState } = useScoreboard();

  useEffect(() => {
    console.log(pageType);
  }, [pageType]);

  // 기본 입력값들
  const [name, setName] = useState<string>("");
  const [announcement, setAnnouncement] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [state, setState] = useState<string>("");

  // totalTime 을 초 단위로 관리
  const [durationSeconds, setDuration] = useState<number>(0);

  const durationHours = Math.floor(durationSeconds / 3600);
  const durationMinutes = Math.floor((durationSeconds % 3600) / 60);

  // 팀 리스트
  const [teams, setTeams] = useState<TeamInput[]>([]);

  const [newTeamName, setNewTeamName] = useState<string>("");
  const [newTeamScore, setNewTeamScore] = useState<number>(0);

  // 선택 옵션
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [isExternal, setIsExternal] = useState<boolean>(true);

  // 선택적 URL
  const [customUrl, setCustomUrl] = useState<string>("");

  const toLocalDatetimeValue = (isoString: string) => {
    const date = new Date(isoString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const toISOStringFromLocal = (localDatetime: string) => {
    // localDatetime 예: "2025-12-14T12:30"
    const date = new Date(localDatetime);

    // Date 객체는 자동으로 로컬 → UTC 고려한 ISO 문자열을 생성함
    return date.toISOString();
  };

  const fetchData = async (id: string) => {
    const data = await fetchDetailScoreboard(id);
    if (data) {
      const teams = data.teams.map((team) => {
        return {
          teamId: team.teamId,
          name: team.name,
          initialScore: 0,
        };
      });
      setName(data.name);
      setAnnouncement(data.announcement);
      setDescription(data.description);
      setStartTime(toLocalDatetimeValue(data.startTime));
      setTeams(teams);
      setState(data.state);
    }
  };

  useEffect(() => {
    if (pageType === PAGE_TYPE.EDIT && id) {
      fetchData(id);
    }
  }, [id, pageType]);
  // ─────────────────────────────────────────────
  // 팀 추가
  // ─────────────────────────────────────────────
  const handleAddTeam = () => {
    if (!newTeamName.trim()) return;

    setTeams((prev) => [...prev, { name: newTeamName, initialScore: newTeamScore }]);

    setNewTeamName("");
    setNewTeamScore(0);
  };

  const handleSave = async () => {
    const payload = {
      name,
      announcement,
      description,
      startTime: new Date(startTime).toISOString(),
      totalTime: durationSeconds,
      isPublic,
      isExternal,
      team: teams.map((t) => ({
        name: t.name,
        initialScore: t.initialScore,
      })),
      customUrl: customUrl ? customUrl : undefined,
    };

    const patchPayload = {
      name,
      announcement,
      description,
      startTime: new Date(startTime).toISOString(),
      totalTime: durationSeconds,
      teams: teams.map((t) => ({
        teamId: t.teamId,
        name: t.name,
        initialScore: t.initialScore,
      })),
    };

    try {
      if (pageType === PAGE_TYPE.CREATION) {
        await addScoreboard(payload);
      } else {
        if (id) {
          await patchScoreboard(id, patchPayload as PatchScoreboardRequest);
        }
      }
      navigate("/admin");
    } catch (err) {
      console.error("대회 생성 실패");
    }

    // TODO: API 호출 필요 시 여기에서 POST/PUT 요청
  };

  const handleStart = async (id: string) => {
    const response = await changeCompState(id, "start");
    if (response) {
      alert("상태가 변경되었습니다");
      await fetchData(id);
    }
  };
  const handlePause = async (id: string) => {
    const response = await changeCompState(id, "pause");
    if (response) {
      alert("상태가 변경되었습니다");
      await fetchData(id);
    }
  };
  const handleResume = async (id: string) => {
    const response = await changeCompState(id, "resume");
    if (response) {
      alert("상태가 변경되었습니다");
      await fetchData(id);
    }
  };
  const handleClose = async (id: string) => {
    const response = await changeCompState(id, "close");
    if (response) {
      alert("상태가 변경되었습니다");
      await fetchData(id);
    }
  };

  return (
    <div className="container">
      <h1 className="page-title">점수판 설정</h1>

      {/* 점수판 이름 */}
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

      {/* 공지사항 */}
      <div className="form-group">
        <label className="form-label">운영자 공지사항</label>
        <textarea
          className="input"
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          placeholder="공지사항을 입력하세요"
          rows={4}
          style={{ resize: "vertical" }}
        />
      </div>

      {/* 설명 */}
      <div className="form-group">
        <label className="form-label">대회 설명</label>
        <textarea
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="대회 설명을 입력하세요"
          rows={3}
          style={{ resize: "vertical" }}
        />
      </div>

      {/* 시작 시간 */}
      <div className="form-group">
        <label className="form-label">대회 시작 시간</label>
        <input
          type="datetime-local"
          className="input"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </div>

      {/* 경기 시간 */}
      <div className="form-group">
        <label className="form-label">경기 시간 (시간:분)</label>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="number"
            className="input"
            value={durationHours}
            min="0"
            onChange={(e) => {
              const hours = Number(e.target.value) || 0;
              setDuration(hours * 3600 + durationMinutes * 60);
            }}
            style={{ width: "100px" }}
          />
          <span>시간</span>

          <input
            type="number"
            className="input"
            value={durationMinutes}
            min="0"
            max="59"
            onChange={(e) => {
              const minutes = Number(e.target.value) || 0;
              setDuration(durationHours * 3600 + minutes * 60);
            }}
            style={{ width: "100px" }}
          />
          <span>분</span>
        </div>
      </div>

      {/* 팀 목록 */}
      <div className="form-group">
        <label className="form-label">팀 목록</label>

        <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
          <input
            type="text"
            className="input"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="팀 이름"
            style={{ flex: 1, minWidth: "180px" }}
          />

          <input
            type="number"
            className="input"
            value={newTeamScore}
            onChange={(e) => setNewTeamScore(Number(e.target.value))}
            placeholder="초기 점수"
            style={{ width: "140px" }}
          />

          <button type="button" className="button button-primary" onClick={handleAddTeam}>
            추가
          </button>
        </div>

        <div
          className="form-group"
          style={{ display: "flex", flexDirection: "column", justifyContent: "start", gap: "10px" }}
        >
          <label className="form-label">대회 상태</label>
          <div>
            <span
              style={{ borderRadius: "10px", backgroundColor: "blue", color: "white", width: "auto", padding: "5px" }}
            >
              {state}
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="button button-secondary"
              onClick={() => handleStart(id!)}
              style={{ padding: "4px 12px", fontSize: "0.9rem" }}
            >
              시작
            </button>
            <button
              className="button button-secondary"
              onClick={() => handlePause(id!)}
              style={{ padding: "4px 12px", fontSize: "0.9rem" }}
            >
              일시정지
            </button>
            <button
              className="button button-secondary"
              onClick={() => handleResume(id!)}
              style={{ padding: "4px 12px", fontSize: "0.9rem" }}
            >
              재시작
            </button>
            <button
              className="button button-secondary"
              onClick={() => handleClose(id!)}
              style={{ padding: "4px 12px", fontSize: "0.9rem" }}
            >
              중단
            </button>
          </div>
        </div>

        <div>
          {teams.map((team, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px",
                marginBottom: "8px",
                background: "#f9f9f9",
                borderRadius: "6px",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span>{team.name}</span>
                {pageType === PAGE_TYPE.CREATION && (
                  <span style={{ fontSize: "0.85rem", color: "#555" }}>초기 점수: {team.initialScore}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* optional URL */}
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

      {/* 저장 버튼 */}
      <div className="button-group">
        <button className="button button-primary" onClick={handleSave}>
          {pageType === PAGE_TYPE.CREATION ? "등록" : "저장"}
        </button>
        <button className="button button-secondary" onClick={() => navigate("/admin")}>
          취소
        </button>
      </div>
    </div>
  );
};

export default ScoreboardSettingsPage;
