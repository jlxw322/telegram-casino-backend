# Исправление проблемы: myBetId = null

## Проблема

```javascript
{
  gameState: "flying",
  hasBet: true,
  cashedOut: false,
  myBetId: null,  // ❌ Проблема: ID ставки не сохранен!
  currentMultiplier: 15.74
}
```

Пользователь не может сделать кешаут, потому что `myBetId` равен `null`, хотя ставка была размещена (`hasBet: true`).

---

## Причина

Фронтенд не сохраняет ID ставки, который сервер возвращает в событии `aviator:betPlaced`.

---

## Решение на фронтенде

### 1. Добавить обработчик события `aviator:betPlaced`

Когда вы делаете ставку через WebSocket:

```typescript
// ❌ НЕПРАВИЛЬНО: только отправляем запрос
socket.emit('aviator:placeBet', {
  aviatorId: currentGame.id,
  amount: betAmount,
});

// Не слушаем ответ!
```

**✅ ПРАВИЛЬНО:**

```typescript
// Отправляем запрос
socket.emit('aviator:placeBet', {
  aviatorId: currentGame.id,
  amount: betAmount,
});

// Слушаем ответ от сервера
socket.on('aviator:betPlaced', (data) => {
  console.log('✅ Bet placed successfully:', data);

  // ВАЖНО: Сохраните ID ставки!
  setMyBetId(data.id);
  setHasBet(true);

  // Обновите баланс пользователя
  setUserBalance(data.user.balance);

  console.log(`💾 Saved bet ID: ${data.id}`);
});
```

---

### 2. Структура ответа `aviator:betPlaced`

Сервер возвращает полную информацию о ставке:

```typescript
{
  id: 789,                     // ← Это нужно сохранить!
  aviatorId: 123,
  userId: "user123",
  amount: 100,
  cashedAt: null,
  isInventoryBet: false,
  createdAt: "2025-11-23T12:00:02.000Z",
  updatedAt: "2025-11-23T12:00:02.000Z",
  user: {
    id: "user123",
    username: "player1",
    balance: 900              // Обновленный баланс
  }
}
```

---

