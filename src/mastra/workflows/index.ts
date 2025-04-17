import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";

const llm = openai("gpt-4o");
