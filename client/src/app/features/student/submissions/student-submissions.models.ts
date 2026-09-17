export type StudentSubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'LATE' | 'GRADED' | 'RETURNED';

export interface StudentSubmissionFileDto {
  fileKey: string;
  fileName: string;
  contentType?: string;
  size?: number;
}

export interface StudentSubmissionDto {
  id: string;
  homeworkId: string;
  homeworkTitle?: string;
  className?: string;
  submittedAt?: string;
  status: StudentSubmissionStatus;
  text?: string;
  files?: StudentSubmissionFileDto[];
  grade?: number;
  feedback?: string;
}