### 3. Полный пример React/Next.js

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useAviator() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [myBetId, setMyBetId] = useState<number | null>(null);
  const [hasBet, setHasBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    const newSocket = io('ws://your-domain/ws', {
      auth: { token: localStorage.getItem('token') },
    });

    // ✅ Обработчик успешной ставки
    newSocket.on('aviator:betPlaced', (data) => {
      console.log('✅ Bet placed:', data);

      // Сохранить ID ставки
      setMyBetId(data.id);
      setHasBet(true);
      setCashedOut(false);

      // Обновить баланс
      setUserBalance(data.user.balance);

      console.log(`💾 Saved myBetId: ${data.id}`);
    });

    // Обработчик успешного кешаута
    newSocket.on('aviator:cashedOut', (data) => {
      console.log('💰 Cashed out:', data);

      setCashedOut(true);
      setUserBalance((prev) => prev + data.winAmount);
    });

    // Обработчик краша (если не сделали кешаут)
    newSocket.on('aviator:lose', (data) => {
      console.log('❌ Lost:', data);

      // Сбросить состояние ставки
      setMyBetId(null);
      setHasBet(false);
      setCashedOut(false);
    });

    // Обработчик выигрыша (если сделали кешаут)
    newSocket.on('aviator:win', (data) => {
      console.log('🎉 Won:', data);

      // Сбросить состояние ставки
      setMyBetId(null);
      setHasBet(false);
      setCashedOut(false);
    });

    // Сброс при новой игре
    newSocket.on('aviator:game', (game) => {
      if (game.status === 'WAITING') {
        // Новая игра начинается
        setMyBetId(null);
        setHasBet(false);
        setCashedOut(false);
      }
    });

    // Обработчик ошибок
    newSocket.on('error', (error) => {
      console.error('❌ Error:', error.message);
      alert(error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Функция размещения ставки
  const placeBet = (aviatorId: number, amount: number) => {
    if (!socket) {
      console.error('Socket not connected');
      return;
    }

    if (hasBet) {
      console.warn('Already have a bet on this game');
      return;
    }

    console.log(`📤 Placing bet: aviatorId=${aviatorId}, amount=${amount}`);

    socket.emit('aviator:placeBet', {
      aviatorId,
      amount,
    });

    // ✅ Ответ придет в событии 'aviator:betPlaced'
  };

  // Функция кешаута
  const cashOut = (currentMultiplier: number) => {
    if (!socket) {
      console.error('Socket not connected');
      return;
    }

    if (!myBetId) {
      console.error('❌ Cannot cash out: myBetId is null');
      console.log('State:', { hasBet, cashedOut, myBetId });
      return;
    }

    if (cashedOut) {
      console.warn('Already cashed out');
      return;
    }

    console.log(
      `💰 Cashing out: betId=${myBetId}, multiplier=${currentMultiplier}`,
    );

    socket.emit('aviator:cashOut', {
      betId: myBetId,
      currentMultiplier,
    });
  };

  return {
    socket,
    myBetId,
    hasBet,
    cashedOut,
    userBalance,
    placeBet,
    cashOut,
  };
}
```

---

### 4. Использование в компоненте

```tsx
export default function AviatorGame() {
  const { socket, myBetId, hasBet, cashedOut, userBalance, placeBet, cashOut } =
    useAviator();

  const [currentGame, setCurrentGame] = useState(null);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [betAmount, setBetAmount] = useState(100);

  useEffect(() => {
    if (!socket) return;

    socket.on('aviator:game', (game) => {
      setCurrentGame(game);
    });
  }, [socket]);

  const handlePlaceBet = () => {
    if (!currentGame) return;
    placeBet(currentGame.id, betAmount);
  };

  const handleCashOut = () => {
    cashOut(currentMultiplier);
  };

  return (
    <div>
      <h1>Aviator Game</h1>

      {/* Информация о ставке */}
      <div>
        <p>Balance: {userBalance}</p>
        <p>Has Bet: {hasBet ? 'Yes' : 'No'}</p>
        <p>Bet ID: {myBetId || 'None'}</p>
        <p>Cashed Out: {cashedOut ? 'Yes' : 'No'}</p>
      </div>

      {/* Кнопка ставки */}
      {!hasBet && currentGame?.status === 'WAITING' && (
        <div>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
          />
          <button onClick={handlePlaceBet}>Place Bet</button>
        </div>
      )}

      {/* Кнопка кешаута */}
      {hasBet && !cashedOut && currentGame?.status === 'ACTIVE' && (
        <button onClick={handleCashOut}>
          Cash Out at {currentMultiplier.toFixed(2)}x
        </button>
      )}

      {/* Предупреждение если нет ID */}
      {hasBet && !myBetId && (
        <div style={{ color: 'red' }}>
          ⚠️ Warning: Bet placed but ID not saved!
        </div>
      )}
    </div>
  );
}
```

---

### 5. Отладка

Добавьте логирование, чтобы отследить проблему:

```typescript
socket.on('aviator:betPlaced', (data) => {
  console.group('🎲 Bet Placed Event');
  console.log('Full data:', data);
  console.log('Bet ID:', data.id);
  console.log('Amount:', data.amount);
  console.log('User balance:', data.user.balance);
  console.groupEnd();

  if (!data.id) {
    console.error('❌ BET ID IS MISSING!');
  } else {
    console.log(`✅ Saving bet ID: ${data.id}`);
    setMyBetId(data.id);
  }
});
```

---

### 6. Проверка состояния перед кешаутом

```typescript
const cashOut = (currentMultiplier: number) => {
  // Детальная проверка
  console.group('💰 Cash Out Attempt');
  console.log('Socket connected:', !!socket);
  console.log('Has bet:', hasBet);
  console.log('My bet ID:', myBetId);
  console.log('Cashed out:', cashedOut);
  console.log('Current multiplier:', currentMultiplier);
  console.groupEnd();

  if (!socket) {
    console.error('❌ Socket not connected');
    return;
  }

  if (!hasBet) {
    console.error('❌ No bet placed');
    return;
  }

  if (!myBetId) {
    console.error('❌ Bet ID is null - cannot cash out!');
    console.error('This means the bet was placed but the ID was not saved.');
    console.error('Check if you are listening to "aviator:betPlaced" event.');
    return;
  }

  if (cashedOut) {
    console.warn('⚠️ Already cashed out');
    return;
  }

  // Все проверки прошли
  console.log(
    `✅ Emitting cash out: betId=${myBetId}, multiplier=${currentMultiplier}`,
  );

  socket.emit('aviator:cashOut', {
    betId: myBetId,
    currentMultiplier,
  });
};
```

---

## Чеклист исправления

- [ ] Добавлен обработчик `socket.on('aviator:betPlaced', ...)`
- [ ] ID ставки сохраняется: `setMyBetId(data.id)`
- [ ] Проверка `myBetId` перед кешаутом
- [ ] Сброс `myBetId` после краша/выигрыша
- [ ] Логирование для отладки
- [ ] Обработка ошибок

---

## Типичные ошибки

### ❌ Ошибка 1: Не слушаете событие `aviator:betPlaced`

```typescript
// Неправильно
socket.emit('aviator:placeBet', { aviatorId, amount });
// ... и всё, нет обработчика ответа
```

### ❌ Ошибка 2: Сохраняете неправильное поле

```typescript
// Неправильно
socket.on('aviator:betPlaced', (data) => {
  setMyBetId(data.betId); // ❌ Поле называется 'id', а не 'betId'!
});

// Правильно
socket.on('aviator:betPlaced', (data) => {
  setMyBetId(data.id); // ✅
});
```

### ❌ Ошибка 3: Слушаете событие `aviator:newBet` вместо `aviator:betPlaced`

```typescript
// Неправильно
socket.on('aviator:newBet', (data) => {
  setMyBetId(data.betId); // ❌ Это глобальное событие для всех игроков!
});

// Правильно
socket.on('aviator:betPlaced', (data) => {
  setMyBetId(data.id); // ✅ Это персональное событие только для вас
});
```

---

## Разница между событиями

### `aviator:betPlaced` (персональное)

- Отправляется **только вам**
- Содержит полную информацию о вашей ставке
- Содержит обновленный баланс
- Используйте для сохранения `myBetId`

### `aviator:newBet` (глобальное)

- Отправляется **всем игрокам**
- Показывает, что кто-то сделал ставку
- Используйте для отображения ставок других игроков
- НЕ используйте для сохранения `myBetId`

---

## Проверка работы

После исправления вы должны видеть в консоли:

```
📤 Placing bet: aviatorId=123, amount=100
✅ Bet placed: { id: 789, amount: 100, ... }
💾 Saved myBetId: 789
💰 Cashing out: betId=789, multiplier=2.50
✅ Cashed out successfully!
```

А **НЕ**:

```
📤 Placing bet: aviatorId=123, amount=100
💰 Cashing out: betId=null, multiplier=2.50
❌ Cannot cash out: myBetId is null
```

---

## Дополнительные рекомендации

1. **Сохраняйте ID в localStorage** (опционально):

```typescript
socket.on('aviator:betPlaced', (data) => {
  setMyBetId(data.id);
  localStorage.setItem('currentBetId', data.id.toString());
});
```

2. **Восстанавливайте ID при перезагрузке страницы**:

```typescript
useEffect(() => {
  const savedBetId = localStorage.getItem('currentBetId');
  if (savedBetId) {
    setMyBetId(Number(savedBetId));
  }
}, []);
```

3. **Очищайте localStorage после игры**:

```typescript
socket.on('aviator:win', () => {
  localStorage.removeItem('currentBetId');
  setMyBetId(null);
});

socket.on('aviator:lose', () => {
  localStorage.removeItem('currentBetId');
  setMyBetId(null);
});
```

---

## Заключение

Проблема решается простым добавлением обработчика события `aviator:betPlaced` и сохранением `data.id` в состояние `myBetId`. После этого кешаут будет работать корректно.
