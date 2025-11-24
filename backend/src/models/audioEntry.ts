export interface DocumentData {}

export interface AudioEntry extends DocumentData {
  entryId: string;
  userId: string;
  title: string;
  audioUrl: string;
  tags: string[];
  transcription: string;
  aiResponse: string;
  createdAt: Date;
}

export interface Tag extends DocumentData {
  tagId: string;
  name: string;
}