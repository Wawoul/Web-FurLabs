# Fur-Labs Testing Scenarios

## Overview
This document outlines testing scenarios for the Fur-Labs collaborative fursona drawing game. Each scenario describes expected behavior, current implementation status, and relevant code references.

---

## 1. Lobby Management

### 1.1 Create Lobby

| Scenario | Expected Behavior | Code Implementation | Status |
|----------|-------------------|---------------------|--------|
| Host enters valid name | Lobby creates with unique invite code | `SocketHandler.handleCreateLobby()` validates name, creates via `LobbyManager` | WORKING |
| Host enters empty name | Error: "Display name is required" | Validation at line 45-48 of SocketHandler.js | WORKING |
| Drawing time specified | Time stored (60-600s range) | Parsed as int with fallback to default 180s | WORKING |
| Drawing time invalid | Falls back to 180 seconds | `parseInt` with fallback at Lobby.js:12-13 | WORKING |

### 1.2 Join Lobby

| Scenario | Expected Behavior | Code Implementation | Status |
|----------|-------------------|---------------------|--------|
| Valid code + name | Player joins, others notified | `handleJoinLobby()` emits to room | WORKING |
| Invalid invite code | Error: "Lobby not found" | `LobbyManager.joinLobby()` returns error | WORKING |
| Game already started | Error: "Game already in progress" | Lobby.addPlayer() checks state at line 59-61 | WORKING |
| Lobby full (8 players) | Error: "Lobby is full" | Checked at Lobby.addPlayer() line 55-57 | WORKING |
| Empty display name | Error: "Display name is required" | Validation at SocketHandler line 70-73 | WORKING |

### 1.3 Ready System

| Scenario | Expected Behavior | Code Implementation | Status |
|----------|-------------------|---------------------|--------|
| Player toggles ready | Ready state updates, all players notified | `handleReady()` emits `lobby:readyUpdate` | WORKING |
| All players ready | Host can start game | `lobby.canStart()` checks all ready | WORKING |
| Not all ready, host starts | Error: "Not all players are ready" | Checked in handleStartGame() | WORKING |

---

## 2. Game Flow

### 2.1 Game Start

| Scenario | Expected Behavior | Code Implementation | Status |
|----------|-------------------|---------------------|--------|
| Host starts game | All players see Round 1 (Head), timer starts | `handleStartGame()` calls `startRoundTimer()` | WORKING |
| Player order randomized | Shuffled for fair rotation | Fisher-Yates shuffle at Lobby.js:251-255 | WORKING |
| Round 1 = Draw own fursona | Each player draws their own Head | `getTargetFursonaOwner()` returns own at round 0 | WORKING |
| Hints initialized | Empty hints for Head round | `playerHints` initialized per Lobby.js:82-86 | WORKING |

### 2.2 Drawing Phase - Rotation (Gartic Phone Style)

| Scenario | Expected Behavior | Code Implementation | Status |
|----------|-------------------|---------------------|--------|
| Round 1 (Head) | Draw for own fursona | `(drawerIndex + 0) % N = drawerIndex` | WORKING |
| Round 2 (Torso) | Draw for next player's fursona | `(drawerIndex + 1) % N` | WORKING |
| Round 3 (Legs) | Draw for player after next | `(drawerIndex + 2) % N` | WORKING |
| 3 players, 3 rounds | Each fursona has parts from 3 different people | Rotation ensures no duplicates | WORKING |

### 2.3 Hint System

| Scenario | Expected Behavior | Code Implementation | Status |
|----------|-------------------|---------------------|--------|
| Head submits | Bottom 10% saved as Torso hint | `submitDrawing()` stores hint at line 319-323 | WORKING |
| Torso sees hint | Top 10% overlay from Head drawer | `getHintsForPlayer()` returns hints | WORKING |
| Torso submits | Bottom 10% saved as Legs hint | Same mechanism | WORKING |
| Legs sees hint | Top 10% overlay from Torso drawer | Same mechanism | WORKING |
| Hint drawn on canvas | Integrated into drawing (Gartic Phone style) | `DrawingCanvas.drawHintOnCanvas()` | WORKING |

### 2.4 Timer

| Scenario | Expected Behavior | Code Implementation | Status |
|----------|-------------------|---------------------|--------|
| Timer counts down | Updates every second, UI reflects | `startRoundTimer()` with 1s interval | WORKING |
| Timer reaches 0 | Auto-submit blank for non-submitters | `autoSubmitRound()` submits null | WORKING |
| All submit before timer | Round advances immediately | `isRoundComplete()` triggers `advanceToNextRound()` | WORKING |

