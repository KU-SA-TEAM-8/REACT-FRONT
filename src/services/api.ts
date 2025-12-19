import { apiClient } from "../utils/apiClient";
import type {
  ScoreboardRequest,
  PatchScoreboardRequest,
  ScoreboardListResponse,
  ScoreboardResponse,
  CompetitionDetail,
  CompetitionDetailResponse,
  ScorePatch,
  ScoreChangeLog,
  CompetitionItem,
} from "../types";

const handleData = <T = any>(res: any): T => res.data;

export const authService = {
  signIn: async (email: string, password: string) => {
    const res = await apiClient.post("auth/sign-in", { email, password });
    return handleData(res);
  },
  signUp: async (name: string, email: string, password: string) => {
    const res = await apiClient.post("auth/sign-up", { name, email, password });
    return handleData(res);
  },
};

export const scoreboardService = {
  fetchScoreboards: async (): Promise<CompetitionItem[]> => {
    const res = await apiClient.get("api/v1/manages/boards/list");
    return handleData<CompetitionItem[]>(res);
  },

  fetchDetailScoreboard: async (id: string): Promise<ScoreboardResponse> => {
    const res = await apiClient.get(`api/v1/competitions/${id}`);
    return handleData<ScoreboardResponse>(res);
  },

  addScoreboard: async (data: ScoreboardRequest) => {
    const res = await apiClient.post("api/v1/competitions", data);
    return handleData(res);
  },

  patchScoreboard: async (id: string, data: PatchScoreboardRequest): Promise<boolean> => {
    const res = await apiClient.patch(`api/v1/competitions/${id}`, data);
    return res.status === 200;
  },

  changeCompState: async (id: string, mode: string): Promise<boolean> => {
    const res = await apiClient.post(`api/v1/competitions/${id}/actions?mode=${mode}`);
    return res.status === 200;
  },

  fetchCompList: async (
    size: number,
    cursorCreatedAt?: string,
    cursorId?: string
  ): Promise<ScoreboardListResponse> => {
    const query =
      cursorCreatedAt && cursorId
        ? `?size=${size}&cursorCreatedAt=${cursorCreatedAt}&cursorId=${cursorId}`
        : `?size=${size}`;
    const res = await apiClient.get(`api/v1/public/scoreboard/list${query}`);
    return handleData<ScoreboardListResponse>(res);
  },

  fetchCompData: async (id: string): Promise<CompetitionDetailResponse> => {
    const res = await apiClient.get(`api/v1/public/scoreboard/${id}`);
    return handleData<CompetitionDetailResponse>(res);
  },

  fetchHistory: async (id: string): Promise<ScoreChangeLog[]> => {
    const res = await apiClient.get(`api/v1/public/scoreboard/${id}/history`);
    return handleData<ScoreChangeLog[]>(res);
  },
};

export const manageService = {
  fetchCompetition: async (publicId: string): Promise<CompetitionDetail> => {
    const res = await apiClient.get(`api/v1/manages/boards/${publicId}`);
    return handleData<CompetitionDetail>(res);
  },

  patchScore: async (compId: string, teamId: string, data: ScorePatch): Promise<boolean> => {
    const res = await apiClient.patch(
      `api/v1/manages/boards/competitions/${compId}/teams/${teamId}/scores`,
      data
    );
    return res.status === 200;
  },
};
