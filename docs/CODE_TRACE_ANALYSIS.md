# Code Trace Analysis

## Scenario 1: Three Players in One Lobby

### Setup Phase

**Players:**
- Player A (socketId: `socketA`) - Creates lobby, becomes Host
- Player B (socketId: `socketB`) - Joins
- Player C (socketId: `socketC`) - Joins

**Code Flow:**
```
1. A calls lobby:create → LobbyManager.createLobby()
   - Creates Lobby instance with unique inviteCode (e.g., "ABC123")
   - lobbies.set("ABC123", lobby)
   - playerToLobby.set("socketA", "ABC123")
   - A joins Socket.IO room "lobby:ABC123"

2. B calls lobby:join with "ABC123"
   - lobby.addPlayer("socketB", "Player B")
   - playerToLobby.set("socketB", "ABC123")
   - B joins room "lobby:ABC123"
   - Event emitted to room: lobby:playerJoined

3. C joins same way
   - playerToLobby.set("socketC", "ABC123")
```

**State after setup:**
```javascript
lobby.players = Map {
  "socketA" => Player { displayName: "A", isHost: true },
  "socketB" => Player { displayName: "B", isHost: false },
  "socketC" => Player { displayName: "C", isHost: false }
}
lobby.state = "waiting"
```

---

### Ready & Start Phase

**Code Flow:**
```
1. All three call lobby:ready with isReady: true
2. Host A calls lobby:start
3. lobby.startGame() executes:
   - state = "drawing"
   - currentRound = 0
   - playerOrder shuffled, e.g.: ["socketB", "socketC", "socketA"]
   - playerDrawings initialized for each player
```

**State after start:**
```javascript
lobby.state = "drawing"
lobby.currentRound = 0  // HEAD round
lobby.playerOrder = ["socketB", "socketC", "socketA"]
lobby.timeRemaining = 180
```

---

### Round 1: HEAD (currentRound = 0)

**Rotation calculation:** `(drawerIndex + currentRound) % N`

| Drawer | drawerIndex | Formula | Target Fursona |
|--------|-------------|---------|----------------|
| B | 0 | (0 + 0) % 3 = 0 | socketB (own) |
| C | 1 | (1 + 0) % 3 = 1 | socketC (own) |
| A | 2 | (2 + 0) % 3 = 2 | socketA (own) |

**Result:** Everyone draws their own HEAD

**Hint Storage (on submit):**
```javascript
// When B submits HEAD with hintData.bottom = "B_head_bottom_10%"
playerHints.get("socketB")[TORSO].top = "B_head_bottom_10%"

// Same for C and A
playerHints.get("socketC")[TORSO].top = "C_head_bottom_10%"
playerHints.get("socketA")[TORSO].top = "A_head_bottom_10%"
```

---

### Round 2: TORSO (currentRound = 1)

**Rotation calculation:**

| Drawer | drawerIndex | Formula | Target Fursona |
|--------|-------------|---------|----------------|
| B | 0 | (0 + 1) % 3 = 1 | socketC |
| C | 1 | (1 + 1) % 3 = 2 | socketA |
| A | 2 | (2 + 1) % 3 = 0 | socketB |

**Result:**
- B draws C's TORSO
- C draws A's TORSO
- A draws B's TORSO

**Hints Received:**
```javascript
// B gets hints for C's fursona
getHintsForPlayer("socketB")
  → getTargetFursonaOwner("socketB") = "socketC"
  → playerHints.get("socketC")[TORSO] = { top: "C_head_bottom_10%" }

// Correct! B sees C's head hint when drawing C's torso
```

---

### Round 3: LEGS (currentRound = 2)

**Rotation calculation:**

| Drawer | drawerIndex | Formula | Target Fursona |
|--------|-------------|---------|----------------|
| B | 0 | (0 + 2) % 3 = 2 | socketA |
| C | 1 | (1 + 2) % 3 = 0 | socketB |
| A | 2 | (2 + 2) % 3 = 1 | socketC |

**Result:**
- B draws A's LEGS
- C draws B's LEGS
- A draws C's LEGS

---

### Final Fursona Compositions

| Fursona Owner | HEAD drawn by | TORSO drawn by | LEGS drawn by |
|---------------|---------------|----------------|---------------|
| B | B | A | C |
| C | C | B | A |
| A | A | C | B |

**Verification:** Each fursona has parts from 3 different artists. No duplicates.

---

## Scenario 2: Two Simultaneous Lobbies

### Setup

**Lobby 1 ("ABC123"):**
- Host: Player 1 (socket1)
- Player 2 (socket2)
- Player 3 (socket3)

**Lobby 2 ("XYZ789"):**
- Host: Player X (socketX)
- Player Y (socketY)

### Isolation Mechanisms

#### 1. LobbyManager Maps (server/game/LobbyManager.js)
```javascript
this.lobbies = Map {
  "ABC123" => Lobby { id: "...", inviteCode: "ABC123", players: [...] },
  "XYZ789" => Lobby { id: "...", inviteCode: "XYZ789", players: [...] }
}

this.playerToLobby = Map {
  "socket1" => "ABC123",
  "socket2" => "ABC123",
  "socket3" => "ABC123",
  "socketX" => "XYZ789",
  "socketY" => "XYZ789"
}
```

Each lookup `getLobbyByPlayer(socketId)` returns the correct lobby.

