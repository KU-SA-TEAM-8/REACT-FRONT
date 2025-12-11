import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Scoreboard, Participant } from "../types";
import { apiClient } from "../utils/apiClient";

interface ScoreboardContextType {
  scoreboards: Scoreboard[];
  addScoreboard: (scoreboard: Omit<Scoreboard, "id" | "createdAt" | "viewerId">) => Promise<string>;
  updateScoreboard: (id: string, updates: Partial<Scoreboard>) => Promise<void>;
  getScoreboard: (id: string) => Scoreboard | undefined;
  deleteScoreboard: (id: string) => void;
  updateParticipantScore: (
    scoreboardId: string,
    participantId: string,
    score: number,
    history?: string
  ) => void;
  startScoreboard: (id: string) => Promise<void>;
  stopScoreboard: (id: string) => Promise<void>;
  closeScoreboard: (id: string) => Promise<void>;
  restartScoreboard: (id: string, mode?: "resume" | "reset") => Promise<void>;
  // 팀 관리 함수 추가
  addTeam: (competitionId: string, name: string, logoUrl?: string) => Promise<void>;
  updateTeam: (
    competitionId: string,
    teamId: string,
    name: string,
    logoUrl?: string
  ) => Promise<void>;
  deleteTeam: (competitionId: string, teamId: string) => Promise<void>;
  // 점수판 미리보기
  getScoreboardPreview: (competitionId: string) => Promise<Scoreboard>;
}

const ScoreboardContext = createContext<ScoreboardContextType | undefined>(undefined);

export const useScoreboard = () => {
  const context = useContext(ScoreboardContext);
  if (!context) {
    throw new Error("useScoreboard must be used within ScoreboardProvider");
  }
  return context;
};

