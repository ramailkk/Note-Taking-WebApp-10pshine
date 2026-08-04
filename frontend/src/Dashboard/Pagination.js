import React from "react";
import "./styles.css";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];

  for (let i = 1; i <= totalPages; i++) {
    pages.push(
      <button
        key={i}
        onClick={() => onPageChange(i)}
        className={`pagination-btn ${i === currentPage ? "active" : ""}`}
      >
        {i}
      </button>
    );
  }

  return <div className="pagination-bar">{pages}</div>;
};

export default Pagination;
