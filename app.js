// ========================================
// GRID//OVERSEER - Agent Simulation Engine
// ========================================

'use strict';

// ========================================
// CONSTANTS & CONFIG
// ========================================

const CONFIG = {
    GRID_SIZE: 20,
    BASE_POSITION: { x: 10, y: 10 },
    TICK_RATE: 125, // ms per tick (8 ticks/sec at 1x)
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    TILE_WIDTH: 32,
    TILE_HEIGHT: 16,
};

const TERRAIN = {
    PLAIN: 'plain',
    RUBBLE: 'rubble',
    WATER: 'water',
};

const AGENT_STATE = {
    IDLE: 'Idle',
    TRAVELING: 'Traveling',
    SCANNING: 'Scanning',
    RETURNING: 'Returning',
    RECHARGING: 'Recharging',
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

function seededRandom(seed) {
    let state = seed;
    return function() {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
}

function distance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function isInBounds(x, y) {
    return x >= 0 && x < CONFIG.GRID_SIZE && y >= 0 && y < CONFIG.GRID_SIZE;
}

// ========================================
// WORLD ENGINE
// ========================================

class WorldEngine {
    constructor() {
        this.grid = [];
        this.initialize();
    }

    initialize() {
        const random = seededRandom(12345);

        for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
            this.grid[y] = [];
            for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
                const tile = {
                    x,
                    y,
                    discovered: false,
                    terrain: this.generateTerrain(x, y, random),
                    pointOfInterest: this.generatePOI(x, y, random),
                };
                this.grid[y][x] = tile;
            }
        }

        // Always discover the base
        const base = CONFIG.BASE_POSITION;
        this.discoverTile(base.x, base.y);
    }

    generateTerrain(x, y, random) {
        // Base is always plain
        if (x === CONFIG.BASE_POSITION.x && y === CONFIG.BASE_POSITION.y) {
            return TERRAIN.PLAIN;
        }

        const r = random();
        if (r < 0.7) return TERRAIN.PLAIN;
        if (r < 0.9) return TERRAIN.RUBBLE;
        return TERRAIN.WATER;
    }

    generatePOI(x, y, random) {
        if (x === CONFIG.BASE_POSITION.x && y === CONFIG.BASE_POSITION.y) {
            return 'BASE';
        }

        if (random() < 0.05) {
            const pois = ['Abandoned Structure', 'Resource Cache', 'Signal Source', 'Artifact Site'];
            return pois[Math.floor(random() * pois.length)];
        }
        return null;
    }

    getTile(x, y) {
        if (!isInBounds(x, y)) return null;
        return this.grid[y][x];
    }

    discoverTile(x, y) {
        const tile = this.getTile(x, y);
        if (tile && !tile.discovered) {
            tile.discovered = true;
            return true;
        }
        return false;
    }

    discoverArea(centerX, centerY, range) {
        const discovered = [];
        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                if (this.discoverTile(x, y)) {
                    discovered.push({ x, y });
                }
            }
        }
        return discovered;
    }

    getUndiscoveredTiles() {
        const tiles = [];
        for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
            for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
                if (!this.grid[y][x].discovered) {
                    tiles.push({ x, y });
                }
            }
        }
        return tiles;
    }
}

// ========================================
// PATHFINDING (A*)
// ========================================

class Pathfinding {
    constructor(world) {
        this.world = world;
    }

