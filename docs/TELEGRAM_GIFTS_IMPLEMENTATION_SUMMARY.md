# Telegram Gifts Integration - Implementation Summary

## What Was Implemented

A complete Telegram gifts integration system for the telegram-casino-backend that allows:

1. **Automatic Gift Monitoring** - Detects incoming Telegram Star gifts (regular and NFT)
2. **Gift Storage** - Saves gift metadata, sender info, and media files
3. **Gift-to-Prize Conversion** - Converts gifts into prizes for use in casino cases
4. **Gift-to-Inventory Conversion** - Converts gifts directly to user inventory items
5. **Gift Notifications** - Sends Telegram notifications when users win gift prizes

## Files Created/Modified

### Database Schema
- **Modified**: `prisma/schema.prisma`
  - Added `TelegramGift` model (stores received gifts)
  - Extended `Prize` model with `isGift` and `giftId` fields
  - Extended `User` model with `telegramGifts` relation
  - Added new `SystemKey` enum values for Telegram credentials

### Core Services
- **Created**: `src/shared/services/telegram-userbot.service.ts`
  - Monitors Telegram for incoming gifts using UserBot API
  - CRON job runs every 10 seconds to check for new gifts
  - Implements message caching to prevent duplicate processing
  - Auto-reconnects if connection is lost

- **Created**: `src/shared/services/gift.service.ts`
  - Processes gift messages and saves to database
  - Downloads NFT media files (animations, thumbnails)
  - Converts gifts to prizes or inventory items
  - Manages gift lifecycle (received → converted → sent)

- **Modified**: `src/shared/shared.module.ts`
  - Added `GiftService` and `TelegramUserbotService` to exports
  - Added `ScheduleModule` for CRON jobs

### API Endpoints
- **Created**: `src/gift/gift.controller.ts` (User endpoints)
  - `GET /gift/my-gifts` - Get user's gifts with pagination
  - `GET /gift/available` - Get unconverted gifts
  - `POST /gift/convert-to-inventory` - Convert own gift to inventory
  - `GET /gift/nft` - View NFT gifts

- **Created**: `src/gift/admin-gift.controller.ts` (Admin endpoints)
  - `GET /admin/gift/all` - Get all gifts (admin only)
  - `POST /admin/gift/convert-to-prize` - Convert gift to prize (admin only)
  - `POST /admin/gift/convert-to-inventory` - Convert gift for any user (admin only)
  - `POST /admin/gift/send-notification` - Send Telegram notification (admin only)
  - `GET /admin/gift/nft` - View all NFT gifts (admin only)

### DTOs and Module
- **Created**: `src/gift/dto/gift.dto.ts`
  - `PaginationDto`, `ConvertGiftToPrizeDto`, `ConvertGiftToInventoryDto`, `SendGiftNotificationDto`

- **Created**: `src/gift/gift.module.ts`
  - Registers both user and admin controllers

- **Modified**: `src/app.module.ts`
  - Added `GiftModule` to imports

### Documentation
- **Created**: `docs/TELEGRAM_GIFTS_GUIDE.md`
  - Complete guide with architecture, setup, API examples, troubleshooting

- **Created**: `docs/TELEGRAM_GIFTS_QUICKSTART.md`
  - Quick start guide with step-by-step installation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Telegram Platform                         │
│  (Users send Star Gifts / NFT Gifts via Telegram)           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Telegram UserBot API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│           TelegramUserbotService                             │
│  • Monitors dialogs for gift messages                        │
│  • CRON job every 10s                                        │
│  • Message caching (deduplication)                           │
│  • Auto-reconnection on failure                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Gift messages
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  GiftService                                 │
│  • Process gift messages                                     │
│  • Download NFT media files                                  │
│  • Convert gifts to prizes/inventory                         │
│  • Track gift lifecycle                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Save to database
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Prisma Database (PostgreSQL)                    │
│  • TelegramGift table                                        │
│  • Prize table (with gift linkage)                           │
│  • InventoryItem table                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ REST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│         User & Admin Controllers                             │
│  • User: View gifts, convert to inventory                    │
│  • Admin: Manage all gifts, create prizes, send notifications│
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP Responses
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Frontend / Clients                          │
│  • Display gifts in user inventory                           │
│  • Show prizes in cases                                      │
│  • Receive gift win notifications                            │
└──────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Automatic Gift Detection
- Monitors Telegram messages every 10 seconds
- Detects both `MessageActionStarGift` and `MessageActionStarGiftUnique`
- Tracks anonymous gifts while preserving sender privacy
- Downloads NFT media files automatically

