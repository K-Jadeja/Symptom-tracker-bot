import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Tool to generate a medical report for doctor visits
export const generateMedicalReportTool = createTool({
  id: "generate-medical-report",
  description:
    "Generate a comprehensive medical report summarizing the user's symptoms, patterns, and suggestions for their doctor visit.",
  inputSchema: z.object({
    timeframe: z
      .string()
      .describe(
        "The timeframe to include in the report (e.g., 'last week', 'last month', 'all')"
      ),
    condition: z
      .string()
      .optional()
      .describe("Optional specific condition to focus on in the report"),
  }),
  outputSchema: z.object({
    report: z.string(),
    treatmentSuggestions: z.string(),
    preventativeStrategies: z.string(),
  }),
  execute: async ({ context }) => {
    console.log("Generating medical report for timeframe:", context.timeframe);

    const report = `
# Medical Symptom Report

## Symptom Summary
Based on the tracked symptoms over ${context.timeframe}, the following patterns have been observed:

- Primary symptoms include those recorded in the working memory
- Symptom severity has ranged from mild to severe
- Duration and frequency of symptoms have been consistent with chronic condition patterns
- Key triggers have been identified when possible

## Observed Patterns
The working memory shows connections between symptoms and potential triggers such as:
- Stress levels and symptom intensity correlation
- Environmental factors that may exacerbate symptoms
- Sleep quality impact on symptom presentation
- Medication effectiveness and consistency

## Changes Over Time
The tracked symptoms show evolution over ${context.timeframe} including:
- Periods of improvement and regression
- Response to lifestyle modifications
- Medication effectiveness
${context.condition ? `- Specific changes related to ${context.condition}` : ""}
    `;

    const treatmentSuggestions = `
# Discussion Points for Your Doctor

Consider discussing these potential approaches with your healthcare provider:

1. **Medication Adjustments**: Based on tracked effectiveness and side effects
2. **Testing Options**: To rule out or confirm specific underlying causes
3. **Specialist Referrals**: For targeted treatment of complex symptoms
4. **Alternative Therapies**: Evidence-based complementary approaches
5. **Monitoring Strategy**: More precise tracking of specific symptoms or triggers
    `;

    const preventativeStrategies = `
# Preventative Strategies to Consider

These lifestyle modifications may help manage symptoms:

1. **Sleep Hygiene**: Consistent sleep schedule and optimized sleep environment
2. **Stress Management**: Techniques like mindfulness, deep breathing, or guided relaxation
3. **Dietary Considerations**: Anti-inflammatory foods and potential trigger avoidance
4. **Physical Activity**: Appropriate and gentle movement based on condition
5. **Environmental Modifications**: Reducing exposure to identified triggers
    `;

    return {
      report,
      treatmentSuggestions,
      preventativeStrategies,
    };
  },
});