### 2.5 Drawing Submission

| Scenario | Expected Behavior | Code Implementation | Status |
|----------|-------------------|---------------------|--------|
| Submit valid drawing | Stored for target fursona, player notified | `submitDrawing()` stores in `playerDrawings` | WORKING |
| Submit wrong body part | Error: "Wrong body part" | Check at Lobby.js:291-293 | WORKING |
| Drawer name tracked | Name stored with drawing | `playerDrawers` stores `{socketId, name}` | WORKING |
| All submitted | Advance to next round | `isRoundComplete()` returns true | WORKING |

---

## 3. Player Quit Mid-Game

### 3.1 Quit During Drawing Phase

| Scenario | Expected Behavior | Code Implementation | Status |
|----------|-------------------|---------------------|--------|
| Player disconnects | Kept in rotation, auto-submit blank | `removePlayer()` calls `autoSubmitForQuitPlayer()` | WORKING |
| Player leaves manually | Same as disconnect | `handleLeaveLobby()` handles mid-game | WORKING |
| Quit player's name | Shows "(quit)" badge | Stored as `${displayName} (quit)` | WORKING |
| Round completion check | Counts quit players as submitted | `roundSubmissions.size >= playerOrder.length` | WORKING |
| Next round for quitter | Auto-submit blank automatically | `advanceRound()` calls `autoSubmitForQuitPlayer()` | WORKING |

### 3.2 Quit Player's Fursona

| Scenario | Expected Behavior | Code Implementation | Status |
|----------|-------------------|---------------------|--------|
| Quitter's fursona | Still included in reveal | `quitPlayers` Map preserves info | WORKING |
| Quitter drew for others | Their drawings preserved | `playerDrawings` not deleted mid-game | WORKING |
| AI generation for quitter | Can still generate their fursona | Handled via `getAllPlayerDrawings()` | WORKING |

### 3.3 Quit in Waiting Room

| Scenario | Expected Behavior | Code Implementation | Status |
|----------|-------------------|---------------------|--------|
| Player leaves waiting | Full cleanup, removed from lists | `removePlayer()` deletes all data | WORKING |
| Host leaves | New host assigned automatically | First remaining player becomes host | WORKING |
| All players leave | Lobby deleted | Handled in `LobbyManager.leaveLobby()` | WORKING |

---

## 4. Reveal Phase

### 4.1 Raw Image Display

| Scenario | Expected Behavior | Code Implementation | Status |
|----------|-------------------|---------------------|--------|
| All rounds complete | Transition to reveal screen | `triggerReveal()` emits `game:reveal` | WORKING |
| Drawings displayed | Each fursona shows Head/Torso/Legs | `getAllPlayerDrawings()` returns all | WORKING |
| Drawer credits shown | Shows who drew each part | `drawnBy` field in reveal data | WORKING |
| Combined canvas | Vertically stitched 800x1200 | Client-side canvas composition | WORKING |
| Quit player badge | Name shows "(quit)" | Returned in `playerName` field | WORKING |

### 4.2 AI Generation

| Scenario | Expected Behavior | Code Implementation | Status |
|----------|-------------------|---------------------|--------|
| Auto-generation | Starts for all players on reveal | `startAutoAIGeneration()` parallel | WORKING |
| Manual trigger | Button to regenerate | `handleAIGenerate()` handles requests | WORKING |
| Cached result | Returns cached if exists | Check `getPlayerAIVersion()` first | WORKING |
| Generation in progress | Shows loading state | `isGenerating()` flag checked | WORKING |
| Generation fails | Error message shown | `ai:complete` with null and message | WORKING |

---

## 5. Cross-Device Compatibility (Mobile/Desktop)

### 5.1 Canvas Drawing

| Scenario | Expected Behavior | Code Implementation | Status |
|----------|-------------------|---------------------|--------|
| Mobile touch draw | Same strokes as desktop mouse | Touch events in `DrawingCanvas.js` | WORKING |
| Coordinate scaling | Touch coords match canvas internal 800x400 | `getPosition()` uses `getBoundingClientRect()` | WORKING |
| Desktop draws, mobile views | Drawing displays without cutoff | CSS `aspect-ratio: 2/1`, `max-width: 100%` | FIXED |
| Mobile draws, desktop views | Drawing displays correctly | Same coordinate system | WORKING |
| Fill tool on mobile | Tap to fill works | `handlePointAction()` for touch | WORKING |
| Pipette on mobile | Tap to pick color | Same mechanism | WORKING |