export const ScoreboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [scoreboards, setScoreboards] = useState<Scoreboard[]>(() => {
    const saved = localStorage.getItem("scoreboards");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("scoreboards", JSON.stringify(scoreboards));
  }, [scoreboards]);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  // 대회 생성 API 연동
  const addScoreboard = async (
    scoreboardData: Omit<Scoreboard, "id" | "createdAt" | "viewerId">
  ): Promise<string> => {
    try {
      // startTime 설정: null이면 현재 시간으로 설정
      const startTimeValue = scoreboardData.startTime
        ? new Date(scoreboardData.startTime)
        : new Date();
      const startTime = startTimeValue.toISOString();

      // totalTime 계산: startTime + duration (초)
      const totalTimeSeconds = scoreboardData.duration || 3600;
      const totalTime = new Date(startTimeValue.getTime() + totalTimeSeconds * 1000).toISOString();

      const requestBody = {
        name: scoreboardData.name,
        announcement: scoreboardData.notice || "",
        totalTime: totalTime,
        startTime: startTime,
      };

      console.log("대회 생성 요청 데이터:", requestBody);

      const response = await apiClient.post("/api/v1/competitions", requestBody);

      if (response.status === 201) {
        const { competitionManageBoardId, competitionId, publicId } = response.data;

        // 로컬 상태에 저장
        const id = competitionId.toString();
        const viewerId = publicId || generateId();
        const adminId = competitionManageBoardId.toString();

        const newScoreboard: Scoreboard = {
          ...scoreboardData,
          id,
          viewerId,
          adminId,
          createdAt: Date.now(),
        };

        setScoreboards((prev) => [...prev, newScoreboard]);
        return id;
      }

      throw new Error("대회 생성에 실패했습니다.");
    } catch (error: any) {
      console.error("대회 생성 오류:", error);
      // 에러 발생 시에도 로컬에 저장 (fallback)
      const id = generateId();
      const viewerId = generateId();
      const newScoreboard: Scoreboard = {
        ...scoreboardData,
        id,
        viewerId,
        createdAt: Date.now(),
      };
      setScoreboards((prev) => [...prev, newScoreboard]);
      return id;
    }
  };

  // 대회 설정 수정 API 연동
  const updateScoreboard = async (id: string, updates: Partial<Scoreboard>) => {
    try {
      const scoreboard = scoreboards.find((sb) => sb.id === id);
      if (!scoreboard) {
        throw new Error("점수판을 찾을 수 없습니다.");
      }

      const requestData: any = {};

      // name 업데이트
      if (updates.name !== undefined) {
        requestData.name = updates.name;
      }

      // announcement 업데이트
      if (updates.notice !== undefined) {
        requestData.announcement = updates.notice;
      }

      // startTime과 duration 처리
      const finalStartTime =
        updates.startTime !== undefined && updates.startTime !== null
          ? new Date(updates.startTime)
          : scoreboard.startTime && scoreboard.startTime !== null
          ? new Date(scoreboard.startTime)
          : new Date();

      const finalDuration =
        updates.duration !== undefined ? updates.duration : scoreboard.duration || 3600;

      // startTime 설정
      requestData.startTime = finalStartTime.toISOString();

      // totalTime 계산: startTime + duration
      const totalTime = new Date(finalStartTime.getTime() + finalDuration * 1000).toISOString();
      requestData.totalTime = totalTime;

      console.log("대회 설정 수정 요청 데이터:", requestData);

      const response = await apiClient.patch(`/api/v1/competitions/${id}`, requestData);

      if (response.status === 200) {
        // 로컬 상태 업데이트
        setScoreboards((prev) => prev.map((sb) => (sb.id === id ? { ...sb, ...updates } : sb)));
      }
    } catch (error: any) {
      console.error("대회 설정 수정 오류:", error);
      // 에러 발생 시에도 로컬 상태 업데이트 (fallback)
      setScoreboards((prev) => prev.map((sb) => (sb.id === id ? { ...sb, ...updates } : sb)));
    }
  };

  const getScoreboard = (id: string): Scoreboard | undefined => {
    return scoreboards.find((sb) => sb.id === id || sb.viewerId === id);
  };

  const deleteScoreboard = (id: string) => {
    setScoreboards((prev) => prev.filter((sb) => sb.id !== id));
  };

  const updateParticipantScore = (
    scoreboardId: string,
    participantId: string,
    score: number,
    history?: string
  ) => {
    setScoreboards((prev) =>
      prev.map((sb) => {
        if (sb.id === scoreboardId) {
          const updatedParticipants = sb.participants.map((p) => {
            if (p.id === participantId) {
              const newScore = p.score + score;
              const newHistory = history
                ? [...p.history, `${new Date().toLocaleTimeString()}: ${history}`]
                : p.history;
              return { ...p, score: newScore, history: newHistory };
            }
            return p;
          });
          return { ...sb, participants: updatedParticipants };
        }
        return sb;
      })
    );
  };

  // 대회 시작 API 연동
  const startScoreboard = async (id: string) => {
    try {
      const response = await apiClient.post(`/api/v1/competitions/${id}/actions`, {
        mode: "start",
      });

      if (response.status === 200) {
        setScoreboards((prev) =>
          prev.map((sb) => (sb.id === id ? { ...sb, isRunning: true, startTime: Date.now() } : sb))
        );
      }
    } catch (error: any) {
      console.error("대회 시작 오류:", error);
      // 에러 발생 시에도 로컬 상태 업데이트 (fallback)
      setScoreboards((prev) =>
        prev.map((sb) => (sb.id === id ? { ...sb, isRunning: true, startTime: Date.now() } : sb))
      );
    }
  };

  // 대회 중지 API 연동
  const stopScoreboard = async (id: string) => {
    try {
      const response = await apiClient.post(`/api/v1/competitions/${id}/actions`, {
        mode: "stop",
      });

      if (response.status === 200) {
        setScoreboards((prev) =>
          prev.map((sb) => (sb.id === id ? { ...sb, isRunning: false } : sb))
        );
      }
    } catch (error: any) {
      console.error("대회 중지 오류:", error);
      // 에러 발생 시에도 로컬 상태 업데이트 (fallback)
      setScoreboards((prev) => prev.map((sb) => (sb.id === id ? { ...sb, isRunning: false } : sb)));
    }
  };

  // 대회 종료 API 연동
  const closeScoreboard = async (id: string) => {
    try {
      const response = await apiClient.post(`/api/v1/competitions/${id}/actions`, {
        mode: "close",
      });

      if (response.status === 200) {
        setScoreboards((prev) =>
          prev.map((sb) => (sb.id === id ? { ...sb, isRunning: false } : sb))
        );
      }
    } catch (error: any) {
      console.error("대회 종료 오류:", error);
      // 에러 발생 시에도 로컬 상태 업데이트 (fallback)
      setScoreboards((prev) => prev.map((sb) => (sb.id === id ? { ...sb, isRunning: false } : sb)));
    }
  };

  // 대회 재시작 API 연동
  const restartScoreboard = async (id: string, mode: "resume" | "reset" = "reset") => {
    try {
      const response = await apiClient.post(`/api/v1/competitions/${id}/restart`, {
        mode: mode,
      });

      if (response.status === 200) {
        setScoreboards((prev) =>
          prev.map((sb) =>
            sb.id === id
              ? {
                  ...sb,
                  isRunning: mode === "resume",
                  startTime: mode === "resume" ? Date.now() : null,
                  participants:
                    mode === "reset"
                      ? sb.participants.map((p) => ({ ...p, score: 0, history: [] }))
                      : sb.participants,
                }
              : sb
          )
        );
      }
    } catch (error: any) {
      console.error("대회 재시작 오류:", error);
      // 에러 발생 시에도 로컬 상태 업데이트 (fallback)
      setScoreboards((prev) =>
        prev.map((sb) =>
          sb.id === id
            ? {
                ...sb,
                isRunning: false,
                startTime: null,
                participants: sb.participants.map((p) => ({ ...p, score: 0, history: [] })),
              }
            : sb
        )
      );
    }
  };

  // 팀 등록 API 연동
  const addTeam = async (competitionId: string, name: string, logoUrl?: string) => {
    try {
      const response = await apiClient.post(`/api/v1/competitions/${competitionId}/teams`, {
        name,
        logoUrl: logoUrl || "",
      });

      if (response.status === 201 || response.status === 200) {
        // 팀이 추가되면 점수판의 참여자 목록에 추가
        const scoreboard = scoreboards.find((sb) => sb.id === competitionId);
        if (scoreboard) {
          const newParticipant: Participant = {
            id: response.data?.id?.toString() || generateId(),
            name,
            score: 0,
            history: [],
          };
          setScoreboards((prev) =>
            prev.map((sb) =>
              sb.id === competitionId
                ? { ...sb, participants: [...sb.participants, newParticipant] }
                : sb
            )
          );
        }
      }
    } catch (error: any) {
      console.error("팀 등록 오류:", error);
      throw error;
    }
  };

  // 팀 수정 API 연동
  const updateTeam = async (
    competitionId: string,
    teamId: string,
    name: string,
    logoUrl?: string
  ) => {
    try {
      const response = await apiClient.patch(
        `/api/v1/competitions/${competitionId}/teams/${teamId}`,
        {
          name,
          logoUrl: logoUrl || "",
        }
      );

      if (response.status === 200) {
        // 로컬 상태 업데이트
        setScoreboards((prev) =>
          prev.map((sb) =>
            sb.id === competitionId
              ? {
                  ...sb,
                  participants: sb.participants.map((p) => (p.id === teamId ? { ...p, name } : p)),
                }
              : sb
          )
        );
      }
    } catch (error: any) {
      console.error("팀 수정 오류:", error);
      throw error;
    }
  };

  // 팀 삭제 API 연동
  const deleteTeam = async (competitionId: string, teamId: string) => {
    try {
      const response = await apiClient.delete(
        `/api/v1/competitions/${competitionId}/teams/${teamId}`
      );

      if (response.status === 204) {
        // 로컬 상태 업데이트
        setScoreboards((prev) =>
          prev.map((sb) =>
            sb.id === competitionId
              ? { ...sb, participants: sb.participants.filter((p) => p.id !== teamId) }
              : sb
          )
        );
      }
    } catch (error: any) {
      console.error("팀 삭제 오류:", error);
      throw error;
    }
  };

  // 점수판 미리보기 API 연동
  const getScoreboardPreview = async (competitionId: string) => {
    try {
      const response = await apiClient.get(
        `/api/v1/competitions/${competitionId}/scoreboard/preview`
      );

      if (response.status === 200) {
        const { competition, teams, scoreboard } = response.data;

        // 응답 데이터를 로컬 Scoreboard 형식으로 변환
        const participants: Participant[] = teams.map((team: any) => ({
          id: team.id.toString(),
          name: team.name,
          score: team.score || 0,
          history: [],
        }));

        const scoreboardData: Scoreboard = {
          id: competition.id.toString(),
          name: competition.name || "",
          adminId: scoreboard?.publicId || generateId(),
          viewerId: scoreboard?.publicId || generateId(),
          notice: "",
          duration: 3600,
          startTime: null,
          isRunning: competition.status === "RUNNING",
          participants,
          createdAt: Date.now(),
        };

        // 로컬 상태 업데이트 또는 반환
        return scoreboardData;
      }

      throw new Error("점수판 미리보기를 불러올 수 없습니다.");
    } catch (error: any) {
      console.error("점수판 미리보기 오류:", error);
      throw error;
    }
  };

  return (
    <ScoreboardContext.Provider
      value={{
        scoreboards,
        addScoreboard,
        updateScoreboard,
        getScoreboard,
        deleteScoreboard,
        updateParticipantScore,
        startScoreboard,
        stopScoreboard,
        closeScoreboard,
        restartScoreboard,
        addTeam,
        updateTeam,
        deleteTeam,
        getScoreboardPreview,
      }}
    >
      {children}
    </ScoreboardContext.Provider>
  );
};