    findPath(start, goal) {
        if (!isInBounds(goal.x, goal.y)) return [];
        if (start.x === goal.x && start.y === goal.y) return [];

        const openSet = [start];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const key = (pos) => `${pos.x},${pos.y}`;

        gScore.set(key(start), 0);
        fScore.set(key(start), distance(start, goal));

        while (openSet.length > 0) {
            // Find node with lowest fScore
            openSet.sort((a, b) => fScore.get(key(a)) - fScore.get(key(b)));
            const current = openSet.shift();

            if (current.x === goal.x && current.y === goal.y) {
                return this.reconstructPath(cameFrom, current);
            }

            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                const tentativeG = gScore.get(key(current)) + 1;
                const nKey = key(neighbor);

                if (!gScore.has(nKey) || tentativeG < gScore.get(nKey)) {
                    cameFrom.set(nKey, current);
                    gScore.set(nKey, tentativeG);
                    fScore.set(nKey, tentativeG + distance(neighbor, goal));

                    if (!openSet.find(n => n.x === neighbor.x && n.y === neighbor.y)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        return []; // No path found
    }

    getNeighbors(pos) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // North
            { x: 1, y: 0 },  // East
            { x: 0, y: 1 },  // South
            { x: -1, y: 0 }, // West
        ];

        for (const dir of directions) {
            const x = pos.x + dir.x;
            const y = pos.y + dir.y;

            if (isInBounds(x, y)) {
                const tile = this.world.getTile(x, y);
                // Water is impassable
                if (tile.terrain !== TERRAIN.WATER) {
                    neighbors.push({ x, y });
                }
            }
        }

        return neighbors;
    }

    reconstructPath(cameFrom, current) {
        const path = [];
        const key = (pos) => `${pos.x},${pos.y}`;

        while (cameFrom.has(key(current))) {
            path.unshift(current);
            current = cameFrom.get(key(current));
        }

        return path;
    }
}

// ========================================
// AGENT ENGINE
// ========================================

class Agent {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.battery = 100;
        this.maxBattery = 100;
        this.sensorRange = 2;
        this.speed = 1; // tiles per tick
        this.reliability = 0.95; // 95% chance no malfunction
        this.state = AGENT_STATE.IDLE;
        this.path = [];
        this.mission = null;
        this.ticksInState = 0;
        this.malfunctionDelay = 0;
    }

    update(world, pathfinding, eventLog) {
        this.ticksInState++;

        // Handle malfunction delay
        if (this.malfunctionDelay > 0) {
            this.malfunctionDelay--;
            return;
        }

        // Check for random malfunction
        if (Math.random() > this.reliability) {
            this.malfunctionDelay = Math.floor(Math.random() * 3) + 1;
            eventLog.add(`Agent ${this.id} experiencing minor malfunction`, 'warning');
            return;
        }

        // State machine
        switch (this.state) {
            case AGENT_STATE.IDLE:
                this.handleIdle(world, pathfinding, eventLog);
                break;
            case AGENT_STATE.TRAVELING:
                this.handleTraveling(world, eventLog);
                break;
            case AGENT_STATE.SCANNING:
                this.handleScanning(world, eventLog);
                break;
            case AGENT_STATE.RETURNING:
                this.handleReturning(world, pathfinding, eventLog);
                break;
            case AGENT_STATE.RECHARGING:
                this.handleRecharging(eventLog);
                break;
        }
    }

    handleIdle(world, pathfinding, eventLog) {
        // Check battery
        if (this.battery < 20) {
            this.setState(AGENT_STATE.RETURNING);
            this.planReturnToBase(pathfinding);
            return;
        }

        // If mission assigned, execute it
        if (this.mission) {
            this.executeMission(world, pathfinding, eventLog);
            return;
        }

        // Default behavior: explore nearest undiscovered tile
        const undiscovered = world.getUndiscoveredTiles();
        if (undiscovered.length > 0) {
            const nearest = this.findNearestTile(undiscovered);
            this.path = pathfinding.findPath({ x: this.x, y: this.y }, nearest);
            if (this.path.length > 0) {
                this.setState(AGENT_STATE.TRAVELING);
            }
        }
    }

    handleTraveling(world, eventLog) {
        if (this.path.length === 0) {
            this.setState(AGENT_STATE.SCANNING);
            return;
        }

        // Move along path
        const next = this.path[0];
        this.x = next.x;
        this.y = next.y;
        this.path.shift();

        // Drain battery
        this.battery = Math.max(0, this.battery - 0.5);

        // Check if battery critical
        if (this.battery < 20) {
            this.path = [];
            this.setState(AGENT_STATE.RETURNING);
            eventLog.add(`Agent ${this.id} battery critical, returning to base`, 'warning');
        }
    }

    handleScanning(world, eventLog) {
        // Scan takes 2 ticks
        if (this.ticksInState < 2) {
            this.battery = Math.max(0, this.battery - 0.3);
            return;
        }

        // Discover tiles in sensor range
        const discovered = world.discoverArea(this.x, this.y, this.sensorRange);

        if (discovered.length > 0) {
            eventLog.add(`Agent ${this.id} discovered ${discovered.length} new tiles`, 'success');

            // Check for POIs
            for (const pos of discovered) {
                const tile = world.getTile(pos.x, pos.y);
                if (tile.pointOfInterest) {
                    eventLog.add(`Agent ${this.id} detected ${tile.pointOfInterest} at (${pos.x}, ${pos.y})`, 'info');
                }
            }
        }

        // Complete mission if any
        if (this.mission) {
            this.completeMission(eventLog);
        }

        this.setState(AGENT_STATE.IDLE);
    }

