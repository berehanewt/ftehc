export interface GuardianStudentDto {
  id: string;
  email?: string;
  name?: string;
}

export type GuardianHomeworkStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'LATE' | 'GRADED';

export interface GuardianHomeworkItemDto {
  homeworkId: string;
  title: string;
  dueDate: string;
  classId?: string;
  className?: string;
  teacherName?: string;
  status: GuardianHomeworkStatus;
  submittedAt?: string;
  grade?: number;
  unreadFeedback?: boolean;
  feedbackUpdatedAt?: string;
  feedbackReadAt?: string;
}

