import { Client, GatewayIntentBits, TextChannel, Message } from "discord.js";
import { symptomTrackerAgent } from "../agents";

export class DiscordIntegration {
  private client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
  });

  private readonly MAX_MESSAGE_LENGTH = 2000;
  private reminderIntervals = new Map<string, NodeJS.Timeout>();

  constructor(token: string) {
    this.client.once("ready", () => {
      console.log(`Discord bot ready as ${this.client.user?.tag}`);
    });

    this.client.on("messageCreate", this.handleMessage.bind(this));
    this.client.login(token).catch(console.error);
  }

  private async setupDailyReminder(channelId: string) {
    // Clear previous interval if exists
    if (this.reminderIntervals.has(channelId)) {
      clearInterval(this.reminderIntervals.get(channelId)!);
    }

    const interval = setInterval(async () => {
      const date = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      try {
        const channel = await this.client.channels.fetch(channelId);
        if (channel && channel.isTextBased()) {
          (channel as TextChannel).send(
            `📋 **Daily Symptom Check-in | ${date}**\nHow are you feeling today?`
          );
        }
      } catch (err) {
        console.error("Failed to send daily reminder:", err);
      }
    }, 60_000); // 1 minute

    this.reminderIntervals.set(channelId, interval);
  }

  private async handleMessage(msg: Message) {
    if (msg.author.bot) return;
    const text = msg.content.trim();
    const channelId = msg.channel.id;

    switch (text.toLowerCase()) {
      case "/start":
        return msg.reply(
          `👋 **Welcome to Symptom Tracker!**\nUse \`/reminder_on\` to start daily check-ins.`
        );

      case "/reminder_on":
        await this.setupDailyReminder(channelId);
        return msg.reply("✅ Daily reminders activated!");

      case "/reminder_off":
        if (this.reminderIntervals.has(channelId)) {
          clearInterval(this.reminderIntervals.get(channelId)!);
          this.reminderIntervals.delete(channelId);
          return msg.reply("❌ Daily reminders deactivated!");
        } else {
          return msg.reply("No active reminders. Use `/reminder_on` to start.");
        }

      case "/help":
        return msg.reply(
          "**Commands:**\n" +
            "`/start` – Welcome message\n" +
            "`/reminder_on` – Turn on daily check-in\n" +
            "`/reminder_off` – Turn off daily check-in\n" +
            "Otherwise, just tell me how you feel today!"
        );
      default:
        // Non-command message: proxy to your agent
        try {
          const sent = await msg.reply("Thinking…");
          let response = "";
          const updateInterval = 500;
          let last = Date.now();
          const stream = await symptomTrackerAgent.stream(text, {
            threadId: `discord-${channelId}`,
            resourceId: msg.author.id,
            context: [
              { role: "system", content: `User: ${msg.author.username}` },
            ],
          });
          for await (const chunk of stream.fullStream) {
            if (chunk.type === "text-delta") {
              response += chunk.textDelta;
            } else if (chunk.type === "tool-result") {
              response += `\n**Result:**\`\`\`json\n${JSON.stringify(
                chunk.result,
                null,
                2
              )}\n\`\`\``;
            }
            if (Date.now() - last > updateInterval) {
              await sent.edit(
                response.substring(0, this.MAX_MESSAGE_LENGTH - 3) + "…"
              );
              last = Date.now();
            }
          }
          await sent.edit(response);
        } catch (e) {
          console.error(e);
          msg.reply("❌ Sorry, something went wrong.");
        }
    }
  }
}
