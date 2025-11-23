# Краткая памятка: События WebSocket Aviator

## Размещение ставки

### 1. Отправка запроса (Client → Server)

```typescript
socket.emit('aviator:placeBet', {
  aviatorId: 123,
  amount: 100,
});
```

### 2. Ответы от сервера (Server → Client)

#### Успех (только вам):

```typescript
socket.on('aviator:betPlaced', (data) => {
  // data = {
  //   id: 789,              ← СОХРАНИТЕ ЭТО!
  //   aviatorId: 123,
  //   userId: "user123",
  //   amount: 100,
  //   cashedAt: null,
  //   user: { balance: 900 }
  // }

  setMyBetId(data.id); // ✅ ВАЖНО!
  setHasBet(true);
  setUserBalance(data.user.balance);
});
```

#### Глобальное уведомление (всем):

```typescript
socket.on('aviator:newBet', (data) => {
  // data = {
  //   betId: 789,
  //   aviatorId: 123,
  //   userId: "user123",
  //   username: "player1",
  //   amount: 100
  // }

  // Используйте для отображения ставок других игроков
  addBetToList(data);
});
```

#### Ошибка (только вам):

```typescript
socket.on('error', (error) => {
  console.error(error.message);
  // Примеры ошибок:
  // - "Insufficient balance"
  // - "Game is not accepting bets"
  // - "You already have a bet on this game"
});
```

---

## Кешаут

### 1. Отправка запроса (Client → Server)

```typescript
socket.emit('aviator:cashOut', {
  betId: myBetId, // ← ID из aviator:betPlaced
  currentMultiplier: 2.5,
});
```

### 2. Ответы от сервера (Server → Client)

#### Успех (только вам):

```typescript
socket.on('aviator:cashedOut', (result) => {
  // result = {
  //   bet: { ... },
  //   winAmount: 250,
  //   multiplier: 2.50
  // }

  console.log(`Won ${result.winAmount}!`);
});
```

#### Глобальное уведомление (всем):

```typescript
socket.on('aviator:cashOut', (data) => {
  // data = {
  //   betId: 789,
  //   userId: "user123",
  //   username: "player1",
  //   amount: 100,
  //   multiplier: 2.50,
  //   winAmount: 250
  // }

  // Показать что игрок сделал кешаут
  showCashOutNotification(data);
});
```

---

## Результаты игры (после краша)

### Выигрыш (только вам):

```typescript
socket.on('aviator:win', (data) => {
  // data = {
  //   betId: 789,
  //   betAmount: 100,
  //   cashedAt: 2.50,
  //   winAmount: 250,
  //   crashMultiplier: 3.00
  // }

  console.log(`🎉 You won ${data.winAmount}!`);
  setMyBetId(null);
  setHasBet(false);
});
```

### Проигрыш (только вам):

```typescript
socket.on('aviator:lose', (data) => {
  // data = {
  //   betId: 789,
  //   betAmount: 100,
  //   crashMultiplier: 1.50
  // }

  console.log(`💥 You lost ${data.betAmount}`);
  setMyBetId(null);
  setHasBet(false);
});
```

---

## Состояния игры

### Текущая игра:

```typescript
socket.on('aviator:game', (game) => {
  // game = {
  //   id: 123,
  //   status: "WAITING" | "ACTIVE" | "FINISHED",
  //   multiplier: 2.45,
  //   startsAt: "2025-11-23T12:00:05.000Z",
  //   bets: [...]
  // }

  setCurrentGame(game);
});
```

### Обратный отсчет (каждую секунду):

```typescript
socket.on('aviator:countdown', (data) => {
  // data = {
  //   gameId: 123,
  //   secondsLeft: 3,
  //   startsAt: "2025-11-23T12:00:05.000Z"
  // }

  setCountdown(data.secondsLeft);
});
```

### Изменение статуса:

```typescript
socket.on('aviator:statusChange', (data) => {
  // data = {
  //   gameId: 123,
  //   status: "ACTIVE",
  //   timestamp: "2025-11-23T12:00:05.000Z"
  // }

  if (data.status === 'ACTIVE') {
    startMultiplierAnimation();
  }
});
```

### Краш самолета:

```typescript
socket.on('aviator:crashed', (data) => {
  // data = {
  //   gameId: 123,
  //   multiplier: 2.45,
  //   timestamp: "2025-11-23T12:00:15.000Z"
  // }

  console.log(`💥 Crashed at ${data.multiplier}x`);
  stopMultiplierAnimation();
});
```

---

## История игр

### Запрос истории:

```typescript
socket.emit('aviator:getHistory', {
  limit: 20, // Опционально, по умолчанию 20
});
```

### Ответ:

```typescript
socket.on('aviator:history', (data) => {
  // data = {
  //   games: [
  //     {
  //       id: 123,
  //       multiplier: 2.45,
  //       totalBets: 15,
  //       createdAt: "2025-11-23T12:00:00.000Z"
  //     },
  //     ...
  //   ],
  //   count: 20
  // }

  setGameHistory(data.games);
});
```

### История крашей:

```typescript
socket.on('aviator:crashHistory', (data) => {
  // data = {
  //   history: [2.45, 1.00, 5.67, 3.21, ...],
  //   timestamp: "2025-11-23T12:00:15.000Z"
  // }

  setCrashHistory(data.history);
});
```

---

## Чек-лист интеграции

- [ ] **Слушаете `aviator:betPlaced`** ← КРИТИЧНО!
- [ ] **Сохраняете `data.id` в `myBetId`**
- [ ] **Проверяете `myBetId !== null` перед кешаутом**
- [ ] **Сбрасываете `myBetId` после win/lose**
- [ ] **Обрабатываете ошибки**
- [ ] **Обновляете баланс пользователя**

---

## Типичная ошибка

### ❌ НЕПРАВИЛЬНО:

```typescript
// Только отправляем, не слушаем ответ
socket.emit('aviator:placeBet', { aviatorId, amount });

// Пытаемся кешаутить с myBetId = null
socket.emit('aviator:cashOut', {
  betId: null, // ❌ ERROR!
  currentMultiplier,
});
```

### ✅ ПРАВИЛЬНО:

```typescript
// Отправляем
socket.emit('aviator:placeBet', { aviatorId, amount });

// Слушаем и сохраняем ID
socket.on('aviator:betPlaced', (data) => {
  setMyBetId(data.id); // ✅
});

// Кешаутим с правильным ID
socket.emit('aviator:cashOut', {
  betId: myBetId, // ✅ 789
  currentMultiplier,
});
```

---

## Отладка

```typescript
// Проверка состояния перед кешаутом
console.log({
  socket: !!socket,
  hasBet,
  myBetId, // Должен быть число, не null!
  cashedOut,
  gameStatus,
});
```

---

## Полезные ссылки

- Полная документация: `AVIATOR_WEBSOCKET_STATES.md`
- Подробное решение: `FIX_MYBET_ID_NULL.md`
- Примеры использования: `AVIATOR_HISTORY_EXAMPLE.md`
