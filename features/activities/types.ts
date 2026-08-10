export type ActivityEntityType = "CONTENT";

export interface Activity {
  id: string;
  entityType: ActivityEntityType;
  entityId: string;
  actorId: string;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
