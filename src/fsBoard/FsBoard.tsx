import { useState, useEffect } from "react";
import "./FsBoard.css";

interface Player {
  id: string;
  team: "A" | "B";
  x: number; // grid position
  y: number; // grid position
  influence: number; // 1-10 scale
}

interface Ball {
  x: number;
  y: number;
}

interface Arrow {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  type: "movement" | "pass";
}

interface Zone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: "circle" | "rectangle";
  label?: string;
}

interface Strategy {
  name: string;
  timestamp: number;
  players: Player[];
  ball: Ball;
  arrows: Arrow[];
  zones: Zone[];
  gridX: number;
  gridY: number;
  teamACount: number;
  teamBCount: number;
}

type Orientation = "horizontal" | "vertical";
type DrawingMode =
  | "none"
  | "arrow-movement"
  | "arrow-pass"
  | "zone-circle"
  | "zone-rectangle";

function FsBoard() {
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [gridX, setGridX] = useState(20); // grid cells in X direction
  const [gridY, setGridY] = useState(10); // grid cells in Y direction
  const [teamACount, setTeamACount] = useState(6);
  const [teamBCount, setTeamBCount] = useState(6);
  const [players, setPlayers] = useState<Player[]>([]);
  const [ball, setBall] = useState<Ball>({ x: 10, y: 5 });
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [draggingPlayer, setDraggingPlayer] = useState<string | null>(null);
  const [draggingBall, setDraggingBall] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Drawing tools state
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("none");
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [currentDrawing, setCurrentDrawing] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Strategy management
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [currentStrategyName, setCurrentStrategyName] =
    useState("Untitled Strategy");

  // Initialize players when team counts change
  useEffect(() => {
    const newPlayers: Player[] = [];

    // Team A players - spread out in formation
    const teamAPositions =
      teamACount === 6
        ? [
            { x: 2, y: 5 }, // Goalkeeper
            { x: 5, y: 2 }, // Defender left
            { x: 5, y: 8 }, // Defender right
            { x: 7, y: 4 }, // Midfielder left
            { x: 7, y: 6 }, // Midfielder right
            { x: 9, y: 5 }, // Forward
          ]
        : [
            { x: 2, y: 5 }, // Goalkeeper
            { x: 5, y: 3 }, // Defender left
            { x: 5, y: 7 }, // Defender right
            { x: 7, y: 5 }, // Midfielder
            { x: 9, y: 5 }, // Forward
          ];

    for (let i = 1; i <= teamACount; i++) {
      newPlayers.push({
        id: `A${i}`,
        team: "A",
        x: teamAPositions[i - 1].x,
        y: teamAPositions[i - 1].y,
        influence: 7,
      });
    }

    // Team B players - spread out in formation (mirrored)
    const teamBPositions =
      teamBCount === 6
        ? [
            { x: 18, y: 5 }, // Goalkeeper
            { x: 15, y: 2 }, // Defender left
            { x: 15, y: 8 }, // Defender right
            { x: 13, y: 4 }, // Midfielder left
            { x: 13, y: 6 }, // Midfielder right
            { x: 11, y: 5 }, // Forward
          ]
        : [
            { x: 18, y: 5 }, // Goalkeeper
            { x: 15, y: 3 }, // Defender left
            { x: 15, y: 7 }, // Defender right
            { x: 13, y: 5 }, // Midfielder
            { x: 11, y: 5 }, // Forward
          ];

    for (let i = 1; i <= teamBCount; i++) {
      newPlayers.push({
        id: `B${i}`,
        team: "B",
        x: teamBPositions[i - 1].x,
        y: teamBPositions[i - 1].y,
        influence: 7,
      });
    }

    setPlayers(newPlayers);
  }, [teamACount, teamBCount]);

  // Use grid dimensions directly
  const gridWidth = orientation === "horizontal" ? gridX : gridY;
  const gridHeight = orientation === "horizontal" ? gridY : gridX;
  const cellSize = 40; // pixels

  const handleCellClick = (x: number, y: number) => {
    if (selectedPlayer) {
      setPlayers(
        players.map((p) => (p.id === selectedPlayer ? { ...p, x, y } : p))
      );
      setSelectedPlayer(null);
    }
  };

  const toggleOrientation = () => {
    setOrientation((prev) =>
      prev === "horizontal" ? "vertical" : "horizontal"
    );
  };

  const updateGridX = (value: number) => {
    const newValue = Math.max(5, Math.min(40, value)); // limit between 5-40
    setGridX(newValue);
  };

  const updateGridY = (value: number) => {
    const newValue = Math.max(5, Math.min(40, value)); // limit between 5-40
    setGridY(newValue);
  };

  // Drag handlers for players
  const handlePlayerMouseDown = (
    playerId: string,
    e: React.MouseEvent<SVGCircleElement>
  ) => {
    e.preventDefault();
    setDraggingPlayer(playerId);
    setSelectedPlayer(playerId);
  };

  // Drag handlers for ball
  const handleBallMouseDown = (e: React.MouseEvent<SVGCircleElement>) => {
    e.preventDefault();
    setDraggingBall(true);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridPosX = Math.floor(x / cellSize);
    const gridPosY = Math.floor(y / cellSize);

    // Clamp to grid boundaries
    const clampedX = Math.max(0, Math.min(gridWidth - 1, gridPosX));
    const clampedY = Math.max(0, Math.min(gridHeight - 1, gridPosY));

    // Handle player/ball dragging
    if (draggingPlayer) {
      setPlayers(
        players.map((p) =>
          p.id === draggingPlayer ? { ...p, x: clampedX, y: clampedY } : p
        )
      );
      return;
    } else if (draggingBall) {
      setBall({ x: clampedX, y: clampedY });
      return;
    }

    // Handle drawing mode
    if (isDrawing && drawStart) {
      setCurrentDrawing({ x: clampedX, y: clampedY });
    }
  };

  const handleMouseUp = () => {
    setDraggingPlayer(null);
    setDraggingBall(false);

    // Finish drawing
    if (isDrawing && drawStart && currentDrawing) {
      if (drawingMode === "arrow-movement" || drawingMode === "arrow-pass") {
        const newArrow: Arrow = {
          id: `arrow-${Date.now()}`,
          startX: drawStart.x,
          startY: drawStart.y,
          endX: currentDrawing.x,
          endY: currentDrawing.y,
          color: drawingMode === "arrow-movement" ? "#4096ff" : "#52c41a",
          type: drawingMode === "arrow-movement" ? "movement" : "pass",
        };
        setArrows([...arrows, newArrow]);
      } else if (
        drawingMode === "zone-circle" ||
        drawingMode === "zone-rectangle"
      ) {
        const width = Math.abs(currentDrawing.x - drawStart.x);
        const height = Math.abs(currentDrawing.y - drawStart.y);
        const newZone: Zone = {
          id: `zone-${Date.now()}`,
          x: Math.min(drawStart.x, currentDrawing.x),
          y: Math.min(drawStart.y, currentDrawing.y),
          width: width,
          height: height,
          color:
            drawingMode === "zone-circle"
              ? "rgba(255, 193, 7, 0.2)"
              : "rgba(156, 39, 176, 0.2)",
          type: drawingMode === "zone-circle" ? "circle" : "rectangle",
        };
        setZones([...zones, newZone]);
      }

      setIsDrawing(false);
      setDrawStart(null);
      setCurrentDrawing(null);
    }
  };

  // Handle board click for drawing
  const handleBoardMouseDown = (e: React.MouseEvent<SVGRectElement>) => {
    if (drawingMode === "none") return;

    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridPosX = Math.floor(x / cellSize);
    const gridPosY = Math.floor(y / cellSize);

    setIsDrawing(true);
    setDrawStart({ x: gridPosX, y: gridPosY });
    setCurrentDrawing({ x: gridPosX, y: gridPosY });
  };

  // Strategy management functions
  const saveStrategy = () => {
    const strategy: Strategy = {
      name: currentStrategyName,
      timestamp: Date.now(),
      players,
      ball,
      arrows,
      zones,
      gridX,
      gridY,
      teamACount,
      teamBCount,
    };

    const updatedStrategies = [...strategies, strategy];
    setStrategies(updatedStrategies);
    localStorage.setItem(
      "futsal-strategies",
      JSON.stringify(updatedStrategies)
    );
    alert(`Strategy "${currentStrategyName}" saved!`);
  };

  const loadStrategy = (strategy: Strategy) => {
    setPlayers(strategy.players);
    setBall(strategy.ball);
    setArrows(strategy.arrows);
    setZones(strategy.zones);
    setGridX(strategy.gridX);
    setGridY(strategy.gridY);
    setTeamACount(strategy.teamACount);
    setTeamBCount(strategy.teamBCount);
    setCurrentStrategyName(strategy.name);
  };

  const deleteStrategy = (index: number) => {
    const updatedStrategies = strategies.filter((_, i) => i !== index);
    setStrategies(updatedStrategies);
    localStorage.setItem(
      "futsal-strategies",
      JSON.stringify(updatedStrategies)
    );
  };

  const clearDrawings = () => {
    setArrows([]);
    setZones([]);
  };

  const deleteArrow = (id: string) => {
    setArrows(arrows.filter((a) => a.id !== id));
  };

  const deleteZone = (id: string) => {
    setZones(zones.filter((z) => z.id !== id));
  };

  // Export strategies to JSON file
  const exportStrategies = () => {
    const data = JSON.stringify(strategies, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `futsal-strategies-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import strategies from JSON file
  const importStrategies = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = JSON.parse(content) as Strategy[];

        // Validate imported data
        if (!Array.isArray(imported)) {
          alert("Invalid file format");
          return;
        }

        setStrategies(imported);
        localStorage.setItem("futsal-strategies", JSON.stringify(imported));
        alert(`Successfully imported ${imported.length} strategies!`);
      } catch (error) {
        console.error("Import failed:", error);
        alert("Failed to import strategies. Please check the file format.");
      }
    };
    reader.readAsText(file);

    // Reset input value to allow importing the same file again
    event.target.value = "";
  };

  // Load strategies from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("futsal-strategies");
    if (saved) {
      try {
        setStrategies(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load strategies", e);
      }
    }
  }, []);

  return (
    <div className="fsboard-container">
      {/* Team A Controls - Left Side */}
      <div className="controls team-a-controls">
        <h2>Team A (Blue)</h2>

        <div className="control-group">
          <label>Players:</label>
          <select
            value={teamACount}
            onChange={(e) => setTeamACount(parseInt(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={6}>6</option>
          </select>
        </div>

        <div className="player-list">
          {players
            .filter((p) => p.team === "A")
            .map((p) => (
              <div
                key={p.id}
                className={`player-item ${
                  selectedPlayer === p.id ? "selected" : ""
                }`}
              >
                <button onClick={() => setSelectedPlayer(p.id)}>{p.id}</button>
                <label>
                  Influence:
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={p.influence}
                    onChange={(e) =>
                      setPlayers(
                        players.map((pl) =>
                          pl.id === p.id
                            ? { ...pl, influence: parseInt(e.target.value) }
                            : pl
                        )
                      )
                    }
                  />
                  {p.influence}
                </label>
              </div>
            ))}
        </div>
      </div>

      {/* Center - Board and Controls */}
      <div className="center-section">
        <div className="board-controls">
          <h2>Futsal Strategy Board</h2>

          <div className="controls-row">
            <div className="control-group">
              <label>Orientation:</label>
              <button onClick={toggleOrientation}>
                {orientation === "horizontal"
                  ? "Horizontal (2:1)"
                  : "Vertical (1:2)"}
              </button>
            </div>

            <div className="control-group">
              <label>Grid Width (X):</label>
              <input
                type="number"
                value={gridX}
                onChange={(e) => updateGridX(parseInt(e.target.value) || 20)}
                min="5"
                max="40"
              />
            </div>

            <div className="control-group">
              <label>Grid Height (Y):</label>
              <input
                type="number"
                value={gridY}
                onChange={(e) => updateGridY(parseInt(e.target.value) || 10)}
                min="5"
                max="40"
              />
            </div>
          </div>

          {/* Drawing Tools */}
          <div className="drawing-tools">
            <h3>Drawing Tools</h3>
            <div className="tool-buttons">
              <button
                className={drawingMode === "none" ? "active" : ""}
                onClick={() => setDrawingMode("none")}
              >
                Select
              </button>
              <button
                className={drawingMode === "arrow-movement" ? "active" : ""}
                onClick={() => setDrawingMode("arrow-movement")}
                style={{
                  backgroundColor:
                    drawingMode === "arrow-movement" ? "#4096ff" : "",
                }}
              >
                Movement
              </button>
              <button
                className={drawingMode === "arrow-pass" ? "active" : ""}
                onClick={() => setDrawingMode("arrow-pass")}
                style={{
                  backgroundColor:
                    drawingMode === "arrow-pass" ? "#52c41a" : "",
                }}
              >
                Pass
              </button>
              <button
                className={drawingMode === "zone-circle" ? "active" : ""}
                onClick={() => setDrawingMode("zone-circle")}
                style={{
                  backgroundColor:
                    drawingMode === "zone-circle" ? "#ffc107" : "",
                }}
              >
                Zone (Circle)
              </button>
              <button
                className={drawingMode === "zone-rectangle" ? "active" : ""}
                onClick={() => setDrawingMode("zone-rectangle")}
                style={{
                  backgroundColor:
                    drawingMode === "zone-rectangle" ? "#9c27b0" : "",
                }}
              >
                Zone (Rect)
              </button>
              <button
                onClick={clearDrawings}
                style={{ backgroundColor: "#ff4d4f", color: "#fff" }}
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Strategy Management */}
          <div className="strategy-controls">
            <h3>Strategy Management</h3>
            <div className="strategy-inputs">
              <input
                type="text"
                value={currentStrategyName}
                onChange={(e) => setCurrentStrategyName(e.target.value)}
                placeholder="Strategy name..."
              />
              <button onClick={saveStrategy}>Save Strategy</button>
            </div>

            {/* Export/Import Buttons */}
            <div className="export-import-buttons">
              <button
                onClick={exportStrategies}
                disabled={strategies.length === 0}
                style={{
                  backgroundColor: "#52c41a",
                  color: "#fff",
                  opacity: strategies.length === 0 ? 0.5 : 1,
                  cursor: strategies.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                Export All ({strategies.length})
              </button>
              <label htmlFor="import-file" className="import-button">
                Import from File
              </label>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={importStrategies}
                style={{ display: "none" }}
              />
            </div>

            {strategies.length > 0 && (
              <div className="saved-strategies">
                <h4>Saved Strategies ({strategies.length})</h4>
                <div className="strategy-list">
                  {strategies.map((strategy, index) => (
                    <div key={index} className="strategy-item">
                      <span
                        onClick={() => loadStrategy(strategy)}
                        style={{ cursor: "pointer" }}
                      >
                        {strategy.name}
                      </span>
                      <button onClick={() => deleteStrategy(index)}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="board-wrapper">
          <svg
            className="strategy-board"
            width={gridWidth * cellSize}
            height={gridHeight * cellSize}
            style={{ border: "2px solid #333" }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Draw grid */}
            {Array.from({ length: gridHeight + 1 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={i * cellSize}
                x2={gridWidth * cellSize}
                y2={i * cellSize}
                stroke="#555"
                strokeWidth="1"
              />
            ))}
            {Array.from({ length: gridWidth + 1 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={i * cellSize}
                y1={0}
                x2={i * cellSize}
                y2={gridHeight * cellSize}
                stroke="#555"
                strokeWidth="1"
              />
            ))}

            {/* Draw clickable cells */}
            {Array.from({ length: gridHeight }).map((_, y) =>
              Array.from({ length: gridWidth }).map((_, x) => (
                <rect
                  key={`cell-${x}-${y}`}
                  x={x * cellSize}
                  y={y * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill="transparent"
                  onClick={() => handleCellClick(x, y)}
                  onMouseDown={handleBoardMouseDown}
                  style={{
                    cursor:
                      drawingMode !== "none"
                        ? "crosshair"
                        : selectedPlayer
                        ? "pointer"
                        : "default",
                  }}
                />
              ))
            )}

            {/* Draw zones (behind everything else) */}
            {zones.map((zone) => {
              if (zone.type === "circle") {
                const radiusX = (zone.width * cellSize) / 2;
                const radiusY = (zone.height * cellSize) / 2;
                const cx = zone.x * cellSize + radiusX;
                const cy = zone.y * cellSize + radiusY;
                return (
                  <ellipse
                    key={zone.id}
                    cx={cx}
                    cy={cy}
                    rx={radiusX}
                    ry={radiusY}
                    fill={zone.color}
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="2"
                    onClick={() => deleteZone(zone.id)}
                    style={{ cursor: "pointer" }}
                  />
                );
              } else {
                return (
                  <rect
                    key={zone.id}
                    x={zone.x * cellSize}
                    y={zone.y * cellSize}
                    width={zone.width * cellSize}
                    height={zone.height * cellSize}
                    fill={zone.color}
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="2"
                    onClick={() => deleteZone(zone.id)}
                    style={{ cursor: "pointer" }}
                  />
                );
              }
            })}

            {/* Draw preview zone while drawing */}
            {isDrawing &&
              drawStart &&
              currentDrawing &&
              (drawingMode === "zone-circle" ||
                drawingMode === "zone-rectangle") &&
              (() => {
                const width = Math.abs(currentDrawing.x - drawStart.x);
                const height = Math.abs(currentDrawing.y - drawStart.y);
                const x = Math.min(drawStart.x, currentDrawing.x);
                const y = Math.min(drawStart.y, currentDrawing.y);

                if (drawingMode === "zone-circle") {
                  const radiusX = (width * cellSize) / 2;
                  const radiusY = (height * cellSize) / 2;
                  const cx = x * cellSize + radiusX;
                  const cy = y * cellSize + radiusY;
                  return (
                    <ellipse
                      cx={cx}
                      cy={cy}
                      rx={radiusX}
                      ry={radiusY}
                      fill="rgba(255, 193, 7, 0.2)"
                      stroke="rgba(0,0,0,0.3)"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      pointerEvents="none"
                    />
                  );
                } else {
                  return (
                    <rect
                      x={x * cellSize}
                      y={y * cellSize}
                      width={width * cellSize}
                      height={height * cellSize}
                      fill="rgba(156, 39, 176, 0.2)"
                      stroke="rgba(0,0,0,0.3)"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      pointerEvents="none"
                    />
                  );
                }
              })()}

            {/* Draw goal posts */}
            {/* Left goal (Team A) */}
            <rect
              x={0}
              y={(gridHeight / 2 - 2) * cellSize}
              width={cellSize}
              height={cellSize * 4}
              fill="rgba(100, 150, 255, 0.3)"
              stroke="#4096ff"
              strokeWidth="3"
            />

            {/* Right goal (Team B) */}
            <rect
              x={(gridWidth - 1) * cellSize}
              y={(gridHeight / 2 - 2) * cellSize}
              width={cellSize}
              height={cellSize * 4}
              fill="rgba(255, 100, 100, 0.3)"
              stroke="#ff4d4f"
              strokeWidth="3"
            />

            {/* Draw center line */}
            <line
              x1={(gridWidth * cellSize) / 2}
              y1={0}
              x2={(gridWidth * cellSize) / 2}
              y2={gridHeight * cellSize}
              stroke="#888"
              strokeWidth="2"
              strokeDasharray="5,5"
            />

            {/* Draw arrows */}
            <defs>
              <marker
                id="arrowhead-movement"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill="#4096ff" />
              </marker>
              <marker
                id="arrowhead-pass"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill="#52c41a" />
              </marker>
            </defs>

            {arrows.map((arrow) => (
              <line
                key={arrow.id}
                x1={arrow.startX * cellSize + cellSize / 2}
                y1={arrow.startY * cellSize + cellSize / 2}
                x2={arrow.endX * cellSize + cellSize / 2}
                y2={arrow.endY * cellSize + cellSize / 2}
                stroke={arrow.color}
                strokeWidth="3"
                markerEnd={`url(#arrowhead-${arrow.type})`}
                onClick={() => deleteArrow(arrow.id)}
                style={{ cursor: "pointer" }}
              />
            ))}

            {/* Draw preview arrow while drawing */}
            {isDrawing &&
              drawStart &&
              currentDrawing &&
              (drawingMode === "arrow-movement" ||
                drawingMode === "arrow-pass") && (
                <line
                  x1={drawStart.x * cellSize + cellSize / 2}
                  y1={drawStart.y * cellSize + cellSize / 2}
                  x2={currentDrawing.x * cellSize + cellSize / 2}
                  y2={currentDrawing.y * cellSize + cellSize / 2}
                  stroke={
                    drawingMode === "arrow-movement" ? "#4096ff" : "#52c41a"
                  }
                  strokeWidth="3"
                  strokeDasharray="5,5"
                  markerEnd={`url(#arrowhead-${
                    drawingMode === "arrow-movement" ? "movement" : "pass"
                  })`}
                  pointerEvents="none"
                />
              )}

            {/* Draw influence circles first (so they appear behind players) */}
            {players.map((player) => {
              const influenceRadius = (player.influence / 10) * cellSize * 4;
              return (
                <circle
                  key={`influence-${player.id}`}
                  cx={player.x * cellSize + cellSize / 2}
                  cy={player.y * cellSize + cellSize / 2}
                  r={influenceRadius}
                  fill={
                    player.team === "A"
                      ? "rgba(100, 150, 255, 0.15)"
                      : "rgba(255, 100, 100, 0.15)"
                  }
                  stroke={
                    player.team === "A"
                      ? "rgba(100, 150, 255, 0.3)"
                      : "rgba(255, 100, 100, 0.3)"
                  }
                  strokeWidth="1"
                  pointerEvents="none"
                />
              );
            })}

            {/* Draw ball */}
            <g>
              <circle
                cx={ball.x * cellSize + cellSize / 2}
                cy={ball.y * cellSize + cellSize / 2}
                r={12}
                fill="#fff"
                stroke="#000"
                strokeWidth="2"
                onMouseDown={handleBallMouseDown}
                style={{ cursor: draggingBall ? "grabbing" : "grab" }}
              />
              {/* Ball pattern */}
              <circle
                cx={ball.x * cellSize + cellSize / 2}
                cy={ball.y * cellSize + cellSize / 2}
                r={8}
                fill="none"
                stroke="#000"
                strokeWidth="1"
                pointerEvents="none"
              />
              <path
                d={`M ${ball.x * cellSize + cellSize / 2 - 5} ${
                  ball.y * cellSize + cellSize / 2 - 5
                }
                  L ${ball.x * cellSize + cellSize / 2 + 5} ${
                  ball.y * cellSize + cellSize / 2 + 5
                }
                  M ${ball.x * cellSize + cellSize / 2 + 5} ${
                  ball.y * cellSize + cellSize / 2 - 5
                }
                  L ${ball.x * cellSize + cellSize / 2 - 5} ${
                  ball.y * cellSize + cellSize / 2 + 5
                }`}
                stroke="#000"
                strokeWidth="1"
                pointerEvents="none"
              />
            </g>

            {/* Draw players */}
            {players.map((player) => (
              <g key={player.id}>
                <circle
                  cx={player.x * cellSize + cellSize / 2}
                  cy={player.y * cellSize + cellSize / 2}
                  r={15}
                  fill={player.team === "A" ? "#4096ff" : "#ff4d4f"}
                  stroke={selectedPlayer === player.id ? "#fff" : "#000"}
                  strokeWidth={selectedPlayer === player.id ? 3 : 2}
                  onMouseDown={(e) => handlePlayerMouseDown(player.id, e)}
                  style={{
                    cursor: draggingPlayer === player.id ? "grabbing" : "grab",
                  }}
                />
                <text
                  x={player.x * cellSize + cellSize / 2}
                  y={player.y * cellSize + cellSize / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize="12"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {player.id.substring(1)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Team B Controls - Right Side */}
      <div className="controls team-b-controls">
        <h2>Team B (Red)</h2>

        <div className="control-group">
          <label>Players:</label>
          <select
            value={teamBCount}
            onChange={(e) => setTeamBCount(parseInt(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={6}>6</option>
          </select>
        </div>

        <div className="player-list">
          {players
            .filter((p) => p.team === "B")
            .map((p) => (
              <div
                key={p.id}
                className={`player-item ${
                  selectedPlayer === p.id ? "selected" : ""
                }`}
              >
                <button onClick={() => setSelectedPlayer(p.id)}>{p.id}</button>
                <label>
                  Influence:
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={p.influence}
                    onChange={(e) =>
                      setPlayers(
                        players.map((pl) =>
                          pl.id === p.id
                            ? { ...pl, influence: parseInt(e.target.value) }
                            : pl
                        )
                      )
                    }
                  />
                  {p.influence}
                </label>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default FsBoard;
