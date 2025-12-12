/**
 * 관리화면에서 리스트의 하나의 원소의 타입
 */
export interface CompetitionItem {
  competitionId: string;
  manageBoardPublicId: string;
  competitionName: string;
}

/**
 * 대회 생성시 요청 타입
 */
export interface ScoreboardRequest {
  name: string;
  announcement: string;
  description: string;
  startTime: string;
  totalTime: number;
  isPublic: boolean;
  isExternal: boolean;
  team: Team[];
  competitionId?: string;
  publicId?: string;
}

export interface ScoreboardResponse {
  competitionId: string;
  name: string;
  announcement: string;
  description: string;
  startTime: string;
  totalTime: number;
  state: string;
  teams: ResponseTeam[];
}

export interface ResponseTeam {
  teamId: string;
  name: string;
}

interface Team {
  name: string;
  initialScore: number;
}

export interface PatchScoreboardRequest {
  name: string;
  announcement: string;
  description: string;
  startTime: string;
  totalTime: number;
  teams: PatchTeam[];
}

interface PatchTeam {
  teamId: string;
  name: string;
  initialScore: number;
}

/**
 * 상세 대회 정보
 */
export interface CompetitionDetail {
  competitionId: string;
  competitionName: string;
  managerId: string;
  managerName: string;
  teams: DetailTeam[];
}

interface DetailTeam {
  teamId: string;
  teamName: string;
  scoreValue: number;
}

export interface Participant {
  id: string;
  name: string;
  score: number;
  history: string[];
  logoUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: number;
}

export interface ScorePatch {
  delta: number;
  reason: string;
  eventType: string;
  policyType: string;
}

// 대회 리스트
export interface ScoreboardListResponse {
  scoreBoardRows: ScoreboardRow[];
  nextCursorCreatedAt: string | null;
  nextCursorId: string | null;
}

export interface ScoreboardRow {
  publicId: string;
  name: string;
  startTime: string; // ISO 8601 datetime string
  totalTime: number;
  state: string;
}

// 단일 대회 정보
export interface CompetitionTeam {
  teamId: string; // UUID
  name: string;
  score: number;
}

export interface CompetitionDetailResponse {
  competitionName: string;
  announcement: string;
  description: string;
  startTime: string; // ISO 8601 datetime string
  totalTime: number;
  state: string;
  teams: CompetitionTeam[];
}

export interface ScoreChangeLog {
  teamName: string;
  againstTeamName: string;
  delta: number; // 점수 증감 값 (+ / -)
  reason: string; // 변경 사유
  changedAt: string; // ISO 8601 datetime string
}