    handleReturning(world, pathfinding, eventLog) {
        if (this.path.length === 0) {
            this.planReturnToBase(pathfinding);
        }

        if (this.path.length === 0) {
            // Already at base
            this.setState(AGENT_STATE.RECHARGING);
            return;
        }

        // Move along path
        const next = this.path[0];
        this.x = next.x;
        this.y = next.y;
        this.path.shift();

        // Drain battery
        this.battery = Math.max(0, this.battery - 0.5);

        // Check if reached base
        if (this.x === CONFIG.BASE_POSITION.x && this.y === CONFIG.BASE_POSITION.y) {
            this.setState(AGENT_STATE.RECHARGING);
            eventLog.add(`Agent ${this.id} reached base, recharging`, 'info');
        }
    }

    handleRecharging(eventLog) {
        this.battery = Math.min(this.maxBattery, this.battery + 5);

        if (this.battery >= this.maxBattery) {
            this.setState(AGENT_STATE.IDLE);
            eventLog.add(`Agent ${this.id} fully recharged`, 'success');
        }
    }

    planReturnToBase(pathfinding) {
        this.path = pathfinding.findPath(
            { x: this.x, y: this.y },
            CONFIG.BASE_POSITION
        );
    }

    findNearestTile(tiles) {
        let nearest = tiles[0];
        let minDist = distance({ x: this.x, y: this.y }, nearest);

        for (const tile of tiles) {
            const dist = distance({ x: this.x, y: this.y }, tile);
            if (dist < minDist) {
                minDist = dist;
                nearest = tile;
            }
        }

        return nearest;
    }

    executeMission(world, pathfinding, eventLog) {
        const target = this.mission.target;
        this.path = pathfinding.findPath({ x: this.x, y: this.y }, target);

        if (this.path.length > 0) {
            this.setState(AGENT_STATE.TRAVELING);
            eventLog.add(`Agent ${this.id} executing mission to (${target.x}, ${target.y})`, 'info');
        } else {
            eventLog.add(`Agent ${this.id} cannot reach mission target`, 'error');
            this.mission = null;
        }
    }

    completeMission(eventLog) {
        if (!this.mission) return;

        const report = this.generateMissionReport();
        eventLog.add(report, 'success');

        this.mission = null;
    }

    generateMissionReport() {
        const templates = [
            `Mission complete. Agent ${this.id} surveyed sector (${this.x}, ${this.y}). Area secured.`,
            `Agent ${this.id} completed exploration of target zone. Data transmitted to base.`,
            `Sector scan finished. Agent ${this.id} returning to standby mode.`,
            `Agent ${this.id} mission successful. No hostile contacts detected.`,
        ];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    setState(newState) {
        this.state = newState;
        this.ticksInState = 0;
    }

    assignMission(mission) {
        this.mission = mission;
        this.setState(AGENT_STATE.IDLE); // Will execute on next tick
    }
}

class AgentEngine {
    constructor(world) {
        this.world = world;
        this.agents = [];
        this.nextId = 1;
        this.pathfinding = new Pathfinding(world);
        this.initialize();
    }

    initialize() {
        // Spawn 3 agents at base
        for (let i = 0; i < 3; i++) {
            this.spawnAgent();
        }
    }

    spawnAgent() {
        const agent = new Agent(
            this.nextId++,
            CONFIG.BASE_POSITION.x,
            CONFIG.BASE_POSITION.y
        );

        // Vary agent stats slightly
        agent.sensorRange = 1 + Math.floor(Math.random() * 3); // 1-3
        agent.reliability = 0.90 + Math.random() * 0.09; // 0.90-0.99

        this.agents.push(agent);
        return agent;
    }

    update(eventLog) {
        for (const agent of this.agents) {
            agent.update(this.world, this.pathfinding, eventLog);
        }
    }

    getAgent(id) {
        return this.agents.find(a => a.id === id);
    }
}

// ========================================
// RENDERER (Isometric)
// ========================================

class Renderer {
    constructor(canvas, world, agentEngine) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.world = world;
        this.agentEngine = agentEngine;
        this.cameraX = 0;
        this.cameraY = 0;
        this.centerCamera();
    }

