# Quick Start: Telegram Gifts Integration

## Installation Steps

### 1. Install Required Dependencies

```bash
yarn add telegram input @nestjs/schedule
```

### 2. Run Database Migration

```bash
yarn prisma migrate dev --name add_telegram_gifts
```

### 3. Generate Telegram Session

Create a file `scripts/generate-telegram-session.js`:

```javascript
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');

// Replace these with your credentials from https://my.telegram.org/apps
const apiId = 0; // Your API ID (number)
const apiHash = ''; // Your API Hash (string)

(async () => {
  const stringSession = new StringSession('');
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text('Phone number (with country code):'),
    password: async () => await input.text('2FA Password (if enabled):'),
    phoneCode: async () => await input.text('Verification code from Telegram:'),
    onError: (err) => console.log(err),
  });

  console.log('\n✅ Successfully authenticated!');
  console.log('\n📋 Your session string (save this):');
  console.log(client.session.save());
  console.log('\n⚠️ Keep this session string SECRET!');
  
  await client.disconnect();
  process.exit(0);
})();
```

Run the script:

```bash
node scripts/generate-telegram-session.js
```

### 4. Add Credentials to Database

Option A: Using Prisma Studio (Recommended)

```bash
yarn prisma studio
```

Then add three records to the `System` table:

| key | value |
|-----|-------|
| TELEGRAM_API_ID | Your API ID (from my.telegram.org) |
| TELEGRAM_API_HASH | Your API Hash |
| TELEGRAM_SESSION_STRING | Session string from step 3 |

Option B: Using SQL

```sql
INSERT INTO "System" (key, value, "createdAt", "updatedAt") VALUES 
  ('TELEGRAM_API_ID', '12345678', NOW(), NOW()),
  ('TELEGRAM_API_HASH', 'your_api_hash_here', NOW(), NOW()),
  ('TELEGRAM_SESSION_STRING', 'your_session_string_here', NOW(), NOW());
```

### 5. Start the Application

```bash
yarn start:dev
```

Look for these log messages:

```
✅ Telegram UserBot initialized successfully
Starting gift polling (every 5s)
[CRON] 🔄 Checking for new gifts...
```

## Testing the Integration

### 1. Send Yourself a Test Gift

1. Use another Telegram account or ask a friend
2. Send a Telegram Star gift to your account
3. Wait 10-15 seconds
4. Check logs for: `[POLL] ✅ Processed MessageActionStarGift...`

### 2. Check Received Gifts via API

```bash
# Get JWT token first
curl -X POST http://localhost:3000/user/test

# Get your gifts
curl -X GET http://localhost:3000/gift/my-gifts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Convert Gift to Inventory

```bash
curl -X POST http://localhost:3000/gift/convert-to-inventory \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"giftId": 1}'
```

## Common Issues

### "Telegram library not installed"

```bash
yarn add telegram input
```

### "Telegram API credentials not found"

Make sure you added all three System records (TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_SESSION_STRING)

### "AUTH_KEY_DUPLICATED"

Your session is being used by another process. Stop all instances and restart.

### No gifts detected

- Ensure you sent real Telegram Star gifts (not regular messages)
- Check that polling is active in logs
- Verify session string is valid

## Next Steps

1. ✅ Install dependencies
2. ✅ Run migration
3. ✅ Generate session string
4. ✅ Add credentials to database
5. ✅ Start application
6. ✅ Test with real gift
7. ✅ Read full documentation in `docs/TELEGRAM_GIFTS_GUIDE.md`

## API Endpoints

### User Endpoints
- `GET /gift/my-gifts` - View your Telegram gifts
- `POST /gift/convert-to-inventory` - Convert gift to inventory item
- `GET /gift/available` - View available gifts for conversion
- `GET /gift/nft` - View NFT gifts

### Admin Endpoints (requires admin role)
- `GET /admin/gift/all` - View all gifts
- `POST /admin/gift/convert-to-prize` - Convert gift to prize for cases
- `POST /admin/gift/convert-to-inventory` - Convert gift for any user
- `POST /admin/gift/send-notification` - Send gift notification via Telegram
- `GET /admin/gift/nft` - View all NFT gifts

## Documentation

Full documentation: `docs/TELEGRAM_GIFTS_GUIDE.md`

Swagger UI: `http://localhost:3000/api` (after starting the app)
