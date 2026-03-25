export type MissionStatus = "idle" | "busy" | "interrupted" | "error";

export type JdSourceType = "text" | "url";

export type TailoredResumeLocale = "zh-CN" | "en-US";

export type TailoredResumeSectionKey =
  | "summary"
  | "skillGroups"
  | "experience"
  | "projects"
  | "education"
  | "certifications"
  | "additional";

export type ArtifactType =
  | "jobAnalysis"
  | "resumeStrategy"
  | "tailoredResume"
  | "interviewPack";

export type ReviewTargetArtifactType =
  | "jobAnalysis"
  | "resumeStrategy"
  | "tailoredResume"
  | "interviewPack";

export type ArtifactSlot = {
  markdown: string;
  updatedAt: string;
  hash: string;
  sourceAgent?: string;
  notes?: string[];
};

export type TailoredResumeLink = {
  label: string;
  url: string;
};

export type TailoredResumeBasics = {
  fullName: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
};

export type TailoredResumeSummary = {
  title?: string;
  lines: string[];
};

export type TailoredResumeSkillGroup = {
  label: string;
  items: string[];
};

export type TailoredResumeExperienceItem = {
  id: string;
  company: string;
  title: string;
  location?: string;
  employmentType?: string;
  dateLabel: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  summary?: string;
  bullets: string[];
  techStack?: string[];
};

export type TailoredResumeProjectItem = {
  id: string;
  name: string;
  role?: string;
  dateLabel?: string;
  summary?: string;
  bullets: string[];
  techStack?: string[];
  links?: TailoredResumeLink[];
};

export type TailoredResumeEducationItem = {
  id: string;
  school: string;
  degree?: string;
  major?: string;
  dateLabel?: string;
  location?: string;
  bullets?: string[];
};

export type TailoredResumeCertificationItem = {
  id: string;
  name: string;
  issuer?: string;
  dateLabel?: string;
};

export type TailoredResumeAdditionalItem = {
  label: string;
  value: string;
};

export type TailoredResumeTemplateHints = {
  variant: "classic" | "professional" | "compact";
  density: "compact" | "balanced";
  sectionOrder: TailoredResumeSectionKey[];
  pageTarget: 1 | 2;
};

export type TailoredResume = {
  version: 1;
  locale: TailoredResumeLocale;
  targetRole: string;
  targetCompany?: string;
  basics: TailoredResumeBasics;
  summary: TailoredResumeSummary;
  skillGroups: TailoredResumeSkillGroup[];
  experience: TailoredResumeExperienceItem[];
  projects: TailoredResumeProjectItem[];
  education: TailoredResumeEducationItem[];
  certifications?: TailoredResumeCertificationItem[];
  additional?: TailoredResumeAdditionalItem[];
  templateHints: TailoredResumeTemplateHints;
  warnings: string[];
  missingFacts: string[];
};

export type CriticVerdict = {
  overall: "pass" | "revise" | "block";
  markdown: string;
  summary: string;
  strengths: string[];
  risks: string[];
  missingFacts: string[];
  nextActions: string[];
};

export const CRITIC_VERDICT_LABELS: Record<CriticVerdict["overall"], string> = {
  pass: "通过",
  revise: "需修改",
  block: "阻塞",
};

export type ApprovalCardDecisionId = "approve" | "reject";

export type BinaryConfirmationResumeSource =
  | "approval_card"
  | "questionnaire_card"
  | "json_editor";

export type ApprovalCardOption = {
  id: ApprovalCardDecisionId;
  label: string;
};

export type ApprovalCardSection = {
  title: string;
  items: string[];
};

export type ApprovalCardInterrupt = {
  version: 1;
  kind: string;
  ui: "approval_card";
  title: string;
  summary: string;
  sections: ApprovalCardSection[];
  question?: string;
  options: [ApprovalCardOption, ApprovalCardOption];
  metadata?: Record<string, unknown>;
};

export type QuestionnaireCardField = {
  id: string;
  label: string;
  helpText?: string;
  placeholder?: string;
  required: boolean;
  multiline: boolean;
};

export type QuestionnaireCardInterrupt = {
  version: 1;
  kind: string;
  ui: "questionnaire_card";
  title: string;
  summary?: string;
  fields: QuestionnaireCardField[];
  submitLabel?: string;
  metadata?: Record<string, unknown>;
};

