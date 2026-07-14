import { createContext, useContext, useState } from "react";

const SideContext = createContext();

export const SideProvider = ({ children }) => {
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem("activeSection") || "home";
  });

  const resetSideContext = () => {
    setActiveSection(null);
  };

  return (
    <SideContext.Provider
      value={{
        activeSection,
        setActiveSection,
        resetSideContext
      }}
    >
      {children}
    </SideContext.Provider>
  );
};

export const useSide = () => useContext(SideContext);
