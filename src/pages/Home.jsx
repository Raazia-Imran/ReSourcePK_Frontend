import React from "react";
import { Navbar } from "../components/common/Navbar";

export const Home = () => {
  return (
    <div>
      <Navbar />
      <div className="p-8">
        <h1 className="text-2xl font-bold">Welcome to ReSource PK</h1>
        <p>Connecting textile deadstock with microbusinesses.</p>
      </div>
    </div>
  );
};