#### 2. Socket.IO Room Isolation
```javascript
// socket1, socket2, socket3 are in room "lobby:ABC123"
// socketX, socketY are in room "lobby:XYZ789"

// Events are emitted to specific rooms:
emitToLobby("ABC123", "game:start", data)  // Only Lobby 1 receives
emitToLobby("XYZ789", "game:timerUpdate", data)  // Only Lobby 2 receives
```

#### 3. Timer Isolation
```javascript
// Each lobby has its own timer
lobby1.timer = setInterval(() => {
  lobby1.timeRemaining--;
  emitToLobby("ABC123", "game:timerUpdate", { remaining: lobby1.timeRemaining });
}, 1000);

lobby2.timer = setInterval(() => {
  lobby2.timeRemaining--;
  emitToLobby("XYZ789", "game:timerUpdate", { remaining: lobby2.timeRemaining });
}, 1000);
```

Timers don't interfere - each references its own lobby object.

#### 4. Per-Lobby Game State
Each Lobby instance has isolated:
- `players` Map
- `playerOrder` Array
- `playerDrawings` Map
- `playerDrawers` Map
- `playerHints` Map
- `currentRound`
- `roundSubmissions` Set
- `state`

#### 5. TempImageStore (AI generation)
```javascript
// Uses UUID keys - no collision possible
TempImageStore.store(image1) → "uuid-aaaa-1111"
TempImageStore.store(image2) → "uuid-bbbb-2222"
```

Images from different lobbies stored with unique keys.

---

### Concurrent Game Timeline Example

```
T=0:  Lobby 1 starts (state: drawing, round 0)
T=5:  Lobby 2 starts (state: drawing, round 0)
T=30: Lobby 2 round 1 complete, advances to round 1
T=45: Lobby 1 round 1 complete, advances to round 1
T=60: Lobby 2 round 2 complete, advances to round 2
T=90: Lobby 1 round 2 complete, advances to round 2
T=100: Lobby 2 all rounds complete, triggers reveal
T=120: Lobby 2 starts AI generation
T=135: Lobby 1 all rounds complete, triggers reveal
T=140: Lobby 1 starts AI generation
T=150: Both lobbies have AI results
```

Each lobby progresses independently based on when its players submit.

---

## Scenario 3: Player Quit Mid-Game (3 Players)

### Setup
- playerOrder = ["socketB", "socketC", "socketA"]
- Game is in Round 2 (TORSO)
- B is drawing C's torso, hasn't submitted yet

### Player B Disconnects

**Code Flow:**
```javascript
// In handleDisconnect(socket)
handleLeaveLobby(socket)
  → lobbyManager.leaveLobby("socketB")
    → lobby.removePlayer("socketB")
```

**In removePlayer("socketB"):**
```javascript
gameInProgress = true  // state is DRAWING

// 1. Store quit info
quitPlayers.set("socketB", {
  displayName: "B",
  playerId: player.id,
  quitAt: Date.now()
})

// 2. Auto-submit for current round (B hasn't submitted)
autoSubmitForQuitPlayer("socketB", "B")
  → currentPart = "torso"
  → targetOwnerId = getTargetFursonaOwner("socketB") = "socketC"
  → playerDrawings.get("socketC")["torso"] = null  // Blank
  → playerDrawers.get("socketC")["torso"] = { socketId: "socketB", name: "B (quit)" }
  → roundSubmissions.add("socketB")

// 3. CRITICAL: Do NOT remove from playerOrder!
// playerOrder remains ["socketB", "socketC", "socketA"]

// 4. Remove from active players
players.delete("socketB")
```

### Round 2 Completion Check
```javascript
isRoundComplete()
  → roundSubmissions.size = 3 (A, C, and B's auto-submit)
  → playerOrder.length = 3 (B still in order)
  → returns true
```

### Round 3 Begins
```javascript
advanceRound()
  → currentRound = 2
  → roundSubmissions.clear()

  // Auto-submit for quit players in new round
  for (const [socketId, quitInfo] of quitPlayers) {
    autoSubmitForQuitPlayer("socketB", "B")
      → targetOwnerId = getTargetFursonaOwner("socketB")
        = (0 + 2) % 3 = 2 = "socketA"
      → playerDrawings.get("socketA")["legs"] = null
      → playerDrawers.get("socketA")["legs"] = { socketId: "socketB", name: "B (quit)" }
  }
```

### Final Result

| Fursona Owner | HEAD | TORSO | LEGS |
|---------------|------|-------|------|
| B | B | A | C |
| C | C | B (quit) - blank | A |
| A | A | C | B (quit) - blank |

Quit player's drawings are blank, but rotation order preserved correctly.

---

## Verification Checklist

### 3-Player Game
- [x] Round 0: All draw own HEAD
- [x] Round 1: Rotation shifts by 1
- [x] Round 2: Rotation shifts by 2
- [x] Each fursona has 3 different artists
- [x] Hints flow correctly (HEAD bottom → TORSO top)
- [x] Round completion triggers advance

### Simultaneous Lobbies
- [x] Unique invite codes generated
- [x] Players isolated by Socket.IO rooms
- [x] Timers isolated per lobby
- [x] Game state isolated per lobby
- [x] AI generation isolated (UUID keys)

### Player Quit
- [x] Quit player marked in quitPlayers Map
- [x] Auto-submit blank for current round
- [x] Kept in playerOrder for rotation
- [x] Auto-submit in future rounds
- [x] Drawer credit shows "(quit)"
- [x] Fursona still appears in reveal

---

Last Updated: 2026-04-25
