export type CommentEntityType = "CONTENT";

export interface Comment {
  id: string;
  entityType: CommentEntityType;
  entityId: string;
  authorId: string;
  message: string;
  mentionUserIds: string[];
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
