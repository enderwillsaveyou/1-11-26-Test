# GRID//OVERSEER - Testing Checklist

This document provides a comprehensive testing checklist for validating the GRID//OVERSEER simulation prototype.

## Smoke Test Checklist

### Initial Load

- [ ] Page loads without errors
- [ ] No console errors on load
- [ ] Canvas renders correctly
- [ ] All UI panels visible
- [ ] Event log shows initialization messages
- [ ] Status displays "PAUSED"
- [ ] Tick counter shows "Tick: 0"

### Visual Validation

- [ ] Isometric grid is visible
- [ ] Base station (blue square) is visible at center
- [ ] 3 agent markers (green circles) visible at base
- [ ] Fog-of-war (dark tiles) covers most of map
- [ ] Base area is revealed
- [ ] UI panels have correct styling
- [ ] Text is readable and properly styled

## Simulation Controls

### Play/Pause

- [ ] Click PLAY - simulation starts
- [ ] Status changes to "RUNNING"
- [ ] Tick counter increments
- [ ] Agents begin moving
- [ ] Click PAUSE - simulation stops
- [ ] Status changes to "PAUSED"
- [ ] Tick counter stops incrementing
- [ ] Agents stop moving

### Speed Controls

- [ ] Click 1x - normal speed
- [ ] Click 2x - simulation runs faster
- [ ] Click 4x - simulation runs fastest
- [ ] Active button highlighted correctly
- [ ] Event log shows speed change message

### Camera Controls

- [ ] Click "Center on Base" - camera recenters
- [ ] Base visible in center of canvas
- [ ] Camera position resets correctly

## Agent Behavior Tests

### Autonomous Exploration

**Setup**: Start simulation with default agents

- [ ] Agents automatically move from base
- [ ] Agents travel to undiscovered tiles
- [ ] Agents discover tiles along their path
- [ ] Fog-of-war lifts as agents explore
- [ ] Agents continue exploring new areas
- [ ] Multiple agents explore different directions

### Battery Management

**Setup**: Run simulation for 100+ ticks

- [ ] Agent battery drains while moving
- [ ] Battery percentage decreases in agent list
- [ ] Agent returns to base when battery < 20%
- [ ] Agent state changes to "Returning"
- [ ] Event log shows battery warning
- [ ] Agent navigates back to base successfully

### Recharging

**Setup**: Wait for agent to return to base with low battery

- [ ] Agent reaches base position
- [ ] State changes to "Recharging"
- [ ] Battery percentage increases
- [ ] Event log shows "reached base, recharging"
- [ ] Battery reaches 100%
- [ ] Agent changes to "Idle" when fully charged
- [ ] Event log shows "fully recharged"
- [ ] Agent resumes exploration

### Pathfinding

**Setup**: Assign missions to various locations

- [ ] Agent calculates path to target
- [ ] Agent follows path correctly
- [ ] Agent avoids water tiles
- [ ] Agent finds alternative routes when blocked
- [ ] Agent recalculates path if needed
- [ ] Path is reasonably efficient

### Scanning Behavior

**Setup**: Watch agent reach undiscovered area

- [ ] Agent stops at destination
- [ ] State changes to "Scanning"
- [ ] Scanning takes 2 ticks
- [ ] Tiles within sensor range are discovered
- [ ] Event log shows discovery message
- [ ] POIs detected and logged if present
- [ ] Agent returns to Idle after scanning

### State Transitions

Verify correct state flow:

- [ ] Idle → Traveling (when mission/exploration target found)
- [ ] Traveling → Scanning (when destination reached)
- [ ] Scanning → Idle (after scan complete)
- [ ] Any State → Returning (when battery < 20%)
- [ ] Returning → Recharging (when base reached)
- [ ] Recharging → Idle (when battery full)

### Malfunction System

**Setup**: Run simulation for extended period (200+ ticks)

- [ ] Agents occasionally experience malfunctions
- [ ] Event log shows malfunction warnings
- [ ] Agent pauses briefly during malfunction
- [ ] Agent resumes operation after delay
- [ ] Malfunctions don't crash simulation

## Agent Selection & Details

### Selection

- [ ] Click agent in list - agent is selected
- [ ] Selected agent highlighted in list
- [ ] Agent details panel updates
- [ ] Click another agent - selection changes

### Detail Display

For selected agent, verify display shows:

- [ ] Agent ID
- [ ] Current position (x, y)
- [ ] Current state
- [ ] Battery percentage
- [ ] Sensor range
- [ ] Reliability percentage
- [ ] Mission status

### Real-Time Updates

- [ ] Details update as agent moves
- [ ] Battery updates in real-time
- [ ] State changes reflect immediately
- [ ] Position updates as agent travels

## Mission System

### Mission Assignment

**Test 1: Valid Mission**

- [ ] Select agent from dropdown
- [ ] Enter valid coordinates (e.g., 15, 5)
- [ ] Click "Assign Mission"
- [ ] Event log shows mission assignment
- [ ] Agent state changes appropriately
- [ ] Agent travels to target location
- [ ] Agent scans target area
- [ ] Mission completion logged

**Test 2: Invalid Coordinates**

- [ ] Enter negative coordinates
- [ ] Event log shows error message
- [ ] Mission not assigned

**Test 3: Out of Bounds**

- [ ] Enter coordinates > 19
- [ ] Event log shows error message
- [ ] Mission not assigned

**Test 4: Mission During Low Battery**

- [ ] Assign mission to agent with low battery
- [ ] Agent prioritizes returning to base
- [ ] Mission executes after recharge

**Test 5: Unreachable Target (Water)**

