# Telegram Gifts Integration Guide

## Overview

The telegram-casino-backend now supports receiving, converting, and sending Telegram gifts (both regular Star gifts and NFT/unique gifts). This allows you to:

1. **Monitor incoming gifts** via Telegram UserBot API
2. **Convert gifts to prizes** that can be used in cases
3. **Convert gifts to inventory items** for specific users
4. **Send gift notifications** to winners via Telegram

## Architecture

### Database Schema

- **TelegramGift** model stores received gifts with metadata
- **Prize** model extended with `isGift` and `giftId` fields
- **User** model has `telegramGifts` relation

### Services

1. **TelegramUserbotService** (`src/shared/services/telegram-userbot.service.ts`)
   - Monitors Telegram for incoming gifts
   - Uses CRON jobs to poll for new gifts every 10 seconds
   - Automatically processes MessageActionStarGift and MessageActionStarGiftUnique

2. **GiftService** (`src/shared/services/gift.service.ts`)
   - Processes gift messages and saves to database
   - Downloads NFT media files (animations, images)
   - Converts gifts to prizes or inventory items

### API Endpoints

#### User Endpoints (`/gift`)

- `GET /gift/my-gifts` - Get current user's Telegram gifts
- `GET /gift/available` - Get gifts available for conversion
- `POST /gift/convert-to-inventory` - Convert user's gift to inventory item
- `GET /gift/nft` - Get all NFT gifts

#### Admin Endpoints (`/admin/gift`)

- `GET /admin/gift/all` - Get all gifts (admin only)
- `POST /admin/gift/convert-to-prize` - Convert gift to prize (admin only)
- `POST /admin/gift/convert-to-inventory` - Convert gift to inventory for any user (admin only)
- `POST /admin/gift/send-notification` - Send gift notification via Telegram (admin only)
- `GET /admin/gift/nft` - Get all NFT gifts (admin only)

## Setup Instructions

### 1. Install Dependencies

```bash
cd telegram-casino-backend
yarn add telegram input @nestjs/schedule
```

### 2. Configure Telegram API Credentials

You need to obtain Telegram API credentials and a session string:

#### Step 1: Get API Credentials

1. Go to https://my.telegram.org/apps
2. Log in with your Telegram account
3. Create a new application
4. Save your `api_id` and `api_hash`

#### Step 2: Generate Session String

Create a script `generate-session.js`:

```javascript
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');

const apiId = YOUR_API_ID; // Replace with your API ID
const apiHash = 'YOUR_API_HASH'; // Replace with your API hash
const stringSession = new StringSession(''); // Start with empty session

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text('Phone number:'),
    password: async () => await input.text('Password (if 2FA):'),
    phoneCode: async () => await input.text('Verification code:'),
    onError: (err) => console.log(err),
  });

  console.log('Session string:', client.session.save());
  console.log('Save this session string to your database!');
  await client.disconnect();
})();
```

Run it:
```bash
node generate-session.js
```

### 3. Add Credentials to Database

Insert the credentials into the `System` table:

```sql
INSERT INTO "System" (key, value) VALUES 
  ('TELEGRAM_API_ID', 'your_api_id'),
  ('TELEGRAM_API_HASH', 'your_api_hash'),
  ('TELEGRAM_SESSION_STRING', 'your_session_string_here');
```

Or use Prisma Studio:
```bash
yarn prisma studio
```

### 4. Run Database Migration

```bash
yarn prisma migrate dev --name add_telegram_gifts
```

This will create the `TelegramGift` table and update the `Prize` model.

### 5. Start the Application

```bash
yarn start:dev
```

The TelegramUserbotService will automatically initialize and start monitoring for gifts.

## How It Works

### Gift Monitoring Flow

1. **CRON Job** runs every 10 seconds checking for new Telegram messages
2. **Message Processing**: Identifies MessageActionStarGift or MessageActionStarGiftUnique
3. **Deduplication**: Uses message cache to avoid processing duplicates
4. **Database Storage**: Saves gift metadata, sender info, and receiver info
5. **Media Download**: For NFT gifts, downloads Lottie animations and images

### Gift to Prize Conversion

```typescript
// Admin converts a gift to a prize
POST /admin/gift/convert-to-prize
{
  "giftId": 123
}

// Creates a Prize with:
// - name: gift.giftName or "Telegram Gift #123"
// - amount: gift.starsValue or 0
// - url: path to downloaded media file
// - isGift: true
// - giftId: unique identifier linking to gift
```

### Gift to Inventory Conversion

