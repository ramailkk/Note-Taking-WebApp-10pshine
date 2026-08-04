import React, { useMemo } from "react";
import "./styles.css";

const Header = ({ userName, loading }) => {
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? "day" : "night";
  };

  const dayGreetings = [
    "Good morning,",
    "Welcome back,",
    "Top of the morning,",
    "Hello again,",
    "Hey there,"
  ];

  const nightGreetings = [
    "Good evening,",
    "Welcome back,",
    "Evening vibes,",
    "Hello again,",
    "Hey there,"
  ];

  const generalGreetings = [
    "Welcome back,",
    "Glad to see you,",
    "You’re back!",
    "Welcome aboard,",
    "Nice to have you back,"
  ];

  const greeting = useMemo(() => {
    const time = getTimeOfDay();
    const pool = [...generalGreetings, ...(time === "day" ? dayGreetings : nightGreetings)];
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  return (
    <div className="dashboard-header">
      <h1 className="welcome-heading fade-in">
        {greeting}{" "}
        {loading ? (
          <span className="nb-skeleton header-name-skeleton" aria-label="Loading name" />
        ) : (
          userName
        )}
      </h1>
    </div>
  );
};

export default Header;
