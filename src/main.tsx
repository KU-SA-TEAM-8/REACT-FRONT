import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// MSW 초기화 (개발 환경에서만)
// async function enableMocking() {
//   if (import.meta.env.MODE !== "development") {
//     return;
//   }

//   const { worker } = await import("./mocks/browser");
//   return worker.start({
//     onUnhandledRequest: "bypass",
//   });
// }

// enableMocking().then(() => {
//   ReactDOM.createRoot(document.getElementById("root")!).render(
//     <React.StrictMode>
//       <App />
//     </React.StrictMode>
//   );
// });

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
