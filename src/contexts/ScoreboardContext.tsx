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
import { scoreboardService, manageService } from "../services/api";

interface ScoreboardContextType {
  fetchHistory: (id: string) => Promise<ScoreChangeLog[]>;
  fetchCompData: (id: string) => Promise<CompetitionDetailResponse>;
  changeCompState: (id: string, mode: string) => Promise<boolean>;
  addScoreboard: (data: ScoreboardRequest) => void;
  fetchCompList: (
    size: number,
    cursorCreatedAt?: string,
    cursorId?: string
  ) => Promise<ScoreboardListResponse>;
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
    return scoreboardService.fetchScoreboards();
  };

  const changeCompState = async (id: string, mode: string) => {
    return scoreboardService.changeCompState(id, mode);
  };

  const fetchDetailScoreboard = async (id: string) => {
    return scoreboardService.fetchDetailScoreboard(id);
  };

  // 대회 생성 API 연동
  const addScoreboard = async (data: ScoreboardRequest) => {
    return scoreboardService.addScoreboard(data);
  };

  const patchScoreboard = async (id: string, data: PatchScoreboardRequest) => {
    return scoreboardService.patchScoreboard(id, data);
  };

  // **********점수 설정************/
  const fetchCompetition = async (publicId: string) => {
    return manageService.fetchCompetition(publicId);
  };

  const patchScore = async (compId: string, teamId: string, data: ScorePatch) => {
    return manageService.patchScore(compId, teamId, data);
  };

  /************************* */

  /*****public scoreboard */
  const fetchCompList = async (size: number, cursorCreatedAt?: string, cursorId?: string) => {
    return scoreboardService.fetchCompList(size, cursorCreatedAt, cursorId);
  };

  const fetchCompData = async (id: string) => {
    return scoreboardService.fetchCompData(id);
  };

  const fetchHistory = async (id: string) => {
    return scoreboardService.fetchHistory(id);
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
