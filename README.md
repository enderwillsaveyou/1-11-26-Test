# GRID//OVERSEER

A browser-based AI agent simulation prototype featuring autonomous robot agents exploring an isometric grid world with fog-of-war, missions, and tactical systems management.

## Overview

GRID//OVERSEER is a SimCity-style 2.5D tactical simulation where you oversee autonomous robot agents as they explore a procedurally-generated 20x20 grid map. Agents operate independently, managing their battery levels, discovering tiles, detecting points of interest, and responding to assigned missions.

## Features

### Core Systems

- **Isometric Grid World**: 20x20 tile map with procedural terrain generation
- **Fog of War**: Tiles are hidden until discovered by agents
- **Autonomous Agents**: 3 robot units with individual stats and behaviors
- **Battery Management**: Agents automatically return to base when battery is low
- **Pathfinding**: A* algorithm for efficient navigation
- **Mission System**: Assign exploration tasks to specific agents
- **Event Logging**: Real-time activity tracking
- **Deterministic Simulation**: Tick-based game loop with speed controls

### Agent Capabilities

Each agent has:
- **Battery**: 0-100%, drains during movement and scanning
- **Sensor Range**: 1-4 tiles (varies by agent)
- **Speed**: Movement rate (tiles per tick)
- **Reliability**: 90-99% chance of successful operation
- **State Machine**: Idle, Traveling, Scanning, Returning, Recharging

### Terrain Types

- **Plain**: Standard traversable terrain
- **Rubble**: Passable but visually distinct
- **Water**: Impassable obstacle

### Points of Interest

Agents may discover:
- Abandoned Structures
- Resource Caches
- Signal Sources
- Artifact Sites

## Getting Started

### Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- No build tools required
- No external dependencies
- No backend server needed

### Running Locally

#### Option 1: File Protocol (Simplest)

1. Download all files to a folder
2. Open `index.html` directly in your browser

#### Option 2: Local Server (Recommended)

Using Python 3:
```bash
python -m http.server 8000
```

Using Python 2:
```bash
python -m SimpleHTTPServer 8000
```

Using Node.js (if you have `http-server` installed):
```bash
npx http-server
```

Then open: `http://localhost:8000`

## Controls

### Simulation Controls

- **PLAY**: Start the simulation
- **PAUSE**: Pause the simulation
- **Speed Controls**: Adjust simulation speed (1x, 2x, 4x)

### Camera Controls

- **Center on Base**: Recenter the camera on the base station

### Agent Management

- **Click an agent** in the list to view detailed stats
- **Mission Assignment**:
  1. Select an agent from the dropdown
  2. Enter X and Y coordinates (0-19)
  3. Click "Assign Mission"

### Narration Toggle

Enable mission reports for procedurally-generated mission summaries when agents complete tasks.

## How It Works

### Agent Behavior Loop

1. **Idle State**: Agent checks battery and looks for tasks
2. **Low Battery**: If battery < 20%, return to base
3. **Mission Available**: Execute assigned mission
4. **Default Behavior**: Explore nearest undiscovered tile
5. **Traveling**: Move along calculated path, drain battery
6. **Scanning**: Discover tiles within sensor range (2 ticks)
7. **Returning**: Navigate back to base when battery critical
8. **Recharging**: Restore battery at base (+5% per tick)

### Pathfinding

- Uses A* algorithm for optimal path calculation
- Avoids water tiles (impassable)
- Manhattan distance heuristic
- Dynamic replanning on battery warnings

### Fog of War

- All tiles start hidden except the base
- Agents reveal tiles within their sensor range
- Discovered tiles remain visible
- Points of interest only appear when discovered

### Malfunction System

- Each agent has a reliability rating (90-99%)
- On each tick, there's a small chance of malfunction
- Malfunction causes a 1-3 tick delay
- Simulates realistic operational challenges

## File Structure

