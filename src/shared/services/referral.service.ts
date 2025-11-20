import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

interface ReferralReward {
  referrerId: string;
  referredUserId: string;
  amount: number;
  percentage: number;
  isFirstDeposit: boolean;
}

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Process referral commissions for a deposit
   * - First deposit: referrer gets 10% in XTR (Telegram Stars)
   * - Subsequent deposits: referrer gets 3% in XTR (Telegram Stars)
   * @param userId - User who made the deposit
   * @param depositAmountInXTR - Deposit amount in Telegram Stars (XTR)
   * @returns Referral reward if applicable
   */
  async processDepositReferrals(
    userId: string,
    depositAmountInXTR: number,
  ): Promise<{ referral: ReferralReward | null }> {
    try {
      // Get user with referrer info
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          referredBy: true,
        },
      });

      // No referrer, no commission
      if (!user?.referredBy) {
        return { referral: null };
      }

      // Check if this is the first completed payment
      const completedPaymentsCount = await this.prisma.payment.count({
        where: {
          userId: userId,
          status: 'COMPLETED',
        },
      });

      // Determine commission rate
      const isFirstDeposit = completedPaymentsCount === 0;
      const commissionRate = isFirstDeposit ? 0.1 : 0.03; // 10% or 3%
      const commissionAmount = Math.floor(depositAmountInXTR * commissionRate);

      if (commissionAmount <= 0) {
        return { referral: null };
      }

      this.logger.log(
        `Processing referral: User ${userId} deposit ${depositAmountInXTR} XTR, ` +
          `referrer ${user.referredBy} gets ${commissionAmount} XTR ` +
          `(${isFirstDeposit ? '10% first deposit' : '3% subsequent deposit'})`,
      );

      return {
        referral: {
          referrerId: user.referredBy,
          referredUserId: userId,
          amount: commissionAmount,
          percentage: commissionRate,
          isFirstDeposit,
        },
      };
    } catch (error) {
      this.logger.error('Failed to process referral commissions:', error);
      // Don't throw - referral processing shouldn't block the main payment
      return { referral: null };
    }
  }
}
