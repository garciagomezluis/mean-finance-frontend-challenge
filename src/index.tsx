import { PositionDashboard } from "./components/PositionDashboard";
import { Dashboard } from "./components/Dashboard";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import PositionProvider from "./providers/positions";

const Home = () => null;

const App: React.FunctionComponent = () => {
  return (
    <div>
      <BrowserRouter>
        <PositionProvider>
          <Routes>
            <Route element={<Dashboard />} path="/dashboard/:address" />
            <Route
              element={<PositionDashboard />}
              path="/dashboard/:address/:positionId"
            />
            <Route index element={<Home />} />
          </Routes>
        </PositionProvider>
      </BrowserRouter>
    </div>
  );
};

function bootstrapApplication() {
  const container = document.getElementById("root");
  const root = createRoot(container!);
  root.render(<App />);
}

bootstrapApplication();

if (module.hot) {
  module.hot.accept();
}
