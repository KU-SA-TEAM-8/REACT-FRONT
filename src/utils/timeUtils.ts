// export const formatTime = (seconds: number): string => {
//   const hours = Math.floor(seconds / 3600);
//   const minutes = Math.floor((seconds % 3600) / 60);
//   const secs = seconds % 60;

//   if (hours > 0) {
//     return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   }
//   return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
// };

// export const getElapsedTime = (startTime: number | null, duration: number): { elapsed: number; remaining: number } => {
//   if (!startTime) {
//     return { elapsed: 0, remaining: duration };
//   }

//   const now = Date.now();
//   const elapsedSeconds = Math.floor((now - startTime) / 1000);
//   const remaining = Math.max(0, duration - elapsedSeconds);

//   return {
//     elapsed: Math.min(elapsedSeconds, duration),
//     remaining,
//   };
// };

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// 🔽 여기만 살짝 수정
export const getElapsedTime = (
  startTime: number | string | null,
  duration: number
): { elapsed: number; remaining: number } => {
  if (!startTime) {
    return { elapsed: 0, remaining: duration };
  }

  // 문자열이면 Date.parse로 ms로 변환
  const startMs = typeof startTime === "string" ? Date.parse(startTime) : startTime;

  const now = Date.now();
  const elapsedSeconds = Math.floor((now - startMs) / 1000);
  const remaining = Math.max(0, duration - elapsedSeconds);

  return {
    elapsed: Math.min(elapsedSeconds, duration),
    remaining,
  };
};
