import type { UIMessage } from "ai";
import { z } from "zod";

export type Severity = "high" | "medium" | "low";

export type Issue = {
  id: string;
  severity: Severity;
  title: string;
  file: string;
  startLine: number;
  endLine?: number;
  why: string;
  fix: string;
  status: "open" | "resolved";
};

export type Repo = {
  id: string;
  owner: string;
  name: string;
  language: string | null;
  stars: number;
  updatedAt: string;
};

export type PR = {
  id: string;
  number: number;
  title: string;
  author: string;
  updatedAt?: string;
  hoursAgo?: number;
  filesChanged?: number;
  additions?: number;
  deletions?: number;
  branch: string;
};

export type DiffLine = {
  type: "context" | "add" | "del";
  oldNo?: number;
  newNo?: number;
  content: string;
  severity: Severity | null;
  issueId: string | null;
};

export type FileDiff = {
  path: string;
  additions: number;
  deletions: number;
  lines: DiffLine[];
};

export type GitHubUser = { login: string; avatar_url: string };

export const messageMetadataSchema = z.object({
  createdAt: z.number().optional(),
  model: z.string().optional(),
  totalTokens: z.number().optional(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export type MyUIMessage = UIMessage<MessageMetadata>;