- [ ] Find water tile coordinates
- [ ] Assign mission to water tile
- [ ] Agent attempts pathfinding
- [ ] Event log shows "cannot reach target"
- [ ] Agent returns to default behavior

### Mission Completion

- [ ] Agent completes mission
- [ ] Mission report generated
- [ ] Event log shows completion message
- [ ] Agent returns to autonomous behavior
- [ ] Mission status clears

## Fog-of-War Validation

### Initial State

- [ ] Most tiles are dark/hidden
- [ ] Only base area is visible
- [ ] Base position marked clearly

### Discovery Mechanics

- [ ] Tiles discovered when agent moves nearby
- [ ] Sensor range determines discovery radius
- [ ] Different agents have different sensor ranges
- [ ] Higher sensor range discovers more tiles
- [ ] Discovered tiles remain visible

### Visual Feedback

- [ ] Undiscovered tiles are dark
- [ ] Discovered tiles show terrain color
- [ ] Plain tiles (green)
- [ ] Rubble tiles (brown)
- [ ] Water tiles (blue)
- [ ] Grid lines visible on discovered tiles

## Points of Interest

### Detection

**Setup**: Run simulation until POIs discovered

- [ ] POIs appear as yellow dots
- [ ] POI only visible when tile discovered
- [ ] Event log shows POI detection
- [ ] POI type displayed in log
- [ ] Multiple POI types possible

### POI Types

Verify these can be discovered:

- [ ] Abandoned Structure
- [ ] Resource Cache
- [ ] Signal Source
- [ ] Artifact Site

## Event Log

### Message Types

Verify different event types display correctly:

- [ ] Info messages (blue)
- [ ] Success messages (green)
- [ ] Warning messages (yellow)
- [ ] Error messages (red)

### Content Validation

- [ ] Timestamps show correctly
- [ ] Tick numbers displayed
- [ ] Messages are clear and descriptive
- [ ] Most recent events at top
- [ ] Log scrolls properly
- [ ] Old events removed (max 100)

### Event Coverage

Check that these events are logged:

- [ ] System initialization
- [ ] Simulation start/pause
- [ ] Speed changes
- [ ] Agent discoveries
- [ ] POI detections
- [ ] Battery warnings
- [ ] Recharge start/complete
- [ ] Mission assignments
- [ ] Mission completions
- [ ] Malfunctions
- [ ] Errors (invalid missions, etc.)

## Narration System

### Toggle Behavior

- [ ] Narration checkbox toggles on/off
- [ ] No errors when toggled
- [ ] State persists during simulation

### Mission Reports

**When Narration ON**:

- [ ] Mission completion generates report
- [ ] Report appears in event log
- [ ] Report is descriptive (2-4 sentences)
- [ ] Template-based text (no LLM required)

**When Narration OFF**:

- [ ] Standard completion message shown
- [ ] No extended report generated

## Performance Tests

### Initial Performance

- [ ] Page loads in < 2 seconds
- [ ] First render appears immediately
- [ ] No visible lag on initial draw

### Runtime Performance

**Setup**: Run at 4x speed for 5 minutes

- [ ] Simulation runs smoothly
- [ ] No frame drops
- [ ] Canvas updates consistently
- [ ] UI remains responsive
- [ ] No memory leaks (check browser tools)
- [ ] CPU usage reasonable (< 50% on modern hardware)

### Stress Test

**Setup**: Run simulation until all tiles discovered

- [ ] Simulation completes successfully
- [ ] No crashes or errors
- [ ] Agents continue operating
- [ ] Performance remains acceptable
- [ ] Event log still functional

## Edge Cases

### Boundary Conditions

- [ ] Agents at grid edge don't crash
- [ ] Pathfinding works at boundaries
- [ ] Camera handles edge positions
- [ ] Fog-of-war works at edges

### Multiple Agents Same Position

- [ ] Multiple agents can occupy same tile
- [ ] Rendering handles overlapping agents
- [ ] All agents visible (or stacked appropriately)
- [ ] No collision issues

### All Agents Low Battery

**Setup**: Let all agents run until low battery

- [ ] All agents return to base
- [ ] All agents can recharge simultaneously
- [ ] No deadlocks or conflicts
- [ ] System recovers normally

### Rapid Mission Assignment

- [ ] Assign multiple missions quickly
- [ ] Agents queue/handle missions correctly
- [ ] No race conditions
- [ ] Event log captures all assignments

## Cross-Browser Testing

Test on multiple browsers:

### Chrome/Edge

- [ ] Loads correctly
- [ ] Renders properly
- [ ] All features work
- [ ] Performance good

### Firefox

- [ ] Loads correctly
- [ ] Renders properly
- [ ] All features work
- [ ] Performance good

### Safari

- [ ] Loads correctly
- [ ] Renders properly
- [ ] All features work
- [ ] Performance good

## Known Issues & Limitations

Document any issues found:

### Visual

- Canvas rendering may vary slightly between browsers
- Isometric projection assumes square pixels
- No zoom/pan controls yet

### Functional

- Single mission type only
- No save/load
- No agent customization during runtime
- Limited camera control

### Performance

- Large numbers of agents (>10) not tested
- Very long runtimes (>1 hour) not tested
- Mobile devices not optimized

## Test Report Template

```
Date: _____________
Tester: _____________
Browser: _____________
OS: _____________

Smoke Test: PASS / FAIL
Core Features: PASS / FAIL
Performance: PASS / FAIL

Issues Found:
1.
2.
3.

Notes:


```

## Automated Testing Notes

For future development, consider:

- Unit tests for pathfinding
- State machine validation
- Fog-of-war calculation tests
- Mission system tests
- Performance benchmarks

Current version (v1) uses manual testing only.

---

**Version**: 1.0.0
**Last Updated**: 2026-01-13
