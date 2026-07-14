import React from "react";
import ReactDOM from "react-dom/client";
import "./theme.css";
import "./index.css";
import App from "./App/App";
import reportWebVitals from "./reportWebVitals";
import { AuthProvider } from "./Authentication/AuthContext";
import { NoteProvider } from "./Components/NoteContext";
import { SideProvider } from "./Components/SidebarContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <SideProvider>
      <NoteProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </NoteProvider>
    </SideProvider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
