export interface Batch {
  _id: string;
  name: string;
  previewImage?: string;
  slug?: string;
  byName?: string;
  startDate?: string;
  endDate?: string;
  language?: string;
  feeTotal?: number;
  type?: string;
}

export interface BatchDetail {
  _id?: string;
  name: string;
  description?: string;
  shortDescription?: string;
  subjects: Subject[];
  status?: string;
  byName?: string;
  language?: string;
  startDate?: string;
  endDate?: string;
}

export interface Subject {
  _id: string;
  subject: string;
  subjectId?: string;
  slug: string;
  teacherIds?: Teacher[];
  imageId?: {
    _id?: string;
    name?: string;
    baseUrl: string;
    key: string;
  };
  tagCount?: number;
  lectureCount?: number;
  batchId?: string;
  isResources?: boolean;
}

export interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  imageId?: { baseUrl: string; key: string };
  experience?: string;
  qualification?: string;
  subject?: string;
  email?: string;
  featuredLine?: string;
}

export interface Topic {
  _id: string;
  name: string;
  slug: string;
  videos?: number;
  notes?: number;
  exercises?: number;
  lectureVideos?: number;
  displayOrder?: number;
  type?: string;
  typeId?: string;
}

export interface AttachmentItem {
  _id: string;
  baseUrl: string;
  key: string;
  name: string;
  createdAt?: string;
}

export interface HomeworkItem {
  _id: string;
  topic: string;
  note?: string;
  attachmentIds: AttachmentItem[];
  actions?: string[];
  slug?: string;
  status?: string;
  solutionVideoType?: string;
  solutionVideoUrl?: string | null;
}

export interface ContentItem {
  _id: string;
  topic: string;
  name?: string;
  url?: string;
  urlType?: string;
  status?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  lectureType?: string;
  contentType?: string;
  isVideoLecture?: boolean;
  isDPPNotes?: boolean;
  isDPPVideos?: boolean;
  hasAttachment?: boolean;
  isFree?: boolean;
  needs_fetching?: boolean;
  original_schedule_id?: string;
  video_id?: string;
  pdf_url?: string;
  videoDetails?: {
    _id?: string;
    id?: string;
    name?: string;
    image?: string;
    videoUrl?: string;
    duration?: string | number;
    status?: string;
    types?: string[];
    drmProtected?: boolean;
    findKey?: string;
  } | null;
  homeworkIds?: HomeworkItem[];
  tags?: { _id: string; name: string }[];
  scheduleCode?: string;
  batchSubjectId?: string;
}

export interface LiveClass {
  _id: string;
  topic: string;
  name?: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  status?: string;
  tag?: string;
  urlType?: string;
  url?: string;
  slug?: string;
  lectureType?: string;
  isVideoLecture?: boolean;
  hasAttachment?: boolean;
  batchId?: string;
  batchSubjectId?: string;
  subjectId?: { _id: string; name: string; slug: string } | string;
  scheduleCode?: string;
  isFree?: boolean;
  videoDetails?: {
    name?: string;
    videoUrl?: string;
    videoId?: string;
    duration?: number;
  } | null;
  publicUrl?: string;
  previewImageUrl?: string;
}

export interface VideoData {
  success: boolean;
  type?: "drm" | "hls" | "mp4" | "youtube";
  mpdUrl?: string;
  hlsUrl?: string;
  rawHlsUrl?: string;
  videoUrl?: string;
  kid?: string;
  key?: string;
  error?: string;
}
