import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();

    this.logger.log(
      `🛡️ WsJwtGuard checking client ${client.id}, userId: ${client.data.userId}`,
    );

    // Check if user data is attached (set during connection)
    if (!client.data.userId) {
      this.logger.error(`❌ WsJwtGuard: No userId for client ${client.id}`);
      throw new WsException('Unauthorized');
    }

    this.logger.log(`✅ WsJwtGuard: Authorized user ${client.data.userId}`);
    return true;
  }
}
