export type AssetSource = "CLOUDINARY" | "EXTERNAL";
export type AssetType = "REFERENCE" | "WORKING_FILE" | "FINAL_OUTPUT";
export type AssetResourceType = "IMAGE" | "VIDEO" | "RAW";

export interface ContentAsset {
  id: string;
  contentId: string;
  type: AssetType;
  source: AssetSource;
  label: string;
  url: string;
  publicId?: string;
  resourceType?: AssetResourceType;
  fileName?: string;
  format?: string;
  bytes?: number;
  uploadedBy: string;
  createdAt: Date;
}
