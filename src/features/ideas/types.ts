export type ContentIdeaStatus = "NEW" | "USED" | "ARCHIVED";
export type ContentIdeaSource = "PUBLIC" | "INTERNAL";

export interface ContentIdea {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  senderName?: string;
  source: ContentIdeaSource;
  status: ContentIdeaStatus;
  createdBy?: string;
  createdAt: Date;
  usedBy?: string;
  usedAt?: Date;
  convertedContentId?: string;
  archivedBy?: string;
  archivedAt?: Date;
}
