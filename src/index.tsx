import "./main.css";

import { PositionDashboard } from "./components/PositionDashboard";
import { Dashboard } from "./components/Dashboard";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import PositionProvider from "./providers/positions";
import { Toaster } from "./components/ui/toaster";
import SearchInput from "./components/SearchInput";
import MeanFinance from "./images/logo.svg";
import IsoMeanFinance from "./images/isologo.svg";
import { Button } from "./components/ui/button";
import { Link } from "react-router-dom";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="w-full py-2 bg-blue-950 absolute inset-x-0 shadow-lg z-10 min-w-[350px]">
        <header className="max-w-7xl px-3 mx-auto flex justify-between items-center">
          <Link to="/">
            <MeanFinance
              className="hidden lg:block"
              width="200"
              viewBox="0 0 1387 191"
              fill="none"
            />
            <IsoMeanFinance
              className="lg:hidden text-[45px] fill-none"
              width="1em"
              height="1em"
              fill="none"
              viewBox="0 0 315 140"
            />
          </Link>
          <SearchInput className="hidden md:block" />
          <div className="flex gap-2">
            <Button className="md:hidden" asChild>
              <Link to="/">Search</Link>
            </Button>
            <Button className="flex-1">Connect Wallet</Button>
          </div>
        </header>
      </div>
      <main className="w-full max-w-7xl mx-auto px-3 py-5 pt-[80px] relative h-full">
        <div className="absolute bg-gray-300 opacity-20 inset-0 z-[-5]" />
        {children}
      </main>
    </>
  );
};

const App: React.FunctionComponent = () => {
  return (
    <BrowserRouter>
      <PositionProvider>
        <Routes>
          <Route
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
            path="/dashboard/:address"
          />
          <Route
            element={
              <Layout>
                <PositionDashboard />
              </Layout>
            }
            path="/dashboard/:address/:positionId"
          />
          <Route
            index
            element={
              <main className="flex h-[100vh] md:px-3">
                <div className="translate-y-[-100px] m-auto w-full max-w-[600px] flex flex-col gap-7 bg-blue-950 p-10 md:rounded-lg">
                  <MeanFinance
                    className="text-[200px] lg:text-[300px]"
                    width="1em"
                    viewBox="0 0 1387 191"
                    fill="none"
                  />
                  <SearchInput />
                </div>
              </main>
            }
          />
        </Routes>

        <Toaster />
      </PositionProvider>
    </BrowserRouter>
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