### 5.2 Canvas Sizing

| Scenario | Expected Behavior | Code Implementation | Status |
|----------|-------------------|---------------------|--------|
| Desktop display | Canvas at max 950px with 2:1 ratio | `.canvas-wrapper { max-width: 950px }` | WORKING |
| Mobile display (600px+) | Full width, maintains ratio | `aspect-ratio: 2/1` enforced | FIXED |
| Mobile display (<400px) | Reduced padding, full width | Extra small breakpoint added | FIXED |
| Reveal images mobile | Scale properly, no cutoff | `max-width: 100%` on reveal parts | FIXED |

### 5.3 Touch Targets

| Scenario | Expected Behavior | Code Implementation | Status |
|----------|-------------------|---------------------|--------|
| Tool buttons mobile | 54px touch targets | Media query sets `min-width: 54px` | WORKING |
| Color presets mobile | 38px touch targets | Media query sets `min-width: 38px` | WORKING |
| Brush size slider | Works with touch | Standard range input | WORKING |

---

## 6. Edge Cases

### 6.1 Single Player

| Scenario | Expected Behavior | Code Implementation | Status |
|----------|-------------------|---------------------|--------|
| 1 player starts | Draws all 3 parts for self | Rotation with N=1 works correctly | WORKING |
| Solo reveal | Shows single fursona | Normal reveal flow | WORKING |
| Solo AI generation | Works normally | Same API call | WORKING |

### 6.2 Network Issues

| Scenario | Expected Behavior | Code Implementation | Status |
|----------|-------------------|---------------------|--------|
| Disconnect mid-draw | Treated as quit, blank auto-submit | `handleDisconnect()` calls leave handler | WORKING |
| Reconnect not supported | Player must rejoin (new socket) | No reconnection logic yet | N/A |
| Slow AI generation | Shows loading, doesn't block others | Async with parallel generation | WORKING |

### 6.3 Rapid Actions

| Scenario | Expected Behavior | Code Implementation | Status |
|----------|-------------------|---------------------|--------|
| Double submit | Only first counts | `roundSubmissions` Set prevents dupes | WORKING |
| Double AI generate | Returns cached/in-progress | `isGenerating()` check | WORKING |
| Spam ready toggle | Updates correctly each time | No rate limiting needed | WORKING |

---

## Testing Checklist

### Pre-Game
- [ ] Create lobby with valid name
- [ ] Create lobby with custom drawing time
- [ ] Join lobby with valid code
- [ ] Join lobby with invalid code (should fail)
- [ ] Ready/unready toggle
- [ ] Host sees start button when all ready
- [ ] Non-host cannot start game

### During Game
- [ ] Round 1: Draw Head for own fursona
- [ ] Round 2: Draw Torso for next player (check rotation)
- [ ] Round 3: Draw Legs for rotated fursona
- [ ] Timer counts down correctly
- [ ] Auto-submit on timeout
- [ ] Early submit advances round when all done
- [ ] Tools work: Brush, Eraser, Fill, Pipette
- [ ] Undo/Redo works
- [ ] Clear canvas works
- [ ] Color picker and presets work
- [ ] Brush size slider works

### Player Quit
- [ ] Quit during drawing: blank auto-submitted
- [ ] Quit player marked "(quit)" in UI
- [ ] Other players can continue
- [ ] Quit player's fursona still appears in reveal
- [ ] Rotation continues correctly after quit

### Reveal
- [ ] All fursonas displayed
- [ ] Combined canvas shows stitched image
- [ ] Drawer credits shown for each part
- [ ] AI generation starts automatically
- [ ] AI images display when ready
- [ ] Download button works

### Cross-Device
- [ ] Desktop: Canvas displays at full size
- [ ] Mobile: Canvas scales to viewport width
- [ ] Mobile: Touch drawing works
- [ ] Mobile: All tools accessible and usable
- [ ] Mobile: Reveal images not cut off
- [ ] Mixed session: Desktop+Mobile play together

---

## Known Limitations

1. **No Reconnection**: Disconnected players cannot rejoin the same game session
2. **No Spectator Mode**: Players who join mid-game cannot spectate
3. **Single Game Per Lobby**: Must click "New Game" to play again
4. **AI API Dependency**: AI generation requires external API availability

---

## Version History

- v1.2.0: Added quit player handling, mobile canvas fixes, pipette tool
- v1.1.0: Gartic Phone rotation system, hint zone integration
- v1.0.0: Initial release with basic game flow

Last Updated: 2026-04-25