    centerCamera() {
        const base = CONFIG.BASE_POSITION;
        const screenPos = this.gridToScreen(base.x, base.y);
        this.cameraX = -screenPos.x + this.canvas.width / 2;
        this.cameraY = -screenPos.y + this.canvas.height / 2;
    }

    gridToScreen(gridX, gridY) {
        const x = (gridX - gridY) * (CONFIG.TILE_WIDTH / 2);
        const y = (gridX + gridY) * (CONFIG.TILE_HEIGHT / 2);
        return { x, y };
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0e1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.cameraX, this.cameraY);

        // Render tiles
        for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
            for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
                this.renderTile(x, y);
            }
        }

        // Render agents
        for (const agent of this.agentEngine.agents) {
            this.renderAgent(agent);
        }

        this.ctx.restore();
    }

    renderTile(gridX, gridY) {
        const tile = this.world.getTile(gridX, gridY);
        const screen = this.gridToScreen(gridX, gridY);

        // Isometric diamond shape
        const points = [
            { x: screen.x, y: screen.y - CONFIG.TILE_HEIGHT / 2 }, // Top
            { x: screen.x + CONFIG.TILE_WIDTH / 2, y: screen.y },  // Right
            { x: screen.x, y: screen.y + CONFIG.TILE_HEIGHT / 2 }, // Bottom
            { x: screen.x - CONFIG.TILE_WIDTH / 2, y: screen.y },  // Left
        ];

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.closePath();

        if (tile.discovered) {
            // Terrain colors
            switch (tile.terrain) {
                case TERRAIN.PLAIN:
                    this.ctx.fillStyle = '#2a4a2a';
                    break;
                case TERRAIN.RUBBLE:
                    this.ctx.fillStyle = '#4a3a2a';
                    break;
                case TERRAIN.WATER:
                    this.ctx.fillStyle = '#2a3a4a';
                    break;
            }
            this.ctx.fill();

            // Border
            this.ctx.strokeStyle = '#1a2a2a';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // Base marker
            if (gridX === CONFIG.BASE_POSITION.x && gridY === CONFIG.BASE_POSITION.y) {
                this.ctx.fillStyle = '#4a9eff';
                this.ctx.fillRect(screen.x - 4, screen.y - 4, 8, 8);
            }

            // POI marker
            if (tile.pointOfInterest && tile.pointOfInterest !== 'BASE') {
                this.ctx.fillStyle = '#fbbf24';
                this.ctx.beginPath();
                this.ctx.arc(screen.x, screen.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        } else {
            // Fog of war
            this.ctx.fillStyle = '#0a0e1a';
            this.ctx.fill();
            this.ctx.strokeStyle = '#1a2a2a';
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
        }
    }

    renderAgent(agent) {
        const screen = this.gridToScreen(agent.x, agent.y);

        // Agent body
        this.ctx.fillStyle = '#34d399';
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y - 8, 5, 0, Math.PI * 2);
        this.ctx.fill();

        // State indicator
        let stateColor;
        switch (agent.state) {
            case AGENT_STATE.TRAVELING: stateColor = '#fbbf24'; break;
            case AGENT_STATE.SCANNING: stateColor = '#4a9eff'; break;
            case AGENT_STATE.RETURNING: stateColor = '#f97316'; break;
            case AGENT_STATE.RECHARGING: stateColor = '#34d399'; break;
            default: stateColor = '#9aa0a6';
        }

        this.ctx.fillStyle = stateColor;
        this.ctx.fillRect(screen.x - 2, screen.y - 16, 4, 4);

        // ID label
        this.ctx.fillStyle = '#e8eaed';
        this.ctx.font = '10px Monaco';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(agent.id.toString(), screen.x, screen.y - 20);
    }
}

// ========================================
// EVENT LOG
// ========================================

class EventLog {
    constructor() {
        this.events = [];
        this.maxEvents = 100;
        this.tick = 0;
    }

    add(message, type = 'info') {
        this.events.push({
            tick: this.tick,
            message,
            type,
            timestamp: new Date().toLocaleTimeString(),
        });

        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }

