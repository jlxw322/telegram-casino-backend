import { LanguageCode } from '@prisma/client';

export const messages = {
  [LanguageCode.en]: {
    payment: {
      title: 'Casino Bot',
      description: 'Deposit',
      label: 'Deposit',
      success:
        'Thank you for your purchase! Your payment has been successfully processed. 🎉',
      failed: 'Failed to confirm payment',
      invalidRequest: 'Invalid payment request.',
      notFound: 'Payment not found.',
      processingError: 'An error occurred while processing your payment.',
    },
    bot: {
      welcome: 'Welcome to Casino Bot!',
      buttonText: '🎮 Casino Bot',
      unknownCommand:
        'Unknown command. Use /help for a list of available commands.',
    },
    referral: {
      newReferral:
        '🎉 New referral! User @{username} has joined using your referral link.',
      firstDepositReward:
        '💰 Your referral @{username} made their first deposit! You earned {amount} XTR (10% commission). 🎁',
      subsequentDepositReward:
        '💸 Your referral @{username} made a deposit! You earned {amount} XTR (3% commission).',
      welcomeReferral:
        '👋 Welcome! You were invited by @{referrerUsername}. Enjoy the game! 🎮',
    },
  },
  [LanguageCode.ru]: {
    payment: {
      title: 'Казино Бот',
      description: 'Пополнение',
      label: 'Пополнение',
      success: 'Спасибо за вашу покупку! Ваш платеж успешно обработан. 🎉',
      failed: 'Не удалось подтвердить оплату',
      invalidRequest: 'Неверный запрос на оплату.',
      notFound: 'Платеж не найден.',
      processingError: 'Произошла ошибка при обработке вашего платежа.',
    },
    bot: {
      welcome: 'Добро пожаловать в Казино Бот!',
      buttonText: '🎮 Казино Бот',
      unknownCommand:
        'Неизвестная команда. Используйте /help для списка доступных команд.',
    },
    referral: {
      newReferral:
        '🎉 Новый реферал! Пользователь @{username} присоединился по вашей реферальной ссылке.',
      firstDepositReward:
        '💰 Ваш реферал @{username} сделал первый депозит! Вы получили {amount} XTR (комиссия 10%). 🎁',
      subsequentDepositReward:
        '💸 Ваш реферал @{username} сделал депозит! Вы получили {amount} XTR (комиссия 3%).',
      welcomeReferral:
        '👋 Добро пожаловать! Вас пригласил @{referrerUsername}. Приятной игры! 🎮',
    },
  },
};

export function getMessage(
  languageCode: LanguageCode,
  key: string,
  params?: Record<string, string | number>,
): string {
  const keys = key.split('.');
  let message: any = messages[languageCode];

  for (const k of keys) {
    message = message?.[k];
  }

  let result = message || key;

  // Replace parameters in the message
  if (params) {
    Object.keys(params).forEach((paramKey) => {
      result = result.replace(
        new RegExp(`\\{${paramKey}\\}`, 'g'),
        String(params[paramKey]),
      );
    });
  }

  return result;
}
