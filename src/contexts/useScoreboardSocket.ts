import { useEffect, useRef } from "react";

export interface Team {
  teamId: string;
  name: string;
  score: number;
}

export interface ScoreHistory {
  teamName: string;
  againstTeamName: string;
  delta: number;
  reason: string;
  changedAt: string;
}

export interface ScoreBoard {
  competitionName: string;
  announcement: string;
  description: string;
  startTime: string; // ISO
  totalTime: number; // seconds
  state: "WAITING" | "RUNNING" | "PAUSED" | "CLOSED";
  teams: Team[];
}

export interface CompetitionDataChangePayload {
  scoreBoard: ScoreBoard;
  scoreHistories: ScoreHistory[];
}

export interface ScoreUpdatePayload {
  teams: Team[];
  scoreHistories: ScoreHistory[];
}

export type WsMessage =
  | { type: "COMPETITION_DATA_CHANGE"; payload: CompetitionDataChangePayload }
  | { type: "SCORE_UPDATE"; payload: ScoreUpdatePayload }
  | { type: "HEARTBEAT" };

export function useScoreboardSocket(onMessage: (msg: WsMessage) => void, options?: { viewerId?: string }) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const url = `wss://familylink.click/ws/scoreboard/${options?.viewerId}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    console.log("[WS] TRY CONNECT", url);

    ws.onopen = () => {
      console.log("[WS] OPEN", url, ws.readyState);
      console.log("[WS] Connected:", url);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "HEARTBEAT") {
          console.log("[WS] HEARTBEAT received → request data again");
          return;
        }

        onMessage(data);
      } catch (err) {
        console.error("[WS] Invalid message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("[WS] Error:", err);
    };

    ws.onclose = () => {
      console.warn("[WS] Closed:", url);
    };

    return () => {
      ws.close();
    };
  }, [onMessage, options?.viewerId]);

  return {
    send: (data: any) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(data));
      }
    },
  };
}
