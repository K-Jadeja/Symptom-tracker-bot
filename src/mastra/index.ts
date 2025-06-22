import { Mastra } from "@mastra/core/mastra";
import { createLogger } from "@mastra/core/logger";
import { symptomTrackerAgent } from "./agents/symptomTracker";
import { TelegramIntegration } from "./integrations/telegram";
import { DiscordIntegration } from "./integrations/discord";

export const mastra = new Mastra({
  agents: {
    symptomTrackerAgent,
  },
  logger: createLogger({
    name: "Mastra",
    level: "info",
  }),
});

// Initialize Telegram bot if token is available
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not set in environment variables");
  process.exit(1);
}

// Start the Telegram bot
// export const telegramBot = new TelegramIntegration(TELEGRAM_BOT_TOKEN);

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN!;
if (!DISCORD_TOKEN) {
  console.error("DISCORD_BOT_TOKEN is not set in environment variables");
  process.exit(1);
}

export const discordBot = new DiscordIntegration(DISCORD_TOKEN);
