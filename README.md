# Symptom Tracker Telegram Bot

A Telegram bot that helps users track symptoms for chronic conditions, built with Mastra.ai.

## Features

- Daily symptom check-ins
- Detailed symptom tracking with severity, duration, and triggers
- Medical report generation for doctor visits
- Pattern identification across symptoms
- Customizable daily reminders

## Setup

### Prerequisites

- Node.js (v16 or higher)
- Telegram bot token (from [@BotFather](https://t.me/botfather))

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.development` file in the project root with your Telegram bot token:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   ```

### Running the Bot

Start the bot with:

```
npm run dev
```

## Usage

1. Start a chat with your bot on Telegram
2. Use `/start` to initiate the symptom tracker
3. Use `/reminder_on` to activate daily check-in reminders
4. Tell the bot about your symptoms in natural language
5. Ask for a "doctor report" when you need a summary for a medical appointment
6. Use `/reminder_off` to stop daily reminders
7. Use `/help` to see all available commands

## Commands

- `/start` - Initialize the symptom tracker
- `/reminder_on` - Activate daily symptom check-in reminders
- `/reminder_off` - Deactivate daily reminders
- `/help` - Display help information
