# Installation Steps for Telegram Gifts Feature

Follow these steps **in order** to set up the Telegram Gifts integration.

## Step 1: Install Node Dependencies

```bash
cd telegram-casino-backend
yarn add telegram input @nestjs/schedule
```

**What this does**: Installs the required libraries for Telegram UserBot API and CRON scheduling.

## Step 2: Run Database Migration

```bash
yarn prisma migrate dev --name add_telegram_gifts
```

**What this does**: 
- Creates the `TelegramGift` table
- Adds `isGift` and `giftId` fields to `Prize` table
- Adds `telegramGifts` relation to `User` table
- Adds new `SystemKey` enum values

## Step 3: Get Telegram API Credentials

1. Go to https://my.telegram.org/apps
2. Log in with your Telegram account (the one you'll use for receiving gifts)
3. Click "Create application"
4. Fill in the form:
   - **App title**: Your Casino Bot
   - **Short name**: casino-bot
   - **Platform**: Other
   - **Description**: Casino gift monitoring
5. Click "Create application"
6. **Save these values**:
   - `api_id` (a number like 12345678)
   - `api_hash` (a string like "abcdef123456...")

## Step 4: Generate Telegram Session String

1. Edit the session generator script:

```bash
nano scripts/generate-telegram-session.js
```

2. Update these lines with your credentials from Step 3:

```javascript
const apiId = 12345678; // Your API ID
const apiHash = 'your_api_hash_here'; // Your API Hash
```

3. Save and run the script:

```bash
node scripts/generate-telegram-session.js
```

4. Follow the prompts:
   - Enter your phone number (with country code, e.g., +1234567890)
   - Enter the verification code from Telegram
   - If you have 2FA enabled, enter your password

5. **Copy the session string** that's displayed - it will look like:
   ```
   1AQAAAAAAA...very long string...AAAAA
   ```

## Step 5: Add Credentials to Database

### Option A: Using Prisma Studio (Recommended)

```bash
yarn prisma studio
```

This opens a web interface at http://localhost:5555

1. Click on the **System** table
2. Click **Add record** three times to add:

**Record 1:**
- key: `TELEGRAM_API_ID`
- value: Your API ID (e.g., `12345678`)
- createdAt: (auto-filled)
- updatedAt: (auto-filled)

**Record 2:**
- key: `TELEGRAM_API_HASH`
- value: Your API Hash (e.g., `abcdef123456...`)
- createdAt: (auto-filled)
- updatedAt: (auto-filled)

**Record 3:**
- key: `TELEGRAM_SESSION_STRING`
- value: Your session string from Step 4
- createdAt: (auto-filled)
- updatedAt: (auto-filled)

3. Click **Save 3 changes**

### Option B: Using SQL

Connect to your PostgreSQL database and run:

```sql
INSERT INTO "System" (key, value, "createdAt", "updatedAt") VALUES 
  ('TELEGRAM_API_ID', 'YOUR_API_ID', NOW(), NOW()),
  ('TELEGRAM_API_HASH', 'YOUR_API_HASH', NOW(), NOW()),
  ('TELEGRAM_SESSION_STRING', 'YOUR_SESSION_STRING', NOW(), NOW());
```

Replace `YOUR_API_ID`, `YOUR_API_HASH`, and `YOUR_SESSION_STRING` with your actual values.

## Step 6: Start the Application

```bash
yarn start:dev
```

**Look for these log messages to confirm success:**

```
✅ Telegram UserBot initialized successfully
Starting gift polling (every 5s)
[CRON] 🔄 Checking for new gifts...
```

If you see these, the integration is working! ✅

## Step 7: Test with a Real Gift

### Send yourself a test gift:

1. Ask a friend or use another Telegram account
2. Send a **Telegram Star gift** to your account
3. Wait 10-15 seconds
4. Check the application logs

**Expected log output:**

```
[POLL] ✅ Processed MessageActionStarGift: "Gift Name" from user 123456789 → 987654321
```

### Verify in the database:

```bash
yarn prisma studio
```

1. Open the **TelegramGift** table
2. You should see your received gift!

### Test the API:

```bash
# Get a JWT token (use your real user)
curl -X POST http://localhost:3000/user/telegram \
  -H "Content-Type: application/json" \
  -d '{"initData": "..."}'

# Get your gifts
curl -X GET http://localhost:3000/gift/my-gifts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### "Telegram library not installed"

```bash
yarn add telegram input
```

### "Telegram API credentials not found in System table"

Verify all three records exist:
```bash
yarn prisma studio
```
Check the System table for `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, `TELEGRAM_SESSION_STRING`

### "AUTH_KEY_DUPLICATED"

Your session is in use by another process.

**Solution**:
1. Stop ALL instances of your application
2. Wait 30 seconds
3. Restart: `yarn start:dev`

### No gifts detected

**Checklist**:
- [ ] Did you send a **Telegram Star gift** (not a regular message)?
- [ ] Is the polling active? Check logs for `[POLL] Stats: ...`
- [ ] Is the session string valid? Try regenerating it
- [ ] Are you using the correct Telegram account?

### Session string expired

**Solution**: Re-run Step 4 to generate a new session string, then update the database.

## What's Next?

✅ Installation complete!

Now you can:

1. **View received gifts**: `GET /gift/my-gifts`
2. **Convert gifts to inventory**: `POST /gift/convert-to-inventory`
3. **Admin: Convert to prizes**: `POST /admin/gift/convert-to-prize`
4. **Admin: Send notifications**: `POST /admin/gift/send-notification`

📖 Read the full documentation:
- [Quick Start Guide](TELEGRAM_GIFTS_QUICKSTART.md)
- [Complete Guide](TELEGRAM_GIFTS_GUIDE.md)
- [Implementation Summary](TELEGRAM_GIFTS_IMPLEMENTATION_SUMMARY.md)

📚 API Documentation: http://localhost:3000/api (Swagger UI)

---

**Need help?** Check the troubleshooting section in [TELEGRAM_GIFTS_GUIDE.md](TELEGRAM_GIFTS_GUIDE.md)
