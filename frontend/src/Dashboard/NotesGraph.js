import React, { useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { useNavigate } from "react-router-dom";
import { useNote } from "../Components/NoteContext";
import { FaSyncAlt } from "react-icons/fa";
import "./NotesGraph.css";

const NotesGraph = ({ graphData, onRegenerate, isLoading }) => {
    const navigate = useNavigate();
    const { setSelectedNoteId, setSelectedNoteName } = useNote();
    const graphRef = useRef();
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // Measure container dimensions
    useEffect(() => {
        const updateDimensions = () => {
            const container = document.querySelector('.graph-container');
            if (container) {
                setDimensions({
                    width: container.offsetWidth,
                    height: container.offsetHeight
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Configure force simulation via ref (the documented way)
    useEffect(() => {
        if (graphRef.current) {
            // Set link distance to spread connected nodes apart
            const linkForce = graphRef.current.d3Force('link');
            if (linkForce) {
                linkForce.distance(200);
            }

            // Set charge to prevent overlap
            const chargeForce = graphRef.current.d3Force('charge');
            if (chargeForce) {
                chargeForce.strength(-300);
                chargeForce.distanceMax(500);
            }
        }
    }, [graphData]);

    // Generate consistent color from topic name (works for ANY topic)
    const getTopicColor = (topic) => {
        // Predefined colors for common topics
        const predefinedColors = {
            "Empty": "#6B7280",
            "Work": "#8B5A2B",
            "Personal": "#22C55E",
            "Finance": "#F59E0B",
            "Food": "#EF4444",
            "Home": "#EAB308",
            "Travel": "#0EA5E9",
            "Leisure": "#8B5CF6",
            "Health": "#EC4899",
            "Shopping": "#F472B6",
            "Protected": "#6B7280",
            "Ideas": "#06B6D4",
            "Other": "#6B7280",
            "Uncategorized": "#6B7280"
        };

        if (predefinedColors[topic]) {
            return predefinedColors[topic];
        }

        // Generate color from topic name hash for unknown topics
        let hash = 0;
        for (let i = 0; i < topic.length; i++) {
            hash = topic.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 65%, 55%)`;
    };

    // Get first letter(s) for node display
    const getTopicInitial = (topic) => {
        if (!topic || topic === "Uncategorized" || topic === "Other" || topic === "Empty") {
            return "•";
        }
        // For two-word topics, use both initials (e.g., "Real Estate" -> "RE")
        const words = topic.split(' ');
        if (words.length > 1) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return topic[0].toUpperCase();
    };

    const handleNodeClick = (node) => {
        setSelectedNoteId(node.id);
        setSelectedNoteName(node.label);
        navigate("/notes");
    };

    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
        return (
            <div className="graph-empty-state">
                <div className="graph-empty-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="5" cy="12" r="2" />
                        <circle cx="19" cy="12" r="2" />
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="19" r="2" />
                        <line x1="7" y1="12" x2="17" y2="12" opacity="0.5" />
                        <line x1="12" y1="7" x2="12" y2="17" opacity="0.5" />
                    </svg>
                </div>
                <h3>No Notes to Visualize</h3>
                <p>Create some notes to see them visualized as a semantic network</p>
            </div>
        );
    }

    return (
        <div className="graph-container">
            <div className="graph-controls">
                <button
                    className="refresh-graph-btn"
                    onClick={onRegenerate}
                    disabled={isLoading}
                    title="Regenerate graph with latest notes"
                >
                    <FaSyncAlt className={isLoading ? 'spinning' : ''} /> Refresh
                </button>
            </div>

            <ForceGraph2D
                ref={graphRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                // Rich tooltip on hover - respects theme
                nodeLabel={node => {
                    const isDark = document.body.classList.contains('dark-mode');
                    const bgColor = isDark ? '#1f2937' : '#ffffff';
                    const textColor = isDark ? '#ffffff' : '#1f2937';
                    const mutedColor = isDark ? '#9ca3af' : '#6b7280';
                    return `
                        <div style="background: ${bgColor}; padding: 12px 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); max-width: 250px; border: 2px solid #FFBF00;">
                            <div style="font-weight: 600; font-size: 14px; color: ${textColor}; margin-bottom: 4px;">${node.label}</div>
                            <div style="font-size: 12px; color: ${getTopicColor(node.topic)}; margin-bottom: 8px;">${node.topic}${node.subtopic ? ' • ' + node.subtopic : ''}</div>
                            ${node.preview ? `<div style="font-size: 11px; color: ${mutedColor}; line-height: 1.4;">${node.preview.substring(0, 100)}${node.preview.length > 100 ? '...' : ''}</div>` : ''}
                        </div>
                    `;
                }}
                nodeCanvasObject={(node, ctx, globalScale) => {
                    // Guard: skip if node position not yet calculated
                    if (node.x === undefined || node.y === undefined || !isFinite(node.x) || !isFinite(node.y)) {
                        return;
                    }

                    const nodeSize = node.isProtected ? 45 : 40;
                    const color = getTopicColor(node.topic);
                    const isDarkMode = document.body.classList.contains('dark-mode');

                    // Calculate glow intensity based on content length
                    // Protected notes get neutral intensity since content is hidden
                    let glowIntensity;
                    if (node.isProtected) {
                        glowIntensity = 0.5; // Neutral for protected
                    } else {
                        // Content length affects intensity (preview is truncated so estimate from it)
                        const contentLength = (node.preview?.length || 0);
                        // Map 0-200 chars to 0.15-0.9 intensity with caps
                        const minIntensity = 0.15;
                        const maxIntensity = 0.9;
                        const normalized = Math.min(contentLength / 200, 1);
                        glowIntensity = minIntensity + (normalized * (maxIntensity - minIntensity));
                    }

                    // Draw glow effect - boost opacity in dark mode for visibility
                    const glowRadius = nodeSize + 15 + (glowIntensity * 20);
                    const glowAlpha = isDarkMode ? glowIntensity * 1.3 : glowIntensity; // Brighter in dark mode
                    ctx.save();
                    ctx.globalAlpha = Math.min(glowAlpha, 1); // Cap at 1
                    const gradient = ctx.createRadialGradient(
                        node.x, node.y, nodeSize * 0.2,
                        node.x, node.y, glowRadius
                    );
                    // In dark mode, use a lighter version of the color for better visibility
                    gradient.addColorStop(0, isDarkMode ? '#ffffff' : color);
                    gradient.addColorStop(0.3, color);
                    gradient.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI);
                    ctx.fillStyle = gradient;
                    ctx.fill();
                    ctx.restore();

                    // Draw main node circle
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
                    ctx.fillStyle = color;
                    ctx.fill();

                    // Border
                    ctx.strokeStyle = isDarkMode ? '#1a1a1a' : '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Protected notes get golden ring
                    if (node.isProtected) {
                        ctx.strokeStyle = '#FFBF00';
                        ctx.lineWidth = 3;
                        ctx.stroke();
                    }

                    // Draw initial letter inside node
                    const initial = getTopicInitial(node.topic);
                    const fontSize = initial.length > 1 ? nodeSize * 0.7 : nodeSize * 0.9;
                    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(initial, node.x, node.y + 1);
                }}
                nodePointerAreaPaint={(node, color, ctx) => {
                    const nodeSize = node.isProtected ? 20 : 18;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, nodeSize + 5, 0, 2 * Math.PI);
                    ctx.fillStyle = color;
                    ctx.fill();
                }}
                linkColor={() => 'rgba(120, 120, 120, 0.4)'}
                linkWidth={link => (link.strength || 0.3) * 2}
                linkDirectionalParticles={0}
                onNodeClick={handleNodeClick}
                // Force simulation parameters
                d3AlphaDecay={0.015}
                d3VelocityDecay={0.2}
                cooldownTicks={400}
                onEngineTick={() => {
                    // Custom topic clustering: gently pull same-topic nodes together
                    if (!graphData?.nodes) return;
                    const topicCenters = {};

                    // Calculate center of each topic
                    graphData.nodes.forEach(node => {
                        if (!topicCenters[node.topic]) {
                            topicCenters[node.topic] = { x: 0, y: 0, count: 0 };
                        }
                        if (isFinite(node.x) && isFinite(node.y)) {
                            topicCenters[node.topic].x += node.x;
                            topicCenters[node.topic].y += node.y;
                            topicCenters[node.topic].count++;
                        }
                    });

                    // Average the centers
                    Object.keys(topicCenters).forEach(topic => {
                        if (topicCenters[topic].count > 0) {
                            topicCenters[topic].x /= topicCenters[topic].count;
                            topicCenters[topic].y /= topicCenters[topic].count;
                        }
                    });

                    // Very gently nudge nodes toward their topic center
                    const clusterStrength = 0.008;
                    graphData.nodes.forEach(node => {
                        const center = topicCenters[node.topic];
                        if (center && center.count > 1 && isFinite(node.x) && isFinite(node.y)) {
                            // Only apply clustering if node is far from center
                            const dx = center.x - node.x;
                            const dy = center.y - node.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist > 200) {
                                node.vx = (node.vx || 0) + dx * clusterStrength;
                                node.vy = (node.vy || 0) + dy * clusterStrength;
                            }
                        }
                    });
                }}
                onEngineStop={() => graphRef.current?.zoomToFit(400, 80)}
            />

            <div className="graph-legend">
                <h4>Topics</h4>
                {[...new Set(graphData.nodes.map(n => n.topic))].map(topic => (
                    <div key={topic} className="legend-item">
                        <span
                            className="legend-color"
                            style={{ backgroundColor: getTopicColor(topic) }}
                        />
                        <span>{topic}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotesGraph;

