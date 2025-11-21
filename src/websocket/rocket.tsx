'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { RocketIcon } from 'lucide-react';
import { LottiePlayer } from '@/shared/ui/lottie-player';
import TelegramStar from '@/shared/icons/telegram-star';
import Image from 'next/image';
import { useAviatorSocket } from '@/shared/lib/aviator';

type GameState = 'waiting' | 'flying' | 'crashed' | 'nextRound';

export default function RocketPage() {
  // WebSocket подключение с новым API
  const {
    isConnected,
    gameState: socketGameState,
    activeBets,
    activeUsers,
    placeBet: socketPlaceBet,
    cashOut: socketCashOut,
    getPossiblePrize,
  } = useAviatorSocket();

  const [gameState, setGameState] = useState<GameState>('nextRound');
  const [multiplier, setMultiplier] = useState(1.0); // Локальный множитель для анимации
  const [selectedMultiplier, setSelectedMultiplier] = useState<number | null>(
    null,
  );
  const [rocketPosition, setRocketPosition] = useState(0);
  const animationRef = useRef<number | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [myBetId, setMyBetId] = useState<number | null>(null); // ID моей ставки
  const [hasBet, setHasBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashedOutMultiplier, setCashedOutMultiplier] = useState(0);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [showLosePopup, setShowLosePopup] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [winMultiplier, setWinMultiplier] = useState(0);
  const [lostAmount, setLostAmount] = useState(0);

  // Bottom sheet state
  const [showBetModal, setShowBetModal] = useState(false);
  const [betType, setBetType] = useState<'balance' | 'gifts'>('balance');
  const [selectedBetAmount, setSelectedBetAmount] = useState(100);

  // Mock gifts data (empty for now to show "no gifts" state)
  const [userGifts] = useState<
    Array<{ id: string; name: string; icon: string; value: number }>
  >([]);

  // Используем rocketPosition для избежания warning (используется в анимации)
  void rocketPosition;

  const multipliers = [
    1.49, 1.27, 1.69, 1.01, 4.08, 5.8, 4.21, 1.02, 2.5, 3.14, 1.83, 2.91,
  ];

  // Отслеживание моей ставки из списка activeBets
  useEffect(() => {
    if (activeBets.length > 0 && hasBet && !myBetId) {
      // Находим последнюю ставку (нашу)
      const myBet = activeBets[activeBets.length - 1];
      if (myBet) {
        setMyBetId(myBet.betId);
        console.log('✅ My bet ID:', myBet.betId);
      }
    }
  }, [activeBets, hasBet, myBetId]);

  // Отладка состояния сокета
  useEffect(() => {
    console.log('🔍 Socket state debug:', {
      isConnected,
      hasSocketGameState: !!socketGameState,
      socketGameStateStatus: socketGameState?.status,
      selectedBetAmount,
    });
  }, [isConnected, socketGameState, selectedBetAmount]);

  // Синхронизация состояния игры с WebSocket
  useEffect(() => {
    if (socketGameState) {
      console.log('🎮 Syncing game state from WebSocket:', socketGameState);

      // КРИТИЧНО: НЕ обновляем multiplier из socketGameState
      // socketGameState.multiplier - это crash point!
      // Используем только для проверок на бэкенде

      // Обновляем состояние игры на основе статуса
      if (socketGameState.status === 'WAITING') {
        setGameState('waiting');
        setMultiplier(1.0); // Сброс локального множителя
      } else if (socketGameState.status === 'ACTIVE') {
        if (gameState !== 'flying') {
          setGameState('flying');
          // Начинаем локальную анимацию
        }
      } else if (socketGameState.status === 'FINISHED') {
        setGameState('crashed');
        // Показываем проигрыш если не сделали cashout
        if (hasBet && !cashedOut) {
          setTimeout(() => {
            setLostAmount(selectedBetAmount);
            setShowLosePopup(true);
          }, 100);
        }

        setTimeout(() => {
          setGameState('nextRound');
          setMultiplier(1.0);
          setRocketPosition(0);
          setHasBet(false);
          setCashedOut(false);
          setMyBetId(null);
        }, 2000);
      }

      // Вычисляем countdown до startsAt
      if (socketGameState.startsAt) {
        const startsAt = new Date(socketGameState.startsAt).getTime();
        const now = Date.now();
        const diff = Math.ceil((startsAt - now) / 1000);
        if (diff > 0) {
          setCountdown(diff);
        }
      }
    }
  }, [socketGameState, gameState, hasBet, cashedOut, selectedBetAmount]);

  // Запрашиваем возможный приз при изменении суммы ставки
  useEffect(() => {
    if (isConnected && selectedBetAmount > 0) {
      getPossiblePrize(selectedBetAmount);
    }
  }, [isConnected, selectedBetAmount, getPossiblePrize]);

  // Countdown for next round
  useEffect(() => {
    if (gameState === 'nextRound') {
      setCountdown(5);
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setGameState('waiting');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'flying') {
      const startTime = Date.now();
      const duration = Math.random() * 8000 + 5000; // 5-13 seconds (longer duration)

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Much slower exponential growth for multiplier
        const currentMultiplier = 1 + Math.pow(progress, 1.5) * 3;
        setMultiplier(parseFloat(currentMultiplier.toFixed(2)));

        // Update rocket position
        setRocketPosition(progress * 80);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setGameState('crashed');

          // Show lose popup ONLY if player had bet and didn't cash out
          setTimeout(() => {
            if (hasBet && !cashedOut) {
              setLostAmount(selectedBetAmount);
              setShowLosePopup(true);
            }
          }, 100);

          setTimeout(() => {
            setGameState('nextRound');
            setMultiplier(1.0);
            setRocketPosition(0);
            setHasBet(false);
            setCashedOut(false);
            setCashedOutMultiplier(0);
          }, 2000);
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [gameState, hasBet, cashedOut, selectedBetAmount, cashedOutMultiplier]);

  const handlePlaceBet = () => {
    if (gameState === 'waiting') {
      setShowBetModal(true);
    }
  };

  const handleConfirmBet = () => {
    console.log('🎲 Attempting to place bet...', {
      isConnected,
      socketGameState,
      selectedBetAmount,
      gameState,
    });

    // Проверяем подключение
    if (!isConnected) {
      console.error('❌ Not connected to WebSocket');
      alert('Нет подключения к серверу. Попробуйте позже.');
      return;
    }

    // Проверяем что игра загружена
    if (!socketGameState) {
      console.error('❌ Game state not loaded');
      alert('Загрузка игры... Попробуйте через пару секунд.');
      return;
    }

    // КРИТИЧНО: Проверяем что игра в состоянии WAITING
    if (socketGameState.status !== 'WAITING') {
      console.warn('⚠️ Game status:', socketGameState.status);
      if (socketGameState.status === 'ACTIVE') {
        alert('Игра уже началась. Дождитесь следующего раунда.');
      } else if (socketGameState.status === 'FINISHED') {
        alert('Игра завершена. Дождитесь следующего раунда.');
      } else {
        alert(`Нельзя сделать ставку. Дождитесь начала раунда.`);
      }
      return;
    }

    // Отправляем ставку через WebSocket
    setShowBetModal(false);
    setHasBet(true);
    setCashedOut(false);

    socketPlaceBet(socketGameState.id, selectedBetAmount);
    console.log(
      `✅ Bet placed: ${selectedBetAmount} stars to game #${socketGameState.id}`,
    );

    // ID ставки будет получен из broadcast события aviator:newBet
  };

  const handleCashOut = () => {
    if (gameState === 'flying' && hasBet && !cashedOut && myBetId) {
      // КРИТИЧЕСКАЯ ПРОВЕРКА: Локальный множитель < game.multiplier
      if (socketGameState && multiplier >= socketGameState.multiplier) {
        console.warn('⚠️ Too late! Plane crashed!');
        return;
      }

      setCashedOut(true);
      setCashedOutMultiplier(multiplier);
      const amount = selectedBetAmount * multiplier;
      setWinAmount(amount);
      setWinMultiplier(multiplier);
      setShowWinPopup(true);

      // Отправляем cashout через WebSocket
      if (isConnected) {
        socketCashOut(myBetId, multiplier);
        console.log(`💰 Cashed out! Won ${amount} stars at ${multiplier}x`);
      } else {
        console.log(`💰 Local cashout! Won ${amount} stars at ${multiplier}x`);
      }
    }
  };

  const handleButtonClick = () => {
    if (gameState === 'waiting') {
      handlePlaceBet();
    } else if (gameState === 'flying' && hasBet && !cashedOut) {
      handleCashOut();
    }
  };

  const handleMultiplierSelect = (mult: number) => {
    if (gameState === 'waiting') {
      setSelectedMultiplier(mult);
    }
  };

  return (
    <div
      className="min-h-screen text-white w-full pb-32 pt-4 relative"
      style={{
        backgroundImage:
          'url(https://onegift.work/assets/rocket-bg-DNSMluXj.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* WebSocket Status Indicator */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-black/50 px-3 py-2 rounded-full backdrop-blur-sm">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected && socketGameState
              ? 'bg-green-500 animate-pulse'
              : isConnected
                ? 'bg-yellow-500 animate-pulse'
                : 'bg-red-500'
          }`}
        />
        <span className="text-xs text-white/80">
          {isConnected && socketGameState
            ? 'Готово'
            : isConnected
              ? 'Загрузка...'
              : 'Оффлайн'}
        </span>
        {activeUsers > 0 && (
          <>
            <div className="w-px h-4 bg-white/20" />
            <span className="text-xs text-white/80">👥 {activeUsers}</span>
          </>
        )}
      </div>

      {/* Content wrapper */}
      <div className="relative z-10">
        <div className="relative rounded-3xl overflow-hidden h-[400px] flex items-center justify-center">
          {/* Next Round Countdown */}
          {gameState === 'nextRound' && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <motion.div
                className="text-8xl font-bold text-blue-400 mb-4"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
              >
                {countdown}
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Следующий раунд
              </h2>
              <p className="text-gray-400">Приготовьтесь к взлёту!</p>
            </motion.div>
          )}

          {/* Welcome message when waiting */}
          {gameState === 'waiting' && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex justify-center mb-4">
                <LottiePlayer
                  src="https://cdn.changes.tg/gifts/models/Stellar%20Rocket/lottie/Sky%20Ghost.json"
                  width={100}
                  height={100}
                  autoplay={true}
                  loop={true}
                />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Готовы к взлёту?
              </h2>
              <p className="text-gray-400">
                Сделайте ставку и наблюдайте за ростом!
              </p>
            </motion.div>
          )}

          {/* Multiplier Display - only show when flying */}
          {gameState === 'flying' && (
            <div className="absolute top-16 left-16 z-10">
              <motion.div
                className="text-6xl font-bold text-white drop-shadow-2xl"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                }}
              >
                x{multiplier.toFixed(2)}
              </motion.div>
            </div>
          )}

          {/* Curved path - Static blue gradient line */}
          {gameState === 'flying' && (
            <Image
              src={'/line.svg'}
              width={400}
              height={400}
              className="absolute w-full h-full -left-16 -bottom-16"
              alt="Graph"
            />
          )}

          {/* Static Rocket - Fixed position on the curve */}
          {gameState === 'flying' && (
            <motion.div
              className="absolute"
              style={{
                right: '15%',
                top: '15%',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              {/* Lottie Rocket Animation */}
              <LottiePlayer
                src="/PEPE ROCKET.json"
                width={150}
                height={150}
                autoplay={true}
                loop={true}
              />
            </motion.div>
          )}

          {/* Crash effect */}
          {gameState === 'crashed' && (
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <div className="text-6xl text-center">💥</div>
              <div className="text-2xl text-white font-bold mt-2">Crashed!</div>
            </motion.div>
          )}
        </div>

        {/* Multiplier Selection */}
        <div className="px-4 mb-4">
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            {multipliers.map((mult, index) => (
              <motion.button
                key={index}
                className={`flex-shrink-0 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                  selectedMultiplier === mult
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-500/20 text-blue-300'
                }`}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMultiplierSelect(mult)}
              >
                {mult.toFixed(2)}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Place Bet Button */}
        <div className="px-4 mb-6">
          <motion.button
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 ${
              !socketGameState
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : gameState === 'waiting'
                  ? 'bg-blue-500 text-white'
                  : gameState === 'nextRound'
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : gameState === 'flying' && hasBet && !cashedOut
                      ? 'bg-green-500 text-white'
                      : gameState === 'flying' && cashedOut
                        ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                        : 'bg-red-500 text-white'
            }`}
            whileTap={
              socketGameState &&
              (gameState === 'waiting' ||
                (gameState === 'flying' && hasBet && !cashedOut))
                ? { scale: 0.98 }
                : {}
            }
            onClick={handleButtonClick}
            disabled={
              !socketGameState ||
              gameState === 'nextRound' ||
              (gameState === 'flying' && (!hasBet || cashedOut))
            }
          >
            {!socketGameState && (
              <>
                <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                Загрузка игры...
              </>
            )}
            {socketGameState && gameState === 'waiting' && (
              <>
                Сделать ставку <RocketIcon size={20} />
              </>
            )}
            {socketGameState && gameState === 'nextRound' && (
              <>Ожидание раунда ({countdown}s)</>
            )}
            {socketGameState &&
              gameState === 'flying' &&
              hasBet &&
              !cashedOut && <>💰 Забрать x{multiplier.toFixed(2)}</>}
            {socketGameState && gameState === 'flying' && cashedOut && (
              <>✅ Выигрыш сохранён x{cashedOutMultiplier.toFixed(2)}</>
            )}
            {socketGameState && gameState === 'flying' && !hasBet && (
              <>Полёт...</>
            )}
            {socketGameState && gameState === 'crashed' && <>💥 Crashed!</>}
          </motion.button>
        </div>

        {/* Players List */}
        <div className="px-4">
          <div className="mb-3">
            <h3 className="text-gray-400 text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Активные ставки ({activeBets.length})
            </h3>
          </div>
          <div className="space-y-3">
            {activeBets
              .slice(0, 5)
              .map((bet: (typeof activeBets)[0], index: number) => (
                <motion.div
                  key={bet.betId}
                  className={`bg-gradient-to-r backdrop-blur-sm rounded-2xl p-4 flex items-center justify-between border ${
                    bet.cashedAt
                      ? 'from-green-900/40 to-green-800/40 border-green-700/50'
                      : 'from-gray-800/80 to-gray-900/80 border-gray-700/50'
                  }`}
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{
                    delay: index * 0.05,
                    type: 'spring',
                    stiffness: 200,
                    damping: 20,
                  }}
                >
                  {/* Left side - User info */}
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-2xl border-2 border-blue-400/30">
                      {bet.username.charAt(0).toUpperCase()}
                    </div>

                    {/* Name and stats */}
                    <div>
                      <h3 className="text-white font-semibold text-base">
                        {bet.username}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-yellow-400 text-sm flex items-center gap-1">
                          <TelegramStar />
                          {bet.amount}
                        </span>
                        {bet.cashedAt && (
                          <span className="text-green-400 text-sm font-bold">
                            x {bet.cashedAt.toFixed(2)} ✓
                          </span>
                        )}
                        {bet.isInventoryBet && (
                          <span className="text-purple-400 text-xs">🎁</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side - Winnings or Waiting */}
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      {bet.cashedAt ? (
                        <div className="text-green-400 font-bold text-lg flex items-center gap-1">
                          <TelegramStar />
                          {Math.round(bet.amount * bet.cashedAt)}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">Waiting...</div>
                      )}
                    </div>
                    <motion.div
                      className="text-3xl"
                      animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.3,
                      }}
                    ></motion.div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>

        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>

      {/* Bet Modal Bottom Sheet */}
      <AnimatePresence>
        {showBetModal && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBetModal(false)}
            />

            {/* Bottom Sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-[10000] bg-gradient-to-b from-gray-800 to-gray-900 rounded-t-3xl shadow-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 100 || velocity.y > 500) {
                  setShowBetModal(false);
                }
              }}
              style={{ height: '60%' }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1 bg-gray-600 rounded-full" />
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowBetModal(false)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-gray-700/50 rounded-full text-gray-300 hover:bg-gray-700 transition-colors text-xl"
              >
                ✕
              </button>

              <div className="px-4 pb-6 h-full flex flex-col">
                {/* Title */}
                <h2 className="text-xl font-bold text-white text-center mb-4 mt-2">
                  {betType === 'balance'
                    ? 'Выберите сумму'
                    : 'Выберите подарки'}
                </h2>

                {/* Tab Switcher */}
                <div className="flex bg-gray-700/50 rounded-2xl p-1 ">
                  <button
                    onClick={() => setBetType('balance')}
                    className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      betType === 'balance'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-400'
                    }`}
                  >
                    Баланс
                  </button>
                  <button
                    onClick={() => setBetType('gifts')}
                    className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      betType === 'gifts'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-400'
                    }`}
                  >
                    Подарки
                  </button>
                </div>

                {/* Balance Content */}
                {betType === 'balance' && (
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    <div className="text-center mb-4">
                      <div className="text-5xl font-bold text-white">
                        {selectedBetAmount}{' '}
                        <span className="text-3xl text-gray-400">STARS</span>
                      </div>
                    </div>

                    {/* Amount Selection Buttons */}
                    <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
                      {[100, 200, 300, 400, 500].map((amount) => (
                        <motion.button
                          key={amount}
                          onClick={() => setSelectedBetAmount(amount)}
                          className={`flex-shrink-0 px-2.5 py-1 rounded-full font-medium text-xs flex items-center justify-center gap-1 transition-all ${
                            selectedBetAmount === amount
                              ? 'bg-[#44381e] text-[#ffd967]'
                              : 'bg-gradient-to-r from-gray-700 to-gray-800 text-white '
                          }`}
                          whileTap={{ scale: 0.95 }}
                        >
                          {amount} <TelegramStar />
                        </motion.button>
                      ))}
                    </div>

                    <div className="absolute bottom-6 left-4 right-4">
                      <motion.button
                        onClick={handleConfirmBet}
                        className="mt-auto w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                        whileTap={{ scale: 0.98 }}
                      >
                        Сделать ставку <RocketIcon size={20} />
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Gifts Content */}
                {betType === 'gifts' && (
                  <>
                    {userGifts.length === 0 ? (
                      /* No Gifts State */
                      <div className="flex flex-col items-center justify-center h-full py-4">
                        {/* Content */}
                        <div className="flex flex-col items-center justify-center h-full">
                          {/* Character Image */}
                          <div className="mb-4">
                            <LottiePlayer
                              src="https://cdn.changes.tg/gifts/models/Plush%20Pepe/lottie/Cold%20Heart.json"
                              width={120}
                              height={120}
                              autoplay={true}
                              loop={true}
                            />
                          </div>

                          {/* Text */}
                          <h3 className="text-lg font-bold text-white mb-1.5">
                            У вас нет подарков
                          </h3>
                          <p className="text-gray-400 text-sm text-center mb-4 px-4">
                            Отправьте подарок{' '}
                            <span className="text-blue-400 font-medium">
                              @easy_case
                            </span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Has Gifts State */
                      <>
                        {/* Gifts Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {userGifts.map((gift) => (
                            <motion.div
                              key={gift.id}
                              className="bg-gray-700/50 rounded-xl p-3 flex flex-col items-center cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all"
                              whileTap={{ scale: 0.95 }}
                            >
                              <div className="text-4xl mb-2">{gift.icon}</div>
                              <span className="text-xs text-gray-300">
                                {gift.name}
                              </span>
                            </motion.div>
                          ))}
                        </div>

                        {/* Confirm Button */}
                        <div className="mt-auto">
                          <motion.button
                            onClick={handleConfirmBet}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                            whileTap={{ scale: 0.98 }}
                          >
                            Сделать ставку <RocketIcon size={20} />
                          </motion.button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Win Popup */}
      <AnimatePresence>
        {showWinPopup && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[20000] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWinPopup(false)}
            >
              {/* Popup Card */}
              <motion.div
                className="bg-gradient-to-b from-green-500/20 to-green-700/20 backdrop-blur-xl border-2 border-green-400/50 rounded-3xl p-8 w-full mx-4 relative"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 10 }}
                transition={{ type: 'spring', duration: 0.5 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Success Icon */}
                <motion.div
                  className="flex justify-center items-center mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <LottiePlayer
                    src="https://cdn.changes.tg/gifts/models/Bonded%20Ring/lottie/Froge%20Ring.json"
                    width={120}
                    height={120}
                    autoplay={true}
                    loop={true}
                  />
                </motion.div>

                {/* Title */}
                <motion.h2
                  className="text-3xl font-bold text-white text-center mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Поздравляем!
                </motion.h2>

                {/* Multiplier */}
                <motion.div
                  className="text-center mb-4"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="text-6xl font-bold text-green-400 mb-2">
                    x{winMultiplier.toFixed(2)}
                  </div>
                </motion.div>

                {/* Win Amount */}
                <motion.div
                  className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-400/30 rounded-2xl p-4 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-center">
                    <p className="text-gray-300 text-sm mb-1">Вы выиграли</p>
                    <div className="text-4xl font-bold text-yellow-400 flex items-center justify-center gap-2">
                      <TelegramStar />
                      {winAmount.toFixed(0)}
                    </div>
                  </div>
                </motion.div>

                {/* Close Button */}
                <motion.button
                  onClick={() => setShowWinPopup(false)}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg rounded-2xl shadow-lg"
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Отлично! 🚀
                </motion.button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lose Popup */}
      <AnimatePresence>
        {showLosePopup && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[20000] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLosePopup(false)}
            >
              {/* Popup Card */}
              <motion.div
                className="bg-gradient-to-b from-red-500/20 to-red-700/20 backdrop-blur-xl border-2 border-red-400/50 rounded-3xl p-8 w-full mx-4 relative"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 10 }}
                transition={{ type: 'spring', duration: 0.5 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Lose Icon */}
                <motion.div
                  className="flex justify-center items-center mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <LottiePlayer
                    src="https://cdn.changes.tg/gifts/models/Electric%20Skull/lottie/Terminator.json"
                    width={120}
                    height={120}
                    autoplay={true}
                    loop={true}
                  />
                </motion.div>

                {/* Crash Text */}
                <motion.div
                  className="text-center mb-4"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="text-5xl font-bold text-red-400 mb-2">
                    💥 Crashed!
                  </div>
                </motion.div>

                {/* Lost Amount */}
                <motion.div
                  className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-400/30 rounded-2xl p-4 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-center">
                    <p className="text-gray-300 text-sm mb-1">Вы потеряли</p>
                    <div className="text-4xl font-bold text-red-400 flex items-center justify-center gap-2">
                      <TelegramStar />
                      {lostAmount.toFixed(0)}
                    </div>
                  </div>
                </motion.div>

                {/* Message */}
                <motion.p
                  className="text-gray-300 text-center text-sm mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Попробуйте ещё раз в следующем раунде!
                </motion.p>

                {/* Close Button */}
                <motion.button
                  onClick={() => setShowLosePopup(false)}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-lg rounded-2xl shadow-lg"
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  Понятно 😔
                </motion.button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
