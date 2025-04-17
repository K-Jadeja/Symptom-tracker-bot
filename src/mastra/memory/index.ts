import { Memory } from "@mastra/memory";

export const symptomTrackerMemory = new Memory({
  options: {
    // Keep the last 10 messages in immediate context
    lastMessages: 10,

    // Enable semantic recall with custom settings
    semanticRecall: {
      topK: 5, // Retrieve 5 most relevant messages
      messageRange: 2, // Include 2 messages before and after each match
    },

    // Enable working memory with a custom template
    workingMemory: {
      enabled: true,
      use: "tool-call", // Use the tool-call method for updating working memory
      template: `
# Patient Health Profile

## Personal Information
- Name: 
- Age:
- Gender:
- Diagnosed Conditions:
- Primary Physician:
- Next Appointment:

## Current Medication
- Medication:
- Dosage:
- Frequency:
- Start Date:
- Observed Effects:
- Side Effects:

## Symptom Tracking (Last 30 Days)
<!-- Organize by date, most recent first. Format: [YYYY-MM-DD] -->

[DATE]:
- Symptom:
- Severity (1-10):
- Duration:
- Triggers/Factors:
- Notes:

[DATE]:
- Symptom:
- Severity (1-10):
- Duration:
- Triggers/Factors:
- Notes:

## Patterns & Observations
- Recurring Symptoms:
- Time Patterns:
- Environmental Triggers:
- Food/Diet Reactions:
- Stress Correlation:
- Sleep Impact:

## Treatment History
- Past Medications:
- Effectiveness:
- Other Treatments Tried:
- Results:

## Patient Preferences
- Communication Style:
- Areas of Concern:
- Treatment Preferences:
- Goals:
`,
    },
  },
});