export type BinaryConfirmationResumePayload = {
  approved: boolean;
  decisionId?: ApprovalCardDecisionId;
  source?: BinaryConfirmationResumeSource;
};

export type QuestionnaireCardResumePayload = {
  answers: Record<string, string>;
  source?: "questionnaire_card";
};

export type PendingHumanConfirmation = {
  active: boolean;
  reason?: string;
  targetArtifactType?: ArtifactType;
  question?: string;
  kind?: string;
  ui?: string;
  title?: string;
  summary?: string;
  content?: string;
  sections?: ApprovalCardSection[];
  fields?: QuestionnaireCardField[];
  submitLabel?: string;
  concerns?: string[];
  options?: Array<{
    id: string;
    label: string;
  }>;
  metadata?: Record<string, unknown>;
  candidateArtifact?: {
    artifactType: ArtifactType;
    markdown: string;
  };
  [key: string]: unknown;
};

export type MissionGraphState = {
  missionId?: string;
  missionGoal?: string;
  jdSourceType?: JdSourceType;
  jdSourceValue?: string;
  jdText?: string;
  baseResumeMarkdown?: string;
  tailoredResume?: TailoredResume;
  artifacts?: Partial<Record<ArtifactType, ArtifactSlot>>;
  reviews?: Partial<Record<ReviewTargetArtifactType, CriticVerdict>>;
  pendingHumanConfirmation?: PendingHumanConfirmation;
  messages?: unknown[];
};

export type MissionBootstrapStatus = "pending" | "completed";

export type MissionMetadata = {
  app?: string;
  version?: number;
  title?: string;
  jdInput?: string;
  jdPreview?: string;
  jdSourceType?: JdSourceType;
  resumeFileName?: string;
  resumeObjectKey?: string;
  resumeObjectUrl?: string;
  resumeStorageOwnerId?: string;
  bootstrapStatus?: MissionBootstrapStatus;
};

export type MissionThread = {
  threadId: string;
  createdAt: string;
  updatedAt: string;
  stateUpdatedAt?: string;
  status: MissionStatus;
  metadata: MissionMetadata;
  values?: MissionGraphState;
};

export const MISSION_APP_ID = "offerpilot-mission";

export const ARTIFACT_ORDER: ArtifactType[] = [
  "jobAnalysis",
  "resumeStrategy",
  "tailoredResume",
  "interviewPack",
];

export const ARTIFACT_LABELS: Record<ArtifactType, string> = {
  jobAnalysis: "岗位分析",
  resumeStrategy: "简历策略",
  tailoredResume: "定制简历",
  interviewPack: "面试准备包",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getCriticVerdictOverall(
  value: unknown,
): CriticVerdict["overall"] | undefined {
  if (value === "pass" || value === "revise" || value === "block") {
    return value;
  }

  return undefined;
}

export function getCriticVerdictLabel(review?: {
  overall?: unknown;
} | null): string | null {
  const overall = getCriticVerdictOverall(review?.overall);
  return overall ? CRITIC_VERDICT_LABELS[overall] : null;
}

function isApprovalCardDecisionId(
  value: unknown,
): value is ApprovalCardDecisionId {
  return value === "approve" || value === "reject";
}

function isApprovalCardOption(
  value: unknown,
): value is ApprovalCardOption {
  return (
    isRecord(value) &&
    isApprovalCardDecisionId(value.id) &&
    typeof value.label === "string"
  );
}

function isApprovalCardSection(value: unknown): value is ApprovalCardSection {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    Array.isArray(value.items) &&
    value.items.every((item) => typeof item === "string")
  );
}

function isQuestionnaireCardField(
  value: unknown,
): value is QuestionnaireCardField {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    (value.helpText === undefined || typeof value.helpText === "string") &&
    (value.placeholder === undefined || typeof value.placeholder === "string") &&
    typeof value.required === "boolean" &&
    typeof value.multiline === "boolean"
  );
}

export function isApprovalCardInterrupt(
  value: unknown,
): value is ApprovalCardInterrupt {
  return (
    isRecord(value) &&
    value.ui === "approval_card" &&
    typeof value.kind === "string" &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    Array.isArray(value.sections) &&
    value.sections.every(isApprovalCardSection) &&
    (value.question === undefined || typeof value.question === "string") &&
    Array.isArray(value.options) &&
    value.options.length === 2 &&
    value.options.every(isApprovalCardOption) &&
    (value.metadata === undefined || isRecord(value.metadata))
  );
}