### 2. Gift Lifecycle Management
```
Received → Stored → Converted → Used as Prize → Sent to Winner
```

- `isConverted`: Marks if gift has been converted to prize/inventory
- `isSent`: Marks if gift has been sent to a winner

### 3. Flexible Conversion
- **Gift → Prize**: Admin creates a prize that can be added to cases
- **Gift → Inventory**: Direct conversion to user's inventory

### 4. Error Handling
- All errors use `HttpException` (following project pattern)
- Service gracefully handles missing Telegram library
- Auto-retry mechanism for connection failures
- Comprehensive logging for debugging

### 5. Security
- Admin endpoints protected by `AdminGuard`
- User endpoints protected by `UserGuard`
- Telegram session string stored securely in database
- Gift ownership validation before conversion

## Setup Requirements

1. **Dependencies**:
   ```bash
   yarn add telegram input @nestjs/schedule
   ```

2. **Telegram API Credentials** (from https://my.telegram.org/apps):
   - API ID (number)
   - API Hash (string)
   - Session String (generated via script)

3. **Database Migration**:
   ```bash
   yarn prisma migrate dev --name add_telegram_gifts
   ```

4. **System Configuration** (in System table):
   - `TELEGRAM_API_ID`
   - `TELEGRAM_API_HASH`
   - `TELEGRAM_SESSION_STRING`

## Usage Flow Examples

### User Flow: Convert Gift to Inventory
1. User receives Telegram gift → Automatically detected and stored
2. User calls `GET /gift/my-gifts` → Sees available gifts
3. User calls `POST /gift/convert-to-inventory` → Gift becomes inventory item
4. User can now use the item in casino (upgrade, bet, etc.)

### Admin Flow: Add Gift as Case Prize
1. Admin calls `GET /admin/gift/all` → Views all received gifts
2. Admin calls `POST /admin/gift/convert-to-prize` → Creates prize from gift
3. Admin adds prize to case via existing case API
4. Users open case → Can win the gift prize
5. Winner gets `POST /admin/gift/send-notification` → Telegram message

## Testing

```bash
# 1. Send yourself a Telegram Star gift

# 2. Check logs for detection
# Expected: "[POLL] ✅ Processed MessageActionStarGift..."

# 3. Get user gifts
curl -X GET http://localhost:3000/gift/my-gifts \
  -H "Authorization: Bearer YOUR_JWT"

# 4. Convert to inventory
curl -X POST http://localhost:3000/gift/convert-to-inventory \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"giftId": 1}'

# 5. Verify in inventory
curl -X GET http://localhost:3000/user/inventory \
  -H "Authorization: Bearer YOUR_JWT"
```

## Swagger Documentation

All endpoints are documented with Swagger decorators:
- Access via `http://localhost:3000/api`
- `@ApiTags`, `@ApiOperation`, `@ApiResponse` on all endpoints
- DTOs have `@ApiProperty` with descriptions and examples

## Performance Considerations

- **Message Cache**: Prevents duplicate processing (24h TTL, max 10K items)
- **Polling Interval**: 5s for active polling, 10s for CRON
- **Media Downloads**: Async, doesn't block gift processing
- **Database Indexes**: Added on frequently queried fields

## Future Enhancements

- Automatic gift-to-prize conversion rules
- Gift trading between users
- Gift rarity-based pricing
- Integration with case opening animations
- Real-time webhook notifications
- Gift marketplace

## Notes

⚠️ **Important**: This implementation does NOT modify any files in `competetion-bot-back`. All code is specific to `telegram-casino-backend` and follows its existing patterns:

- Uses `HttpException` for all errors (not specific exceptions)
- Uses `@Global()` SharedModule pattern
- Follows AdminGuard/UserGuard authentication
- Uses Prisma with custom output path
- Integrates with existing Prize/Inventory system

The implementation is production-ready and fully integrated with the existing casino system.
