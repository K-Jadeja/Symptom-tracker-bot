import TelegramBot from "node-telegram-bot-api";
import { symptomTrackerAgent } from "../agents";

export class TelegramIntegration {
  private bot: TelegramBot;
  private readonly MAX_MESSAGE_LENGTH = 4096; // Telegram's message length limit
  private readonly MAX_RESULT_LENGTH = 500; // Maximum length for tool results
  private reminderIntervals: Map<number, NodeJS.Timeout> = new Map(); // Map of chat IDs to reminder intervals

  constructor(token: string) {
    // Create a bot instance
    this.bot = new TelegramBot(token, { polling: true });

    // Handle incoming messages
    this.bot.on("message", this.handleMessage.bind(this));

    // Register available commands with Telegram
    this.bot
      .setMyCommands([
        {
          command: "start",
          description: "Start the symptom tracker and set up reminders",
        },
        {
          command: "reminder_on",
          description: "Turn on symptom check-in reminders",
        },
        {
          command: "reminder_off",
          description: "Turn off symptom check-in reminders",
        },
        { command: "help", description: "Show available commands" },
      ])
      .then(() => {
        console.log("Commands registered successfully");
      })
      .catch((error) => {
        console.error("Failed to register commands:", error);
      });
  }

  // Setup a daily check-in reminder for a chat ID
  private setupDailyReminder(chatId: number) {
    // Clear any existing reminder for this chat
    if (this.reminderIntervals.has(chatId)) {
      clearInterval(this.reminderIntervals.get(chatId)!);
    }

    // Set up a reminder every 24 hours (86400000 ms)
    const interval = setInterval(async () => {
      try {
        // Get current time for the message
        const currentTime = new Date();
        const formattedDate = currentTime.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        });

        // Send a more personalized check-in message
        await this.bot.sendMessage(
          chatId,
          `📋 <b>Daily Symptom Check-in</b> | ${formattedDate}\n\nHi there! It's time for your daily symptom tracking. How are you feeling today? Any changes from yesterday?`,
          { parse_mode: "HTML" }
        );
        console.log(`Sent reminder to chat ${chatId}`);
      } catch (error) {
        console.error(`Failed to send reminder to chat ${chatId}:`, error);
      }
    }, 86400000); // 24 hours

    // Store the interval ID so we can clear it later if needed
    this.reminderIntervals.set(chatId, interval);
    console.log(`Set up daily reminder for chat ${chatId}`);
  }

  private escapeHtml(text: string): string {
    // Escape HTML special characters
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  private truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + "... [truncated]";
  }

  private formatToolResult(result: any): string {
    try {
      const jsonString = JSON.stringify(result, null, 2);
      return this.escapeHtml(
        this.truncateString(jsonString, this.MAX_RESULT_LENGTH)
      );
    } catch (error) {
      return `[Complex data structure - ${typeof result}]`;
    }
  }

  private async updateOrSplitMessage(
    chatId: number,
    messageId: number | undefined,
    text: string
  ): Promise<number> {
    // If text is within limits, try to update existing message
    if (text.length <= this.MAX_MESSAGE_LENGTH && messageId) {
      try {
        await this.bot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "HTML",
        });
        return messageId;
      } catch (error) {
        console.error("Error updating message:", error);
      }
    }

    // If text is too long or update failed, send as new message
    try {
      const newMessage = await this.bot.sendMessage(chatId, text, {
        parse_mode: "HTML",
      });
      return newMessage.message_id;
    } catch (error) {
      console.error("Error sending message:", error);
      // If the message is still too long, truncate it
      const truncated =
        text.substring(0, this.MAX_MESSAGE_LENGTH - 100) +
        "\n\n... [Message truncated due to length]";
      const fallbackMsg = await this.bot.sendMessage(chatId, truncated, {
        parse_mode: "HTML",
      });
      return fallbackMsg.message_id;
    }
  }

  private async handleMessage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const username = msg.from?.username || "unknown";
    const firstName = msg.from?.first_name || "unknown";
    const userId = msg.from?.id.toString() || `anonymous-${chatId}`;

    // Extract timestamp from message or use current time
    const timestamp = new Date(msg.date ? msg.date * 1000 : Date.now());
    const formattedDate = timestamp.toISOString().split("T")[0]; // YYYY-MM-DD format
    const formattedTime = timestamp.toTimeString().split(" ")[0]; // HH:MM:SS format

    // Check for commands - log received text for debugging
    console.log(`Received message: "${text}" from chat ${chatId}`);

    if (text === "/start") {
      await this.bot.sendMessage(
        chatId,
        "👋 <b>Welcome to your Symptom Tracker Assistant!</b>\n\nI'm here to help you track your symptoms for chronic conditions and prepare detailed reports for your doctor visits.\n\n✅ I can check in with you daily to record your symptoms\n✅ Track patterns and changes over time\n✅ Generate comprehensive medical reports when needed\n\nLet's get started! How are you feeling today?\n\nUse /reminder_on to activate daily check-in reminders.",
        { parse_mode: "HTML" }
      );
      return;
    } else if (text === "/reminder_on") {
      // Handle both spellings
      this.setupDailyReminder(chatId);
      await this.bot.sendMessage(
        chatId,
        "✅ <b>Daily Check-in Reminders Activated</b>\n\nI'll send you a symptom check-in reminder once every 24 hours to help maintain consistent tracking.\n\nConsistent tracking helps identify patterns that might otherwise be missed!",
        { parse_mode: "HTML" }
      );
      return;
    } else if (text === "/reminder_off") {
      // Handle both spellings
      if (this.reminderIntervals.has(chatId)) {
        clearInterval(this.reminderIntervals.get(chatId)!);
        this.reminderIntervals.delete(chatId);
        await this.bot.sendMessage(
          chatId,
          "❌ <b>Daily Check-in Reminders Deactivated</b>\n\nI've turned off your daily symptom check-in reminders. You can turn them back on anytime with /reminder_on",
          { parse_mode: "HTML" }
        );
      } else {
        await this.bot.sendMessage(
          chatId,
          "You don't currently have any active reminders. Use /reminder_on to activate daily check-ins.",
          { parse_mode: "HTML" }
        );
      }
      return;
    } else if (text === "/help") {
      await this.bot.sendMessage(
        chatId,
        "🔍 <b>Available Commands:</b>\n\n" +
          "• <code>/start</code> - Initialize the symptom tracker\n" +
          "• <code>/reminder_on</code> - Activate daily check-in reminders\n" +
          "• <code>/reminder_off</code> - Deactivate daily reminders\n" +
          "• <code>/help</code> - Display this help message\n\n" +
          "<b>How to use:</b>\n" +
          "• Simply tell me how you're feeling each day\n" +
          "• Request a 'doctor report' when you need a summary\n" +
          "• The more consistent you are, the better patterns I can identify",
        { parse_mode: "HTML" }
      );
      return;
    }

    if (!text) {
      await this.bot.sendMessage(
        chatId,
        "Sorry, I can only process text messages."
      );
      return;
    }

    try {
      // Send initial message
      const sentMessage = await this.bot.sendMessage(chatId, "Thinking...");
      let currentResponse = "";
      let lastUpdate = Date.now();
      let currentMessageId = sentMessage.message_id;
      const UPDATE_INTERVAL = 500; // Update every 500ms to avoid rate limits

      // Stream response using the agent
      const stream = await symptomTrackerAgent.stream(text, {
        threadId: `telegram-${chatId}`, // Use chat ID as thread ID
        resourceId: userId, // Use user ID as resource ID
        context: [
          {
            role: "system",
            content: `Current user: ${firstName} (${username})
Current date: ${formattedDate}
Current time: ${formattedTime}`,
          },
        ],
      });

      // Process the full stream
      for await (const chunk of stream.fullStream) {
        let shouldUpdate = false;
        let chunkText = "";

        switch (chunk.type) {
          case "text-delta":
            chunkText = this.escapeHtml(chunk.textDelta);
            shouldUpdate = true;
            break;

          case "tool-call":
            const formattedArgs = JSON.stringify(chunk.args, null, 2);
            chunkText = `\n🛠️ <b>Using tool:</b> ${this.escapeHtml(chunk.toolName)}\n`;
            console.log(`Tool call: ${chunk.toolName}`, chunk.args);
            shouldUpdate = true;
            break;

          case "tool-result":
            const formattedResult = this.formatToolResult(chunk.result);
            chunkText = `✨ <b>Result:</b>\n<pre>${formattedResult}</pre>\n`;
            console.log("Tool result:", chunk.result);
            shouldUpdate = false; // Changed to true since we want to show results
            break;

          case "error":
            chunkText = `\n❌ <b>Error:</b> ${this.escapeHtml(String(chunk.error))}\n`;
            console.error("Error:", chunk.error);
            shouldUpdate = true;
            break;

          case "reasoning":
            chunkText = `\n💭 ${this.escapeHtml(chunk.textDelta)}\n`;
            console.log("Reasoning:", chunk.textDelta);
            shouldUpdate = true;
            break;
        }

        if (shouldUpdate) {
          currentResponse += chunkText;
          const now = Date.now();
          if (now - lastUpdate >= UPDATE_INTERVAL) {
            try {
              currentMessageId = await this.updateOrSplitMessage(
                chatId,
                currentMessageId,
                currentResponse
              );
              lastUpdate = now;
            } catch (error) {
              console.error("Error updating/splitting message:", error);
            }
          }
        }
      }

      // Final update
      await this.updateOrSplitMessage(
        chatId,
        currentMessageId,
        currentResponse
      );

      // We no longer automatically set up reminders after every message
      // Reminders are only set up when /start or /reminder_on commands are used
    } catch (error) {
      console.error("Error processing message:", error);
      await this.bot.sendMessage(
        chatId,
        "Sorry, I encountered an error processing your message. Please try again."
      );
    }
  }
}
