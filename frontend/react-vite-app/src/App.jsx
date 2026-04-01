import React, { useState } from "react";
import Improve from "./improve";
import "./App.css";

function App() {
  const [history, setHistory] = useState([]);

  const addToHistory = (item) => {
    setHistory((prev) => [item, ...prev]);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="app-container">
      <Improve
        history={history}
        addToHistory={addToHistory}
        clearHistory={clearHistory}
      />
    </div>
  );
}

export default App;