        this.render();
    }

    render() {
        const container = document.getElementById('event-log');
        container.innerHTML = '';

        // Show most recent first
        const recent = this.events.slice(-20).reverse();

        for (const event of recent) {
            const entry = document.createElement('div');
            entry.className = 'event-entry';

            const timestamp = document.createElement('span');
            timestamp.className = 'event-timestamp';
            timestamp.textContent = `[T${event.tick}]`;

            const message = document.createElement('span');
            message.className = `event-message event-type-${event.type}`;
            message.textContent = event.message;

            entry.appendChild(timestamp);
            entry.appendChild(message);
            container.appendChild(entry);
        }
    }

    setTick(tick) {
        this.tick = tick;
    }
}

// ========================================
// MISSION SYSTEM
// ========================================

class MissionSystem {
    constructor(agentEngine, eventLog) {
        this.agentEngine = agentEngine;
        this.eventLog = eventLog;
    }

    assignExploreMission(agentId, targetX, targetY) {
        const agent = this.agentEngine.getAgent(agentId);

        if (!agent) {
            this.eventLog.add(`Agent ${agentId} not found`, 'error');
            return false;
        }

        if (!isInBounds(targetX, targetY)) {
            this.eventLog.add(`Target coordinates out of bounds`, 'error');
            return false;
        }

        const mission = {
            type: 'explore',
            target: { x: targetX, y: targetY },
            assignedAt: Date.now(),
        };

        agent.assignMission(mission);
        this.eventLog.add(`Mission assigned to Agent ${agentId}: Explore (${targetX}, ${targetY})`, 'info');
        return true;
    }
}

// ========================================
// SIMULATION LOOP
// ========================================

class SimulationLoop {
    constructor(world, agentEngine, renderer, eventLog, missionSystem) {
        this.world = world;
        this.agentEngine = agentEngine;
        this.renderer = renderer;
        this.eventLog = eventLog;
        this.missionSystem = missionSystem;
        this.tick = 0;
        this.running = false;
        this.speed = 1;
        this.intervalId = null;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.scheduleNextTick();
        this.eventLog.add('Simulation started', 'success');
    }

    pause() {
        if (!this.running) return;
        this.running = false;
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
        this.eventLog.add('Simulation paused', 'info');
    }

    setSpeed(speed) {
        this.speed = speed;
        this.eventLog.add(`Speed set to ${speed}x`, 'info');

        // Restart if running
        if (this.running) {
            if (this.intervalId) {
                clearTimeout(this.intervalId);
            }
            this.scheduleNextTick();
        }
    }

    scheduleNextTick() {
        if (!this.running) return;

        const delay = CONFIG.TICK_RATE / this.speed;
        this.intervalId = setTimeout(() => {
            this.executeTick();
            this.scheduleNextTick();
        }, delay);
    }

    executeTick() {
        this.tick++;
        this.eventLog.setTick(this.tick);

        // Update agents
        this.agentEngine.update(this.eventLog);

        // Render
        this.renderer.render();

        // Update UI
        document.getElementById('sim-tick').textContent = `Tick: ${this.tick}`;
        document.getElementById('sim-status').textContent = 'RUNNING';
    }
}

// ========================================
// UI CONTROLLER
// ========================================

class UIController {
    constructor(simulation, agentEngine, missionSystem) {
        this.simulation = simulation;
        this.agentEngine = agentEngine;
        this.missionSystem = missionSystem;
        this.selectedAgentId = null;
        this.narrationEnabled = false;
        this.initialize();
    }

    initialize() {
        // Simulation controls
        document.getElementById('btn-play').addEventListener('click', () => {
            this.simulation.start();
        });

        document.getElementById('btn-pause').addEventListener('click', () => {
            this.simulation.pause();
        });

        // Speed controls
        const speedButtons = {
            'btn-speed-1x': 1,
            'btn-speed-2x': 2,
            'btn-speed-4x': 4,
        };

        for (const [id, speed] of Object.entries(speedButtons)) {
            document.getElementById(id).addEventListener('click', () => {
                this.simulation.setSpeed(speed);
                this.updateSpeedButtons(id);
            });
        }

        // Camera controls
        document.getElementById('btn-recenter').addEventListener('click', () => {
            this.simulation.renderer.centerCamera();
            this.simulation.renderer.render();
        });

        // Mission assignment
        document.getElementById('btn-assign-mission').addEventListener('click', () => {
            this.assignMission();
        });

        // Narration toggle
        document.getElementById('toggle-narration').addEventListener('change', (e) => {
            this.narrationEnabled = e.target.checked;
        });

        // Start UI update loop
        this.updateAgentList();
        setInterval(() => this.updateAgentList(), 500);
    }

