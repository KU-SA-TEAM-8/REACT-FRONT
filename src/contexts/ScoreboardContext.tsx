import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  ScoreboardRequest,
  ScoreboardResponse,
  CompetitionItem,
  ScorePatch,
  CompetitionDetail,
  PatchScoreboardRequest,
  ScoreboardListResponse,
  CompetitionDetailResponse,
  ScoreChangeLog,
} from "../types";
import { apiClient } from "../utils/apiClient";

interface ScoreboardContextType {
  fetchHistory: (id: string) => Promise<ScoreChangeLog[]>;
  fetchCompData: (id: string) => Promise<CompetitionDetailResponse>;
  changeCompState: (id: string, mode: string) => Promise<boolean>;
  addScoreboard: (data: ScoreboardRequest) => void;
  fetchCompList: (size: number, cursorCreatedAt?: string, cursorId?: string) => Promise<ScoreboardListResponse>;
  fetchScoreboards: () => Promise<CompetitionItem[]>;
  patchScoreboard: (id: string, data: PatchScoreboardRequest) => Promise<boolean>;
  fetchDetailScoreboard: (id: string) => Promise<ScoreboardResponse | undefined>;
  fetchCompetition: (publicId: string) => Promise<CompetitionDetail>;
  patchScore: (compId: string, teamId: string, data: ScorePatch) => Promise<boolean>;
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
  const fetchScoreboards = async () => {
    const response = await apiClient.get("/api/v1/manages/boards/list");
    if (response.status === 200) {
      return response.data;
    }
  };

  const changeCompState = async (id: string, mode: string) => {
    const response = await apiClient.post(`/api/v1/competitions/${id}/actions?mode=${mode}`);
    if (response.status === 200) {
      return true;
    } else {
      return false;
    }
  };

  const fetchDetailScoreboard = async (id: string) => {
    const response = await apiClient.get(`/api/v1/competitions/${id}`);
    if (response.status === 200) {
      return response.data;
    }
  };

  // 대회 생성 API 연동
  const addScoreboard = async (data: ScoreboardRequest) => {
    const response = await apiClient.post("/api/v1/competitions", data);
    if (response.status === 200) {
      return response.data;
    }
  };

  const patchScoreboard = async (id: string, data: PatchScoreboardRequest) => {
    const response = await apiClient.patch(`/api/v1/competitions/${id}`, data);
    if (response.status === 200) {
      return true;
    } else {
      return false;
    }
  };

  // **********점수 설정************/
  const fetchCompetition = async (publicId: string) => {
    const response = await apiClient.get(`api/v1/manages/boards/${publicId}`);
    if (response.status === 200) {
      return response.data;
    }
  };

  const patchScore = async (compId: string, teamId: string, data: ScorePatch) => {
    const response = await apiClient.patch(
      `/api/v1/manages/boards/competitions/${compId}/teams/${teamId}/scores`,
      data
    );
    if (response.status === 200) {
      return true;
    } else {
      return false;
    }
  };

  /************************* */

  /*****public scoreboard */
  const fetchCompList = async (size: number, cursorCreatedAt?: string, cursorId?: string) => {
    let response;
    if (cursorCreatedAt && cursorId) {
      response = await apiClient.get(
        `api/v1/public/scoreboard/list?size=${size}&cursorCreatedAt=${cursorCreatedAt}&cursorId=${cursorId}`
      );
    } else {
      response = await apiClient.get(`api/v1/public/scoreboard/list?size=${size}`);
    }

    if (response.status === 200) {
      return response.data;
    }
  };

  const fetchCompData = async (id: string) => {
    const response = await apiClient.get(`api/v1/public/scoreboard/${id}`);
    if (response.status === 200) {
      return response.data;
    }
  };

  const fetchHistory = async (id: string) => {
    const response = await apiClient.get(`api/v1/public/scoreboard/${id}/history`);
    if (response.status === 200) {
      return response.data;
    }
  };

  return (
    <ScoreboardContext.Provider
      value={{
        fetchHistory,
        fetchCompData,
        fetchCompList,
        changeCompState,
        fetchDetailScoreboard,
        addScoreboard,
        fetchScoreboards,
        patchScoreboard,
        fetchCompetition,
        patchScore,
      }}
    >
      {children}
    </ScoreboardContext.Provider>
  );
};
