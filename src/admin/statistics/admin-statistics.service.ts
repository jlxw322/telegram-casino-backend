import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { StatisticsFilterDto } from './dto/statistics-filter.dto';
import {
  AnalyticsResponseDto,
  DailyRevenueDto,
} from './dto/analytics-response.dto';
import {
  TransactionDto,
  TransactionType,
  TransactionStatus,
} from './dto/transaction-response.dto';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

@Injectable()
export class AdminStatisticsService {
  private logger = new Logger(AdminStatisticsService.name);

  constructor(private prisma: PrismaService) {}

  async getAnalytics(filter: StatisticsFilterDto): Promise<AnalyticsResponseDto> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const fourteenDaysAgo = new Date(now);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const startDate = filter.startDate ? new Date(filter.startDate) : sevenDaysAgo;
      const endDate = filter.endDate ? new Date(filter.endDate) : now;

      // Get total users and new users in the period
      const [totalUsers, newUsersThisPeriod, newUsersPreviousPeriod] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: fourteenDaysAgo,
              lt: startDate,
            },
          },
        }),
      ]);

      // Calculate user growth percentage
      const userGrowthPercentage =
        newUsersPreviousPeriod > 0
          ? ((newUsersThisPeriod - newUsersPreviousPeriod) / newUsersPreviousPeriod) * 100
          : newUsersThisPeriod > 0
          ? 100
          : 0;

      // Get total bets and inventory items for revenue calculation
      const [bets, inventoryItems, payments] = await Promise.all([
        this.prisma.bet.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            user: true,
          },
        }),
        this.prisma.inventoryItem.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            case: true,
            prize: true,
          },
        }),
        this.prisma.payment.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: 'COMPLETED',
          },
        }),
      ]);

      // Calculate revenue from cases and bets
      const caseRevenue = inventoryItems.reduce(
        (sum, item) => sum + (item.case?.price || 0),
        0,
      );
      const betRevenue = bets.reduce((sum, bet) => sum + bet.amount, 0);
      const depositRevenue = payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      );
      const totalRevenue = caseRevenue + betRevenue + depositRevenue;

      // Calculate payouts (prizes won + cashouts)
      const prizesWon = inventoryItems.reduce(
        (sum, item) => sum + item.prize.amount,
        0,
      );
      const cashouts = bets
        .filter((bet) => bet.cashedAt)
        .reduce((sum, bet) => sum + bet.amount * Number(bet.cashedAt || 0), 0);
      const totalPayouts = prizesWon + cashouts;

      // Calculate profit
      const totalProfit = totalRevenue - totalPayouts;

      // Get unique active users (users who made bets or opened cases)
      const activeUserIds = new Set([
        ...bets.map((bet) => bet.userId),
        ...inventoryItems.map((item) => item.userId),
      ]);
      const activeUsers = activeUserIds.size;

      // Calculate activity percentage
      const activityPercentage = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

      // Calculate average check (total revenue / active users)
      const averageCheck = activeUsers > 0 ? totalRevenue / activeUsers : 0;

      // Calculate retention (users who returned after 7 days)
      const usersCreatedBeforeWeek = await this.prisma.user.findMany({
        where: {
          createdAt: {
            lt: sevenDaysAgo,
          },
        },
        select: {
          id: true,
        },
      });

      const returningUsersCount = await this.prisma.bet.groupBy({
        by: ['userId'],
        where: {
          userId: {
            in: usersCreatedBeforeWeek.map((u) => u.id),
          },
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      });

      const retentionPercentage =
        usersCreatedBeforeWeek.length > 0
          ? (returningUsersCount.length / usersCreatedBeforeWeek.length) * 100
          : 0;

      // Get daily revenue for the last 7 days
      const dailyRevenue = await this.getDailyRevenue(startDate, endDate);

      return {
        metrics: {
          userGrowthPercentage: Math.round(userGrowthPercentage * 10) / 10,
          averageCheck: Math.round(averageCheck),
          activityPercentage: Math.round(activityPercentage * 10) / 10,
          retentionPercentage: Math.round(retentionPercentage * 10) / 10,
        },
        dailyRevenue,
        totalUsers,
        activeUsers,
        totalRevenue: Math.round(totalRevenue),
        totalPayouts: Math.round(totalPayouts),
        totalProfit: Math.round(totalProfit),
      };
    } catch (error) {
      this.logger.error('Failed to get analytics: ', error);
      throw new HttpException('Failed to get analytics', 500);
    }
  }

  private async getDailyRevenue(startDate: Date, endDate: Date): Promise<DailyRevenueDto[]> {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const dailyData: DailyRevenueDto[] = [];

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysToShow = Math.min(totalDays, 7);

    for (let i = daysToShow - 1; i >= 0; i--) {
      const currentDay = new Date(endDate);
      currentDay.setDate(currentDay.getDate() - i);
      currentDay.setHours(0, 0, 0, 0);

      const nextDay = new Date(currentDay);
      nextDay.setDate(nextDay.getDate() + 1);

      const [dayBets, dayInventory, dayPayments] = await Promise.all([
        this.prisma.bet.findMany({
          where: {
            createdAt: {
              gte: currentDay,
              lt: nextDay,
            },
          },
        }),
        this.prisma.inventoryItem.findMany({
          where: {
            createdAt: {
              gte: currentDay,
              lt: nextDay,
            },
          },
          include: {
            case: true,
            prize: true,
          },
        }),
        this.prisma.payment.findMany({
          where: {
            createdAt: {
              gte: currentDay,
              lt: nextDay,
            },
            status: 'COMPLETED',
          },
        }),
      ]);

      const caseRevenue = dayInventory.reduce(
        (sum, item) => sum + (item.case?.price || 0),
        0,
      );
      const betRevenue = dayBets.reduce((sum, bet) => sum + bet.amount, 0);
      const depositRevenue = dayPayments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      );
      const revenue = caseRevenue + betRevenue + depositRevenue;

      const prizesWon = dayInventory.reduce((sum, item) => sum + item.prize.amount, 0);
      const cashouts = dayBets
        .filter((bet) => bet.cashedAt)
        .reduce((sum, bet) => sum + bet.amount * Number(bet.cashedAt || 0), 0);
      const payout = prizesWon + cashouts;

      dailyData.push({
        day: days[currentDay.getDay()],
        revenue: Math.round(revenue),
        payout: Math.round(payout),
        profit: Math.round(revenue - payout),
      });
    }

    return dailyData;
  }

  async getTransactions(
    pagination: PaginationDto,
    filter: StatisticsFilterDto,
  ): Promise<{ data: TransactionDto[]; meta: any }> {
    try {
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      const startDate = filter.startDate ? new Date(filter.startDate) : undefined;
      const endDate = filter.endDate ? new Date(filter.endDate) : undefined;

      const dateFilter =
        startDate && endDate
          ? {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            }
          : {};

      // Get bets (stakes and wins)
      const [bets, inventoryItems, payments] = await Promise.all([
        this.prisma.bet.findMany({
          where: dateFilter,
          include: {
            user: true,
            aviator: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.inventoryItem.findMany({
          where: dateFilter,
          include: {
            user: true,
            case: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.payment.findMany({
          where: {
            ...dateFilter,
          },
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      ]);

      // Transform to unified transaction format
      const transactions: TransactionDto[] = [];

      // Add bets
      bets.forEach((bet) => {
        transactions.push({
          id: `bet_${bet.id}`,
          user: `user_${bet.user.username}`,
          type: TransactionType.BET,
          game: 'Aviator',
          amount: bet.amount,
          status: bet.cashedAt
            ? TransactionStatus.COMPLETED
            : TransactionStatus.PENDING,
          date: bet.createdAt,
        });

        // If cashed out, add as win
        if (bet.cashedAt) {
          transactions.push({
            id: `win_${bet.id}`,
            user: `user_${bet.user.username}`,
            type: TransactionType.WIN,
            game: 'Aviator',
            amount: Math.round(bet.amount * Number(bet.cashedAt)),
            status: TransactionStatus.COMPLETED,
            date: bet.updatedAt,
          });
        }
      });

      // Add case openings as bets
      inventoryItems.forEach((item) => {
        transactions.push({
          id: `case_${item.id}`,
          user: `user_${item.user.username}`,
          type: TransactionType.BET,
          game: item.case?.name || 'Case',
          amount: item.case?.price || 0,
          status: TransactionStatus.COMPLETED,
          date: item.createdAt,
        });
      });

      // Add payments
      payments.forEach((payment) => {
        const isDeposit = payment.status === 'COMPLETED';
        transactions.push({
          id: `payment_${payment.id}`,
          user: `user_${payment.user.username}`,
          type: isDeposit ? TransactionType.DEPOSIT : TransactionStatus.PENDING as any,
          game: null,
          amount: Number(payment.amount),
          status:
            payment.status === 'COMPLETED'
              ? TransactionStatus.COMPLETED
              : payment.status === 'FAILED'
              ? TransactionStatus.FAILED
              : TransactionStatus.PENDING,
          date: payment.createdAt,
        });
      });

      // Sort by date descending
      transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

      // Paginate
      const total = transactions.length;
      const paginatedTransactions = transactions.slice(skip, skip + limit);

      return {
        data: paginatedTransactions,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get transactions: ', error);
      throw new HttpException('Failed to get transactions', 500);
    }
  }
}
