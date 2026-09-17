export interface TeacherClassDto {
  id: string;
  name: string;
  grade?: string;
}

export interface TeacherHomeworkDto {
  id: string;
  classId: string;
  title: string;
  description?: string;
  dueDate: string;
  createdAt?: string;
}

export interface CreateTeacherHomeworkRequest {
  classId: string;
  title: string;
  description?: string;
  dueDate: string;
}

