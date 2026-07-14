import React, { useState, useEffect, useCallback } from "react";
import Header from "./Header";
import SearchBar from "./SearchBar";
import FilterControls from "./FilterControls";
import NotesGrid from "./NotesGrid";
import NotesGraph from "./NotesGraph";
import EmptyState from "./EmptyState";
import Pagination from "./Pagination";
import { API_BASE_URL } from "../App/config.js";
import "./styles.css";

const Dashboard = ({
  headerColor = "#000000",
  gridGap = 25,
  userNameFont = {
    fontSize: "32px",
    fontWeight: "bold",
    letterSpacing: "-0.03em",
    lineHeight: "1em",
    fontFamily: "sans-serif",
  },
  searchFont = {
    fontSize: "15px",
    fontWeight: "500",
    letterSpacing: "-0.01em",
    lineHeight: "1.3em",
    fontFamily: "sans-serif",
  },
  noteFont = {
    fontSize: "15px",
    fontWeight: "500",
    letterSpacing: "-0.01em",
    lineHeight: "1.3em",
    fontFamily: "sans-serif",
  },
}) => {
  const [username, setUsername] = useState();
  const [notes, setNotes] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'graph'
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const token = localStorage.getItem("token");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(14);



  const fetchNotes = useCallback(async () => {
    try {

      const queryParams = new URLSearchParams({
        page: currentPage,
        limit,
        search: searchTerm,
        sortBy,
        order: sortOrder,
      });

      const response = await fetch(`${API_BASE_URL}/note/dashboard?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setNotes(data.notes || []);
        setTotalPages(Math.ceil(data.totalCount / limit));
      } else {
        console.error("Failed to fetch notes", data.error);
      }
    } catch (err) {
      console.error("Error fetching notes", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, sortBy, sortOrder, currentPage, limit]);

  const fetchGraphData = useCallback(async (force = false) => {
    setIsLoadingGraph(true);
    try {
      const url = force
        ? `${API_BASE_URL}/note/graph?forceRegenerate=true`
        : `${API_BASE_URL}/note/graph`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setGraphData(data);
      } else {
        console.error("Failed to fetch graph data", data.error);
      }
    } catch (err) {
      console.error("Error fetching graph data", err);
    } finally {
      setIsLoadingGraph(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Only fetch graph data once when first switching to graph view
  useEffect(() => {
    if (viewMode === 'graph' && !graphData) {
      fetchGraphData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]); // Removed fetchGraphData dependency to prevent re-fetching

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page
  }, []);

  const handleRegenerateGraph = () => {
    fetchGraphData(true); // Force regeneration
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/user/info`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch user info");
        const data = await response.json();

        setUsername(data.username);
      } catch (err) {
        console.error("Error loading user info:", err);
      }
    };
    fetchUserInfo();
  }, [token]);

  return (
    <div className="notes-dashboard">
      <Header userName={username} viewMode={viewMode} setViewMode={setViewMode} />

      {viewMode === 'grid' && (
        <>
          <div className="search-container">
            <SearchBar
              searchTerm={searchTerm}
              handleSearchChange={handleSearchChange}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
            />

            <FilterControls
              showFilters={showFilters}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          </div>

          {notes.length > 0 ? (
            <>
              <NotesGrid filteredAndSortedNotes={notes} gridGap={gridGap} />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <EmptyState searchTerm={searchTerm} />
          )}
        </>
      )}

      {viewMode === 'graph' && (
        <div className="graph-view-container">
          {isLoadingGraph ? (
            <div className="graph-loading">
              <div className="loading-spinner"></div>
              <p>Analyzing note relationships with AI...</p>
            </div>
          ) : (
            <NotesGraph
              graphData={graphData}
              onRegenerate={handleRegenerateGraph}
              isLoading={isLoadingGraph}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