export function isQuestionnaireCardInterrupt(
  value: unknown,
): value is QuestionnaireCardInterrupt {
  return (
    isRecord(value) &&
    value.ui === "questionnaire_card" &&
    typeof value.kind === "string" &&
    typeof value.title === "string" &&
    (value.summary === undefined || typeof value.summary === "string") &&
    Array.isArray(value.fields) &&
    value.fields.every(isQuestionnaireCardField) &&
    (value.submitLabel === undefined || typeof value.submitLabel === "string") &&
    (value.metadata === undefined || isRecord(value.metadata))
  );
}

export function inferJdSourceType(input: string): JdSourceType {
  try {
    const url = new URL(input.trim());
    if (url.protocol === "http:" || url.protocol === "https:") {
      return "url";
    }
  } catch {
    // fall through
  }

  return "text";
}

export function createMissionTitle(input: string, sourceType: JdSourceType): string {
  if (sourceType === "url") {
    try {
      const url = new URL(input.trim());
      const path = url.pathname.split("/").filter(Boolean).at(-1);
      return path
        ? `${url.hostname} · ${decodeURIComponent(path).slice(0, 42)}`
        : url.hostname;
    } catch {
      // fall through
    }
  }

  const firstLine = input
    .split(/\n+/)
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) {
    return "新任务";
  }

  return firstLine.length > 42 ? `${firstLine.slice(0, 42)}…` : firstLine;
}

export function createMissionPreview(input: string, sourceType: JdSourceType): string {
  if (sourceType === "url") {
    return input.trim();
  }

  const normalized = input.replace(/\s+/g, " ").trim();
  if (normalized.length <= 120) {
    return normalized;
  }

  return `${normalized.slice(0, 120)}…`;
}

export function extractPlainText(markdown?: string): string {
  if (!markdown) {
    return "";
  }

  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/[*_>~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createBootstrapPrompt(jdInput: string, signedResumeUrl: string): string {
  return `我的jd是${jdInput}。\n我的简历是${signedResumeUrl}.\n请你生成定制简历。`;
}

export function normalizeMissionMetadata(value: unknown): MissionMetadata {
  if (!isRecord(value)) {
    return {
      app: MISSION_APP_ID,
      version: 1,
      bootstrapStatus: "pending",
    };
  }

  return {
    app: typeof value.app === "string" ? value.app : MISSION_APP_ID,
    version: typeof value.version === "number" ? value.version : 1,
    title: typeof value.title === "string" ? value.title : undefined,
    jdInput: typeof value.jdInput === "string" ? value.jdInput : undefined,
    jdPreview: typeof value.jdPreview === "string" ? value.jdPreview : undefined,
    jdSourceType:
      value.jdSourceType === "url" || value.jdSourceType === "text"
        ? value.jdSourceType
        : undefined,
    resumeFileName:
      typeof value.resumeFileName === "string" ? value.resumeFileName : undefined,
    resumeObjectKey:
      typeof value.resumeObjectKey === "string" ? value.resumeObjectKey : undefined,
    resumeObjectUrl:
      typeof value.resumeObjectUrl === "string" ? value.resumeObjectUrl : undefined,
    resumeStorageOwnerId:
      typeof value.resumeStorageOwnerId === "string"
        ? value.resumeStorageOwnerId
        : undefined,
    bootstrapStatus:
      value.bootstrapStatus === "completed" ? "completed" : "pending",
  };
}

export function mapMissionThread(thread: {
  thread_id: string;
  created_at: string;
  updated_at: string;
  state_updated_at?: string;
  status: MissionStatus;
  metadata: unknown;
  values?: unknown;
}): MissionThread {
  const metadata = normalizeMissionMetadata(thread.metadata);

  return {
    threadId: thread.thread_id,
    createdAt: thread.created_at,
    updatedAt: thread.updated_at,
    stateUpdatedAt: thread.state_updated_at,
    status: thread.status,
    metadata,
    values: isRecord(thread.values)
      ? (thread.values as MissionGraphState)
      : undefined,
  };
}
