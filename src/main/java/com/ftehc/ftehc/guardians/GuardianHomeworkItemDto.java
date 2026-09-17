package com.ftehc.ftehc.guardians;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GuardianHomeworkItemDto {
    private String homeworkId;
    private String title;
    private String dueDate;

    private String classId;
    private String className;
    private String teacherName;

    private String status;   // NOT_SUBMITTED | SUBMITTED | LATE | GRADED
    private String submittedAt;
    private Integer grade;
}

