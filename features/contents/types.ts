export type ContentStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "READY"
  | "SCHEDULED"
  | "PUBLISHED"
  | "CANCELLED";

export interface ContentCopy {
  brief?: string;
  script?: string;
  caption?: string;
}

export interface Content {
  id: string;
  companyId?: string;
  title?: string;
  pillarId?: string;
  goalId?: string;
  platformIds: string[];
  formatId?: string;
  copy: ContentCopy;
  status: ContentStatus;
  ownerId?: string;
  plannedPublishAt?: Date;
  scheduleHasTime: boolean;
  publishedAt?: Date;
  publishedUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
  archivedBy?: string;
}

export interface ContentFilters {
  status?: ContentStatus;
  companyId?: string;
  platformId?: string;
  pillarId?: string;
  goalId?: string;
  formatId?: string;
  ownerId?: string;
  from?: Date;
  to?: Date;
  includeArchived?: boolean;
  limit?: number;
}