```
/
├── index.html      - Main HTML structure
├── style.css       - Tactical dashboard styling
├── app.js          - Complete simulation engine
├── README.md       - This file
└── TESTING.md      - Testing checklist
```

## Architecture

### app.js Modules

- **WorldEngine**: Grid management, terrain generation, fog-of-war
- **AgentEngine**: Agent spawning, behavior management
- **Agent**: Individual agent state machine and logic
- **Pathfinding**: A* pathfinding implementation
- **Renderer**: Isometric canvas rendering
- **EventLog**: Event tracking and display
- **MissionSystem**: Mission assignment and completion
- **SimulationLoop**: Main game loop (8 ticks/sec default)
- **UIController**: User interface interactions

### Design Principles

- **Modular**: Each system is self-contained
- **Deterministic**: Seeded random generation for consistency
- **Extensible**: Easy to add new terrain, agents, missions
- **No Dependencies**: Pure vanilla JavaScript
- **Clean Code**: Well-commented, readable structure

## Known Limitations

### v1 Prototype Scope

- Single mission type (explore sector)
- No agent-to-agent communication
- No resource gathering mechanics
- No dynamic base building
- Simple visual style (functional over fancy)
- No save/load system
- Limited camera controls (no zoom/pan)

### Browser Limitations

- Canvas rendering may slow down on very old devices
- No mobile touch controls optimized
- Tested on desktop browsers primarily

## Expansion Ideas

### Near-Term Additions

- **Multiple Mission Types**:
  - Resource collection
  - POI investigation
  - Patrol routes
  - Repair/rescue missions

- **Agent Upgrades**:
  - Battery capacity
  - Sensor range
  - Speed improvements
  - Specialized roles (scout, hauler, engineer)

- **Enhanced World**:
  - Larger maps (40x40, 60x60)
  - Dynamic weather/hazards
  - Multiple bases
  - Construction/mining

### Advanced Features

- **AI Integration**:
  - LLM-generated mission briefings
  - Natural language mission assignment
  - Agent personality/dialogue
  - Procedural event narratives

- **Multiplayer**:
  - Cooperative base management
  - Competitive exploration races
  - Shared world state

- **Strategy Layer**:
  - Tech tree
  - Resource economy
  - Agent production/retirement
  - Base expansion

## Technical Notes

### Performance

- Target: 60 FPS rendering
- Simulation: 8 ticks/second (configurable)
- Tested with 3 agents (supports more)
- Canvas size: 800x600 (adjustable in CONFIG)

### Customization

Edit `CONFIG` object in `app.js` to modify:

```javascript
const CONFIG = {
    GRID_SIZE: 20,           // Map dimensions
    BASE_POSITION: {x:10, y:10},
    TICK_RATE: 125,          // ms per tick
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    TILE_WIDTH: 32,          // Isometric tile size
    TILE_HEIGHT: 16,
};
```

### Color Scheme

Tactical dashboard with dark theme:
- Background: Deep blue-black (#0a0e1a)
- Accent: Cyan blue (#4a9eff)
- Success: Green (#34d399)
- Warning: Yellow (#fbbf24)
- Error: Red (#ef4444)

## Troubleshooting

**Problem**: Canvas not rendering
- Check browser console for errors
- Ensure JavaScript is enabled
- Try using a local server instead of file protocol

**Problem**: Agents not moving
- Click the PLAY button to start simulation
- Check event log for errors
- Verify agents aren't stuck waiting to recharge

**Problem**: Mission won't assign
- Ensure coordinates are 0-19
- Check that agent is selected
- Verify target tile is reachable (not water/blocked)

## Credits

Developed as a v1 prototype for AI agent simulation research.

Built with:
- Vanilla JavaScript (ES6+)
- HTML5 Canvas API
- CSS3

No external libraries or frameworks.

## License

Educational prototype - use freely for learning and experimentation.

---

**Version**: 1.0.0
**Status**: Prototype
**Platform**: Browser (Desktop)