```typescript
// User converts their own gift
POST /gift/convert-to-inventory
{
  "giftId": 456
}

// Or admin converts for specific user
POST /admin/gift/convert-to-inventory
{
  "giftId": 456,
  "userId": "uuid-of-user"
}

// Creates:
// 1. Prize (if doesn't exist)
// 2. InventoryItem linked to user
// Marks gift as "isConverted: true"
```

### Sending Gifts as Prizes

```typescript
// After a user wins a gift prize, notify them via Telegram
POST /admin/gift/send-notification
{
  "telegramUserId": 123456789,
  "title": "Premium Gift Box",
  "description": "Congratulations! You won in our casino!"
}

// Sends a Telegram message to the user
```

## Usage Examples

### Example 1: Convert Received Gift to Inventory

```bash
# Get user's gifts
GET /gift/my-gifts?page=1&limit=20
Authorization: Bearer <user-jwt-token>

# Response:
{
  "data": [
    {
      "id": 1,
      "giftName": "Delicious Cake",
      "giftType": "MessageActionStarGiftUnique",
      "serialNumber": "#1234",
      "isConverted": false,
      "messageDate": "2025-11-27T10:30:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20
  }
}

# Convert to inventory
POST /gift/convert-to-inventory
Authorization: Bearer <user-jwt-token>
{
  "giftId": 1
}

# Response:
{
  "success": true,
  "message": "Gift converted to inventory item successfully",
  "data": {
    "inventoryItem": { "id": 789, "prizeId": 456 },
    "prize": { "id": 456, "name": "Delicious Cake", "isGift": true },
    "gift": { "id": 1, "isConverted": true }
  }
}
```

### Example 2: Admin Creates Prize from Gift

```bash
# Get available gifts
GET /admin/gift/all?page=1&limit=50
Authorization: Bearer <admin-jwt-token>

# Convert gift #2 to prize
POST /admin/gift/convert-to-prize
Authorization: Bearer <admin-jwt-token>
{
  "giftId": 2
}

# Now this prize can be added to cases
POST /admin/case/1/items
{
  "prizeId": 457,  # The created prize ID
  "chance": 0.05
}
```

### Example 3: Send Gift Notification to Winner

```bash
# After user wins a case/payout that includes a gift prize
POST /admin/gift/send-notification
Authorization: Bearer <admin-jwt-token>
{
  "telegramUserId": 123456789,
  "title": "🎁 Delicious Cake NFT",
  "description": "You won this unique NFT gift! Check your inventory in the casino app."
}

# User receives Telegram message
```

## Important Notes

### Gift Types

- **MessageActionStarGift**: Regular Star gifts with star value
- **MessageActionStarGiftUnique**: NFT/unique collectible gifts with attributes and rarity

### Anonymous Gifts

- Anonymous gifts have `fromUserId` but `isAnonymous: true`
- The real sender is stored in `fromUserId` for tracking
- Frontend should respect `isAnonymous` flag for display

### Caching and Performance

- Message cache prevents duplicate processing (24-hour TTL)
- Max cache size: 10,000 messages
- Auto-cleanup CRON runs every hour

### Error Handling

- If Telegram library not installed, service logs warning and disables
- All errors use `HttpException` pattern (never throws specific exceptions)
- Failed gift processing doesn't crash the application

## Troubleshooting

### "Telegram library not installed"

```bash
yarn add telegram input
```

### "AUTH_KEY_DUPLICATED"

Stop all instances of the application and restart. The session may be in use by another process.

### "Telegram UserBot not initialized"

Check that:
1. Credentials are in System table
2. Session string is valid
3. No firewall blocking Telegram API (ports 443, 80)

### Gifts not being detected

- Check logs for "[CRON] 🔄 Checking for new gifts..."
- Verify polling is active: "[POLL] Stats: X checked..."
- Ensure gifts are real Telegram Star gifts (not regular messages)

## Security Considerations

1. **Session String**: Keep this secret! It provides full access to the Telegram account
2. **Admin Endpoints**: All gift conversion endpoints require `AdminGuard`
3. **User Validation**: Gift-to-inventory conversion validates user ownership
4. **Rate Limiting**: Consider adding rate limits to prevent abuse

## Future Enhancements

- [ ] Automatic gift-to-prize conversion rules
- [ ] Gift trading between users
- [ ] Gift rarity-based pricing
- [ ] Integration with case opening animations
- [ ] Gift preview thumbnails in frontend
- [ ] Webhook integration for real-time gift notifications
