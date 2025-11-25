# 🚀 Aviator - New Automatic Flow

## 🎯 Quick Reference

### Backend Responsibilities ✅

- ✅ Create new games automatically
- ✅ Auto-start games after 5 seconds
- ✅ Auto-crash games at predetermined multiplier
- ✅ Process all bet results (win/lose)
- ✅ Create new game 3 seconds after crash
- ✅ Clean up stuck games every 30 seconds (cron job)

### Frontend Responsibilities 📱

- 📱 Display game state (WAITING/ACTIVE/FINISHED)
- 📱 Show countdown during WAITING
- 📱 Allow bets during WAITING phase only
- 📱 Show multiplier animation during ACTIVE
- 📱 Allow cashout during ACTIVE phase only
- 📱 Listen for crash and results events
- 📱 Display win/lose notifications

## 🔄 Complete Game Cycle

```
Step 1: Backend creates WAITING game
├─ Status: WAITING
├─ startsAt: now + 5 seconds
├─ multiplier: 2.45 (example - provably fair)
└─ Emits: aviator:game

Step 2: Players place bets (5 second window)
├─ Frontend sends: aviator:placeBet
├─ Backend validates and creates bet
└─ Emits: aviator:newBet (broadcast to all)

Step 3: Backend auto-starts game (after 5s)
├─ Status: WAITING → ACTIVE
├─ Emits: aviator:statusChange
└─ Schedules crash at predetermined time

Step 4: Players cash out (optional)
├─ Frontend sends: aviator:cashOut
├─ Backend saves cashedAt multiplier
├─ Backend credits user balance immediately
└─ Emits: aviator:cashOut (broadcast to all)

Step 5: Backend auto-crashes game
├─ Status: ACTIVE → FINISHED
├─ Emits: aviator:crashed (broadcast to all)
├─ Process results for each bet:
│  ├─ If cashedAt exists → emit aviator:win (to user)
│  └─ If no cashedAt → emit aviator:lose (to user)
└─ Emits: aviator:statusChange

Step 6: Backend waits 3 seconds

Step 7: Backend creates new WAITING game
└─ Loop back to Step 1
```

## 📡 WebSocket Events

### Backend → Frontend (Listen for these)

#### `aviator:game`

Current game state (sent on connection, game creation, updates)

```typescript
{
  id: 123,
  status: "WAITING" | "ACTIVE" | "FINISHED",
  startsAt: "2025-11-25T12:00:00.000Z",
  multiplier: 2.45,
  bets: [
    {
      id: 1,
      username: "player1",
      amount: 500,
      cashedAt: null
    }
  ]
}
```

#### `aviator:statusChange`

Game status transition

```typescript
{
  gameId: 123,
  status: "ACTIVE",
  timestamp: "2025-11-25T12:00:05.000Z"
}
```

#### `aviator:crashed`

Game crashed (broadcast to all)

```typescript
{
  gameId: 123,
  multiplier: 2.45,
  timestamp: "2025-11-25T12:00:25.000Z"
}
```

#### `aviator:win`

Player won (sent to individual winner)

```typescript
{
  betId: 120,
  betAmount: 500,
  cashedAt: 2.45,
  winAmount: 1225,
  crashMultiplier: 2.45,
  timestamp: "2025-11-25T12:00:25.000Z"
}
```

#### `aviator:lose`

Player lost (sent to individual loser)

```typescript
{
  betId: 121,
  betAmount: 1000,
  crashMultiplier: 2.45
}
```

#### `aviator:crashHistory`

Last 20 crash multipliers (sent on connection)

```typescript
{
  history: [2.45, 1.23, 5.67, ...],
  timestamp: "2025-11-25T12:00:00.000Z"
}
```

### Frontend → Backend (Emit these)

#### `aviator:createOrGet`

Get current game or create new one

```typescript
socket.emit('aviator:createOrGet', (response) => {
  // response.data = game object
});
```

#### `aviator:placeBet`

Place bet (only during WAITING)

