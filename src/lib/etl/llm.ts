import OpenAI from "openai";
import { z } from "zod";
import type { LlmExtractionResult } from "@/lib/types";

export const extractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "is_official_company_page",
    "company_name_match_score",
    "industry",
    "employee_count",
    "annual_revenue",
    "notes",
  ],
  properties: {
    is_official_company_page: { type: "boolean" },
    company_name_match_score: { type: "integer", minimum: 0, maximum: 100 },
    industry: valueWithEvidenceSchema("string"),
    employee_count: {
      type: "object",
      additionalProperties: false,
      required: ["value", "type", "is_approximate", "period", "confidence", "evidence"],
      properties: {
        value: { type: ["integer", "null"], minimum: 0 },
        type: { type: "string", enum: ["consolidated", "standalone", "unknown"] },
        is_approximate: { type: "boolean" },
        period: { type: ["string", "null"] },
        confidence: { type: "integer", minimum: 0, maximum: 100 },
        evidence: { type: ["string", "null"] },
      },
    },
    annual_revenue: {
      type: "object",
      additionalProperties: false,
      required: ["value_jpy", "type", "is_approximate", "period", "confidence", "evidence"],
      properties: {
        value_jpy: { type: ["integer", "null"], minimum: 0 },
        type: { type: "string", enum: ["sales", "operating_revenue", "ordinary_revenue", "estimated", "unknown"] },
        is_approximate: { type: "boolean" },
        period: { type: ["string", "null"] },
        confidence: { type: "integer", minimum: 0, maximum: 100 },
        evidence: { type: ["string", "null"] },
      },
    },
    notes: { type: "array", items: { type: "string" } },
  },
} as const;

const extractionResultSchema: z.ZodType<LlmExtractionResult> = z.object({
  is_official_company_page: z.boolean(),
  company_name_match_score: z.number().int().min(0).max(100),
  industry: z.object({
    value: z.string().nullable(),
    confidence: z.number().int().min(0).max(100),
    evidence: z.string().nullable(),
  }),
  employee_count: z.object({
    value: z.number().int().nullable(),
    type: z.enum(["consolidated", "standalone", "unknown"]),
    is_approximate: z.boolean(),
    period: z.string().nullable(),
    confidence: z.number().int().min(0).max(100),
    evidence: z.string().nullable(),
  }),
  annual_revenue: z.object({
    value_jpy: z.number().int().nullable(),
    type: z.enum(["sales", "operating_revenue", "ordinary_revenue", "estimated", "unknown"]),
    is_approximate: z.boolean(),
    period: z.string().nullable(),
    confidence: z.number().int().min(0).max(100),
    evidence: z.string().nullable(),
  }),
  notes: z.array(z.string()),
});

let openai: OpenAI | null = null;

export function hasOpenAiConfig() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function extractCompanyProfileWithLlm(input: {
  companyName: string;
  corporateNumber?: string | null;
  pageUrl: string;
  pageTitle?: string | null;
  extractedText: string;
}) {
  if (!hasOpenAiConfig()) {
    throw new Error("OPENAI_API_KEY is not configured. LLM extraction is available after setting the key.");
  }

  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.responses.create({
    model: process.env.OPENAI_EXTRACTION_MODEL ?? "gpt-5.4-mini",
    store: false,
    input: [
      {
        role: "system",
        content:
          "You extract verifiable Japanese company profile facts. Do not invent values. Return null for information that is not explicitly present. Estimated values must be marked estimated and never mixed with official facts.",
      },
      {
        role: "user",
        content: buildExtractionPrompt(input),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "company_profile_extraction",
        strict: true,
        schema: extractionJsonSchema,
      },
    },
  });

  const parsed = JSON.parse(response.output_text);
  return extractionResultSchema.parse(parsed);
}

export function buildExtractionPrompt(input: {
  companyName: string;
  corporateNumber?: string | null;
  pageUrl: string;
  pageTitle?: string | null;
  extractedText: string;
}) {
  return [
    `company_name: ${input.companyName}`,
    `corporate_number: ${input.corporateNumber ?? "unknown"}`,
    `page_url: ${input.pageUrl}`,
    `page_title: ${input.pageTitle ?? ""}`,
    "",
    "Rules:",
    "- If the company name does not match, set is_official_company_page=false.",
    "- Never generate numbers without evidence in extracted_text.",
    "- If a value is approximate, set is_approximate=true.",
    "- If a revenue value is estimated, annual_revenue.type must be estimated and confidence must be <= 30.",
    "- Evidence must be a short exact sentence or phrase from extracted_text.",
    "",
    "extracted_text:",
    input.extractedText.slice(0, 24000),
  ].join("\n");
}

function valueWithEvidenceSchema(valueType: "string") {
  return {
    type: "object",
    additionalProperties: false,
    required: ["value", "confidence", "evidence"],
    properties: {
      value: { type: [valueType, "null"] },
      confidence: { type: "integer", minimum: 0, maximum: 100 },
      evidence: { type: ["string", "null"] },
    },
  };
}

