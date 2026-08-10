import "server-only";

import { z } from "zod";
import type { AppUser } from "@/features/users/types";
import { findUserById } from "@/features/users/repository";
import { findContentById } from "@/features/contents/repository";
import { isAdmin } from "@/lib/permissions/roles";
import { createActivity } from "@/features/activities/repository";
import { createComment, findComment, softDeleteComment } from "./repository";

const commentSchema = z.object({ message:z.string().trim().min(1).max(5000), mentionUserIds:z.array(z.string()).max(20).default([]) });

export async function createContentCommentService(contentId:string, raw:z.input<typeof commentSchema>, user:AppUser) {
  const content=await findContentById(contentId); if(!content||content.archivedAt) throw new Error("Konten tidak ditemukan atau sudah berada di arsip.");
  const input=commentSchema.parse(raw); const mentionIds=[...new Set(input.mentionUserIds)].filter((id)=>id!==user.id);
  const mentioned=await Promise.all(mentionIds.map((id)=>findUserById(id))); if(mentioned.some((x)=>!x||x.status!=="ACTIVE")) throw new Error("Salah satu anggota yang ditandai tidak aktif atau tidak ditemukan.");
  const id=await createComment({entityType:"CONTENT",entityId:contentId,authorId:user.id,message:input.message,mentionUserIds:mentionIds});
  await createActivity({entityType:"CONTENT",entityId:contentId,actorId:user.id,action:"COMMENT_ADDED",metadata:{commentId:id}}); return id;
}

export async function deleteCommentService(id:string,user:AppUser) {
  const comment=await findComment(id); if(!comment) throw new Error("Catatan tidak ditemukan.");
  if(comment.entityType==="CONTENT"){const content=await findContentById(comment.entityId);if(!content||content.archivedAt) throw new Error("Catatan pada konten yang sudah diarsipkan tidak dapat diubah.");}
  if(!isAdmin(user)&&comment.authorId!==user.id) throw new Error("Kamu tidak dapat menghapus catatan ini.");
  await softDeleteComment(id);
}