```typescript
socket.emit('aviator:placeBet', {
  aviatorId: 123,
  amount: 500,
});

// Listen for response:
socket.on('aviator:betPlaced', (data) => {
  // { betId, balance, username }
});
```

#### `aviator:cashOut`

Cash out bet (only during ACTIVE)

```typescript
socket.emit('aviator:cashOut', {
  betId: 120,
  currentMultiplier: 2.45,
});

// Listen for response:
socket.on('aviator:cashedOut', (data) => {
  // { bet, winAmount, multiplier }
});
```

## 🚨 Important Notes

### ❌ Do NOT do this on frontend:

```typescript
// ❌ WRONG - Don't try to detect crash
if (multiplier >= game.crashPoint) {
  socket.emit('aviator:notifyCrash', { gameId });
}

// ❌ WRONG - Don't try to create games manually
socket.emit('aviator:create');

// ❌ WRONG - Don't try to change game status
socket.emit('aviator:setStatus', { status: 'ACTIVE' });
```

### ✅ Do this instead:

```typescript
// ✅ RIGHT - Just listen for events
socket.on('aviator:crashed', (data) => {
  console.log('Game crashed at', data.multiplier);
  // Show animation, wait for results
});

socket.on('aviator:win', (data) => {
  console.log('You won!', data.winAmount);
  // Show win notification
});

socket.on('aviator:lose', (data) => {
  console.log('You lost', data.betAmount);
  // Show lose notification
});
```

## 🛠️ Debugging

### Check game state:

```typescript
socket.emit('aviator:createOrGet', (response) => {
  console.log('Current game:', response.data);
});
```

### Check if backend is working:

```bash
# Look for these logs in backend:
🎮 Initial game #123 created with status WAITING
⏰ Scheduling game #123 to start in 5s
🚀 Starting game #123
💥 Game #123 will crash at 2.45x in 2s
💥 Crashing game #123
✅ WIN: player1 won 1225 (cashed at 2.45x)
❌ LOSE: player2 lost 1000 (crashed at 2.45x)
🆕 New game #124 created with status WAITING
```

### Clean stuck games manually:

```sql
-- See docs/cleanup-aviator.sql
UPDATE "Aviator"
SET status = 'FINISHED'
WHERE status IN ('WAITING', 'ACTIVE')
  AND startsAt < NOW() - INTERVAL '30 seconds';
```

## ⏱️ Timing Reference

- **5 seconds** - WAITING phase (players can bet)
- **Variable** - ACTIVE phase (until crash, depends on multiplier)
- **3 seconds** - Pause between FINISHED and new WAITING game
- **30 seconds** - Cron job cleanup interval

## 📊 Example Timeline

```
00:00 - Game #1 created (WAITING, will start at 00:05)
00:01 - Player A bets 500
00:02 - Player B bets 1000
00:05 - Game #1 starts (ACTIVE)
00:07 - Player A cashes out at 2.00x (wins 1000)
00:09 - Game #1 crashes at 2.45x
        → Player A gets aviator:win (won 1000)
        → Player B gets aviator:lose (lost 1000)
00:12 - Game #2 created (WAITING, will start at 00:17)
00:17 - Game #2 starts (ACTIVE)
...
```

## 🎯 State Machine Diagram

```
     ┌──────────────┐
     │   WAITING    │ ← Game created (startsAt = now + 5s)
     │   (5 sec)    │
     └──────┬───────┘
            │ setTimeout(5s)
            ↓
     ┌──────────────┐
     │    ACTIVE    │ ← Multiplier growing
     │  (variable)  │   Players can cashOut
     └──────┬───────┘
            │ setTimeout(crashTime)
            ↓
     ┌──────────────┐
     │   FINISHED   │ ← Results processed
     │              │   Win/Lose events sent
     └──────┬───────┘
            │ setTimeout(3s)
            ↓
     (Loop back to WAITING)
```

## 🔒 Security Notes

- ✅ Crash point determined at game creation (provably fair)
- ✅ Server controls all state transitions
- ✅ Client cannot manipulate multiplier or crash timing
- ✅ Balance changes happen in atomic transactions
- ✅ Cron job prevents stuck games
