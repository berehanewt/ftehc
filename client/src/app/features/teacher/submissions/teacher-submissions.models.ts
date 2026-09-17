export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'LATE' | 'GRADED' | 'RETURNED';

export interface SubmissionFileDto {
  fileKey: string;
  fileName: string;
  contentType?: string;
  size?: number;
}

export interface TeacherSubmissionDto {
  id: string;
  homeworkId: string;
  studentId: string;
  studentEmail?: string;
  submittedAt?: string;
  status: SubmissionStatus;
  text?: string;
  files?: SubmissionFileDto[];
  grade?: number;
  feedback?: string;
}

export interface UpdateTeacherSubmissionRequest {
  status?: SubmissionStatus;
  grade?: number;
  feedback?: string;
}

