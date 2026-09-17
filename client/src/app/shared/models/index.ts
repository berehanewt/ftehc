export interface Homework {
  id: string;
  classId: string;
  title: string;
  description: string;
  dueDate: string;
  attachments: Attachment[];
  createdAt: string;
  createdBy: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

export interface Submission {
  id: string;
  homeworkId: string;
  studentId: string;
  status: 'NOT_STARTED' | 'SUBMITTED' | 'LATE' | 'GRADED';
  submittedAt?: string;
  files: Attachment[];
  feedback?: string;
  grade?: number;
}

export interface Announcement {
  id: string;
  scope: 'SCHOOL' | 'CLASS';
  scopeId?: string;
  title: string;
  body: string;
  createdAt: string;
  createdBy: string;
}

export interface Document {
  id: string;
  ownerType: 'SCHOOL' | 'CLASS' | 'TEACHER' | 'STUDENT';
  ownerId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Class {
  id: string;
  name: string;
  grade: string;
  teacherId: string;
  teacherName: string;
  createdAt: string;
}

export interface StudentEnrollment {
  id: string;
  classId: string;
  studentId: string;
  enrolledAt: string;
}

export interface Guardian {
  id: string;
  userId: string;
  linkedStudents: LinkedStudent[];
}

export interface LinkedStudent {
  studentId: string;
  studentName: string;
  relationship: string;
}