    updateSpeedButtons(activeId) {
        ['btn-speed-1x', 'btn-speed-2x', 'btn-speed-4x'].forEach(id => {
            document.getElementById(id).classList.toggle('active', id === activeId);
        });
    }

    updateAgentList() {
        const container = document.getElementById('agent-list');
        container.innerHTML = '';

        // Also update mission agent select
        const missionSelect = document.getElementById('mission-agent');
        missionSelect.innerHTML = '<option value="">Select Agent</option>';

        for (const agent of this.agentEngine.agents) {
            // Agent list item
            const item = document.createElement('div');
            item.className = 'agent-item';
            if (this.selectedAgentId === agent.id) {
                item.classList.add('selected');
            }

            const header = document.createElement('div');
            header.className = 'agent-item-header';

            const idSpan = document.createElement('span');
            idSpan.className = 'agent-id';
            idSpan.textContent = `Agent ${agent.id}`;

            const stateSpan = document.createElement('span');
            stateSpan.className = `agent-state ${agent.state}`;
            stateSpan.textContent = agent.state;

            header.appendChild(idSpan);
            header.appendChild(stateSpan);

            const batterySpan = document.createElement('div');
            batterySpan.className = 'agent-battery';
            batterySpan.textContent = `Battery: ${Math.round(agent.battery)}%`;

            item.appendChild(header);
            item.appendChild(batterySpan);

            item.addEventListener('click', () => {
                this.selectAgent(agent.id);
            });

            container.appendChild(item);

            // Mission select option
            const option = document.createElement('option');
            option.value = agent.id;
            option.textContent = `Agent ${agent.id}`;
            missionSelect.appendChild(option);
        }

        // Update selected agent details
        if (this.selectedAgentId) {
            this.updateAgentDetails(this.selectedAgentId);
        }
    }

    selectAgent(agentId) {
        this.selectedAgentId = agentId;
        this.updateAgentList();
    }

    updateAgentDetails(agentId) {
        const agent = this.agentEngine.getAgent(agentId);
        if (!agent) return;

        const container = document.getElementById('agent-details');
        container.innerHTML = '';

        const details = {
            'ID': agent.id,
            'Position': `(${agent.x}, ${agent.y})`,
            'State': agent.state,
            'Battery': `${Math.round(agent.battery)}%`,
            'Sensor Range': agent.sensorRange,
            'Reliability': `${Math.round(agent.reliability * 100)}%`,
            'Mission': agent.mission ? 'Active' : 'None',
        };

        for (const [label, value] of Object.entries(details)) {
            const row = document.createElement('div');
            row.className = 'detail-row';

            const labelSpan = document.createElement('span');
            labelSpan.className = 'detail-label';
            labelSpan.textContent = label;

            const valueSpan = document.createElement('span');
            valueSpan.className = 'detail-value';
            valueSpan.textContent = value;

            row.appendChild(labelSpan);
            row.appendChild(valueSpan);
            container.appendChild(row);
        }
    }

    assignMission() {
        const agentId = parseInt(document.getElementById('mission-agent').value);
        const x = parseInt(document.getElementById('mission-x').value);
        const y = parseInt(document.getElementById('mission-y').value);

        if (!agentId || isNaN(x) || isNaN(y)) {
            alert('Please select an agent and enter valid coordinates');
            return;
        }

        this.missionSystem.assignExploreMission(agentId, x, y);
    }
}

// ========================================
// INITIALIZATION
// ========================================

window.addEventListener('DOMContentLoaded', () => {
    // Initialize engines
    const world = new WorldEngine();
    const agentEngine = new AgentEngine(world);
    const eventLog = new EventLog();
    const missionSystem = new MissionSystem(agentEngine, eventLog);

    // Initialize renderer
    const canvas = document.getElementById('map-canvas');
    const renderer = new Renderer(canvas, world, agentEngine);

    // Initialize simulation loop
    const simulation = new SimulationLoop(world, agentEngine, renderer, eventLog, missionSystem);

    // Initialize UI
    const uiController = new UIController(simulation, agentEngine, missionSystem);

    // Initial render
    renderer.render();

    // Welcome message
    eventLog.add('GRID//OVERSEER system initialized', 'success');
    eventLog.add('3 agents deployed at base station', 'info');
    eventLog.add('Press PLAY to begin simulation', 'info');

    // Update status
    document.getElementById('sim-status').textContent = 'PAUSED';
});
