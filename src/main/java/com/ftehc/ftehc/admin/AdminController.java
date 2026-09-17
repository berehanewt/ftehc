package com.ftehc.ftehc.admin;

import com.ftehc.ftehc.announcements.Announcement;
import com.ftehc.ftehc.announcements.AnnouncementScope;
import com.ftehc.ftehc.announcements.AnnouncementService;
import com.ftehc.ftehc.audit.AuditService;
import com.ftehc.ftehc.classes.SchoolClass;
import com.ftehc.ftehc.classes.SchoolClassRepository;
import com.ftehc.ftehc.guardians.Guardian;
import com.ftehc.ftehc.guardians.GuardianRepository;
import com.ftehc.ftehc.students.Student;
import com.ftehc.ftehc.students.StudentRepository;
import com.ftehc.ftehc.teachers.Teacher;
import com.ftehc.ftehc.teachers.TeacherRepository;
import com.ftehc.ftehc.users.Role;
import com.ftehc.ftehc.users.User;
import com.ftehc.ftehc.users.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final GuardianRepository guardianRepository;
    private final TeacherRepository teacherRepository;
    private final SchoolClassRepository classRepository;
    private final AnnouncementService announcementService;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;

    @Data
    static class UserSummary {
        private String id;
        private String email;
        private Set<Role> roles;
        private boolean active;
        private Instant createdAt;
        private Instant lastLoginAt;
        private String firstName;
        private String lastName;
        private String grade;
        private Integer age;
        private String gender;
        private String name;
        private String subject;
        private String relationship;
        private String fullName;
        private String phone;
        private String spouseFullName;
    }

    private UserSummary toUserSummary(User user) {
        UserSummary summary = new UserSummary();
        summary.setId(user.getId());
        summary.setEmail(user.getEmail());
        summary.setRoles(user.getRoles());
        summary.setActive(user.isActive());
        summary.setCreatedAt(user.getCreatedAt());
        summary.setLastLoginAt(user.getLastLoginAt());
        populateProfileFields(summary, user);
        return summary;
    }

    private void populateProfileFields(UserSummary summary, User user) {
        if (user.getRoles().contains(Role.STUDENT)) {
            studentRepository.findByUserId(user.getId()).ifPresent(student -> {
                summary.setFirstName(student.getFirstName());
                summary.setLastName(student.getLastName());
                summary.setGrade(student.getGrade());
                summary.setAge(student.getAge());
                summary.setGender(student.getGender());
            });
        }

        if (user.getRoles().contains(Role.TEACHER)) {
            teacherRepository.findByUserId(user.getId()).ifPresent(teacher -> {
                summary.setName(teacher.getName());
                summary.setSubject(teacher.getSubject());
            });
        }

        if (user.getRoles().contains(Role.GUARDIAN)) {
            guardianRepository.findByUserId(user.getId()).ifPresent(guardian -> {
                summary.setRelationship(guardian.getRelationship());
                summary.setFullName(guardian.getFullName());
                summary.setPhone(guardian.getPhone());
                summary.setSpouseFullName(guardian.getSpouseFullName());
            });
        }
    }

    // ---- User Management ----

    @Data
    static class CreateUserRequest {
        @NotBlank @Email
        private String email;
        @NotBlank
        private String password;
        private Set<Role> roles;
        // Optional profile fields
        private String firstName;
        private String lastName;
        private String grade;
        private Integer age;
        private String gender;
        private String name;
        private String subject;
        private String relationship;
        private String fullName;
        private String phone;
        private String spouseFullName;
    }

    @Data
    static class UpdateUserRequest {
        private Set<Role> roles;
        private Boolean active;
        private String password;
        private String firstName;
        private String lastName;
        private String grade;
        private Integer age;
        private String gender;
        private String name;
        private String subject;
        private String relationship;
        private String fullName;
        private String phone;
        private String spouseFullName;
    }

    @Data
    static class UpdateUserActiveRequest {
        private boolean active;
    }

    @PostMapping("/users")
    public ResponseEntity<UserSummary> createUser(@Valid @RequestBody CreateUserRequest req,
                                                 @AuthenticationPrincipal String userId) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }
        if (req.getRoles() == null || req.getRoles().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one role is required");
        }

        User user = User.builder()
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .roles(req.getRoles())
                .active(true)
                .createdAt(Instant.now())
                .build();
        User saved = userRepository.save(user);

        // Create profile based on role
        if (req.getRoles().contains(Role.STUDENT)) {
            studentRepository.save(Student.builder()
                    .userId(saved.getId())
                    .firstName(req.getFirstName())
                    .lastName(req.getLastName())
                    .grade(req.getGrade())
                    .age(req.getAge())
                    .gender(req.getGender())
                    .build());
        }
        if (req.getRoles().contains(Role.TEACHER)) {
            teacherRepository.save(Teacher.builder()
                    .userId(saved.getId())
                    .name(req.getName())
                    .subject(req.getSubject())
                    .build());
        }
        if (req.getRoles().contains(Role.GUARDIAN)) {
            guardianRepository.save(Guardian.builder()
                    .userId(saved.getId())
                    .relationship(req.getRelationship())
                    .fullName(req.getFullName())
                    .phone(req.getPhone())
                    .spouseFullName(req.getSpouseFullName())
                    .build());
        }

        auditService.log(userId, "USER_CREATE", "User", saved.getId(), null, null, null, null,
                Map.of("email", saved.getEmail(), "roles", saved.getRoles().stream().map(Role::name).toList()));

        return ResponseEntity.ok(toUserSummary(saved));
    }

    @GetMapping("/users")
    public List<UserSummary> listUsers() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toUserSummary)
                .toList();
    }

    @PutMapping("/users/{id}")
    public UserSummary updateUser(@PathVariable String id,
                                  @Valid @RequestBody UpdateUserRequest req,
                                  @AuthenticationPrincipal String userId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Set<Role> previousRoles = Set.copyOf(user.getRoles());

        if (req.getRoles() != null && !req.getRoles().isEmpty()) {
            user.setRoles(req.getRoles());
        }
        if (req.getActive() != null) {
            user.setActive(req.getActive());
        }
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        }

        User savedUser = userRepository.save(user);
        syncRoleProfiles(savedUser, req, previousRoles);

        auditService.log(userId, "USER_UPDATE", "User", savedUser.getId(), null, null, null, null,
                Map.of(
                        "email", savedUser.getEmail(),
                        "roles", savedUser.getRoles().stream().map(Role::name).toList(),
                        "active", savedUser.isActive()
                ));

        return toUserSummary(savedUser);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id,
                                           @AuthenticationPrincipal String userId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        auditService.log(userId, "USER_DELETE", "User", user.getId(), null, null, null, null,
                Map.of(
                        "email", user.getEmail(),
                        "roles", user.getRoles().stream().map(Role::name).toList(),
                        "active", user.isActive()
                ));

        deleteRoleProfiles(user);
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void syncRoleProfiles(User user, UpdateUserRequest req, Set<Role> previousRoles) {
        boolean studentRoleAdded = user.getRoles().contains(Role.STUDENT) && !previousRoles.contains(Role.STUDENT);
        boolean teacherRoleAdded = user.getRoles().contains(Role.TEACHER) && !previousRoles.contains(Role.TEACHER);
        boolean guardianRoleAdded = user.getRoles().contains(Role.GUARDIAN) && !previousRoles.contains(Role.GUARDIAN);

        if (previousRoles.contains(Role.STUDENT) && !user.getRoles().contains(Role.STUDENT)) {
            studentRepository.findByUserId(user.getId()).ifPresent(studentRepository::delete);
        }
        if (previousRoles.contains(Role.TEACHER) && !user.getRoles().contains(Role.TEACHER)) {
            teacherRepository.findByUserId(user.getId()).ifPresent(teacherRepository::delete);
        }
        if (previousRoles.contains(Role.GUARDIAN) && !user.getRoles().contains(Role.GUARDIAN)) {
            guardianRepository.findByUserId(user.getId()).ifPresent(guardianRepository::delete);
        }

        if (user.getRoles().contains(Role.STUDENT)) {
            Student student = studentRepository.findByUserId(user.getId())
                    .orElseGet(() -> Student.builder().userId(user.getId()).build());

            if (studentRoleAdded || req.getFirstName() != null) {
                student.setFirstName(req.getFirstName());
            }
            if (studentRoleAdded || req.getLastName() != null) {
                student.setLastName(req.getLastName());
            }
            if (studentRoleAdded || req.getGrade() != null) {
                student.setGrade(req.getGrade());
            }
            if (studentRoleAdded || req.getAge() != null) {
                student.setAge(req.getAge());
            }
            if (studentRoleAdded || req.getGender() != null) {
                student.setGender(req.getGender());
            }

            studentRepository.save(student);
        }

        if (user.getRoles().contains(Role.TEACHER)) {
            Teacher teacher = teacherRepository.findByUserId(user.getId())
                    .orElseGet(() -> Teacher.builder().userId(user.getId()).build());

            if (teacherRoleAdded || req.getName() != null) {
                teacher.setName(req.getName());
            }
            if (teacherRoleAdded || req.getSubject() != null) {
                teacher.setSubject(req.getSubject());
            }

            teacherRepository.save(teacher);
        }

        if (user.getRoles().contains(Role.GUARDIAN)) {
            Guardian guardian = guardianRepository.findByUserId(user.getId())
                    .orElseGet(() -> Guardian.builder().userId(user.getId()).build());

            if (guardianRoleAdded || req.getRelationship() != null) {
                guardian.setRelationship(req.getRelationship());
            }
            if (guardianRoleAdded || req.getFullName() != null) {
                guardian.setFullName(req.getFullName());
            }
            if (guardianRoleAdded || req.getPhone() != null) {
                guardian.setPhone(req.getPhone());
            }
            if (guardianRoleAdded || req.getSpouseFullName() != null) {
                guardian.setSpouseFullName(req.getSpouseFullName());
            }

            guardianRepository.save(guardian);
        }
    }

    private void deleteRoleProfiles(User user) {
        if (user.getRoles().contains(Role.STUDENT)) {
            studentRepository.findByUserId(user.getId()).ifPresent(studentRepository::delete);
        }

        if (user.getRoles().contains(Role.TEACHER)) {
            teacherRepository.findByUserId(user.getId()).ifPresent(teacherRepository::delete);
        }

        if (user.getRoles().contains(Role.GUARDIAN)) {
            guardianRepository.findByUserId(user.getId()).ifPresent(guardianRepository::delete);
        }
    }

    @PatchMapping("/users/{id}/active")
    public UserSummary setUserActive(@PathVariable String id,
                                     @Valid @RequestBody UpdateUserActiveRequest req,
                                     @AuthenticationPrincipal String userId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setActive(req.isActive());
        User saved = userRepository.save(user);
        auditService.log(userId, "USER_STATUS_UPDATE", "User", saved.getId(), null, null, null, null,
                Map.of("email", saved.getEmail(), "active", saved.isActive()));
        return toUserSummary(saved);
    }

    // ---- Classes ----

    @Data
    static class CreateClassRequest {
        @NotBlank
        private String name;
        private String grade;
        private String teacherId;
    }

    @Data
    static class UpdateClassRequest {
        @NotBlank
        private String name;
        private String grade;
        private String teacherId;
    }

    @PostMapping("/classes")
    public ResponseEntity<ClassSummary> createClass(@Valid @RequestBody CreateClassRequest req) {
        SchoolClass sc = SchoolClass.builder()
                .name(req.getName())
                .grade(req.getGrade())
                .teacherId(req.getTeacherId())
                .build();
        return ResponseEntity.ok(toClassSummary(classRepository.save(sc)));
    }

    @GetMapping("/classes")
    public List<ClassSummary> listClasses() {
        return classRepository.findAll().stream()
                .sorted(Comparator.comparing(SchoolClass::getName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(this::toClassSummary)
                .toList();
    }

    @PutMapping("/classes/{id}")
    public ClassSummary updateClass(@PathVariable String id, @Valid @RequestBody UpdateClassRequest req) {
        SchoolClass sc = classRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));

        sc.setName(req.getName());
        sc.setGrade(req.getGrade());
        sc.setTeacherId(req.getTeacherId());

        return toClassSummary(classRepository.save(sc));
    }

    @DeleteMapping("/classes/{id}")
    public ResponseEntity<Void> deleteClass(@PathVariable String id) {
        SchoolClass sc = classRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));

        // Remove class link from enrolled students before deleting class.
        sc.getStudentIds().forEach(studentId ->
                studentRepository.findById(studentId).ifPresent(student -> {
                    student.getClassIds().remove(id);
                    studentRepository.save(student);
                }));

        classRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ---- Students ----

    @Data
    static class StudentSummary {
        private String id;
        private String firstName;
        private String lastName;
        private String grade;
    }

    @Data
    static class ClassSummary {
        private String id;
        private String name;
        private String grade;
        private String teacherId;
        private List<String> studentIds;
    }

    @Data
    static class GuardianLinkSummary {
        private String id;
        private String relationship;
        private List<String> studentIds;
    }

    private ClassSummary toClassSummary(SchoolClass schoolClass) {
        ClassSummary summary = new ClassSummary();
        summary.setId(schoolClass.getId());
        summary.setName(schoolClass.getName());
        summary.setGrade(schoolClass.getGrade());
        summary.setTeacherId(schoolClass.getTeacherId());
        summary.setStudentIds(schoolClass.getStudentIds());
        return summary;
    }

    private GuardianLinkSummary toGuardianLinkSummary(Guardian guardian) {
        GuardianLinkSummary summary = new GuardianLinkSummary();
        summary.setId(guardian.getId());
        summary.setRelationship(guardian.getRelationship());
        summary.setStudentIds(guardian.getStudentIds());
        return summary;
    }

    @GetMapping("/students")
    public List<StudentSummary> listStudents() {
        return studentRepository.findAll().stream()
                .sorted(Comparator.comparing(Student::getLastName, Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparing(Student::getFirstName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(student -> {
                    StudentSummary summary = new StudentSummary();
                    summary.setId(student.getId());
                    summary.setFirstName(student.getFirstName());
                    summary.setLastName(student.getLastName());
                    summary.setGrade(student.getGrade());
                    return summary;
                })
                .toList();
    }

    // ---- Enrollments ----

    @Data
    static class EnrollmentRequest {
        @NotBlank
        private String classId;
        private List<String> studentIds;
    }

    @Data
    static class RemoveEnrollmentRequest {
        @NotBlank
        private String classId;
        @NotBlank
        private String studentId;
    }

    @GetMapping("/enrollments")
    public List<ClassSummary> listEnrollments() {
        return classRepository.findAll().stream()
                .sorted(Comparator.comparing(SchoolClass::getName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(this::toClassSummary)
                .toList();
    }

    @PostMapping("/enrollments")
    public ResponseEntity<ClassSummary> enroll(@Valid @RequestBody EnrollmentRequest req) {
        SchoolClass sc = classRepository.findById(req.getClassId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));

        List<String> studentIds = req.getStudentIds() == null ? List.of() : req.getStudentIds();
        studentIds.forEach(studentId -> {
            if (!sc.getStudentIds().contains(studentId)) {
                sc.getStudentIds().add(studentId);
            }
        });
        SchoolClass saved = classRepository.save(sc);

        // Update each student's classIds list to keep both sides consistent.
        studentIds.forEach(studentId ->
                studentRepository.findById(studentId).ifPresent(student -> {
                    if (!student.getClassIds().contains(req.getClassId())) {
                        student.getClassIds().add(req.getClassId());
                        studentRepository.save(student);
                    }
                }));

        return ResponseEntity.ok(toClassSummary(saved));
    }

    @PostMapping("/enrollments/remove")
    public ResponseEntity<ClassSummary> removeEnrollment(@Valid @RequestBody RemoveEnrollmentRequest req) {
        SchoolClass sc = classRepository.findById(req.getClassId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));

        sc.getStudentIds().remove(req.getStudentId());
        SchoolClass saved = classRepository.save(sc);

        studentRepository.findById(req.getStudentId()).ifPresent(student -> {
            student.getClassIds().remove(req.getClassId());
            studentRepository.save(student);
        });

        return ResponseEntity.ok(toClassSummary(saved));
    }

    // ---- Guardian-Student Link ----

    @Data
    static class GuardianSummary {
        private String id;
        private String relationship;
        private int studentCount;
    }

    @Data
    static class LinkGuardianRequest {
        @NotBlank
        private String guardianId;
        @NotBlank
        private String studentId;
    }

    @GetMapping("/guardians")
    public List<GuardianSummary> listGuardians() {
        return guardianRepository.findAll().stream()
                .sorted(Comparator.comparing(Guardian::getId, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(guardian -> {
                    GuardianSummary summary = new GuardianSummary();
                    summary.setId(guardian.getId());
                    summary.setRelationship(guardian.getRelationship());
                    summary.setStudentCount(guardian.getStudentIds() == null ? 0 : guardian.getStudentIds().size());
                    return summary;
                })
                .toList();
    }

    @GetMapping("/guardian-links")
    public List<GuardianLinkSummary> listGuardianLinks() {
        return guardianRepository.findAll().stream()
                .sorted(Comparator.comparing(Guardian::getId, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(this::toGuardianLinkSummary)
                .toList();
    }

    @PostMapping("/guardian-links")
    public ResponseEntity<GuardianLinkSummary> linkGuardian(@Valid @RequestBody LinkGuardianRequest req) {
        Guardian guardian = guardianRepository.findById(req.getGuardianId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Guardian not found"));
        Student student = studentRepository.findById(req.getStudentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

        if (!guardian.getStudentIds().contains(req.getStudentId())) {
            guardian.getStudentIds().add(req.getStudentId());
            guardianRepository.save(guardian);
        }
        if (!student.getGuardianIds().contains(req.getGuardianId())) {
            student.getGuardianIds().add(req.getGuardianId());
            studentRepository.save(student);
        }

        Guardian updated = guardianRepository.findById(req.getGuardianId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Guardian not found"));
        return ResponseEntity.ok(toGuardianLinkSummary(updated));
    }

    @PostMapping("/guardian-links/remove")
    public ResponseEntity<GuardianLinkSummary> unlinkGuardian(@Valid @RequestBody LinkGuardianRequest req) {
        Guardian guardian = guardianRepository.findById(req.getGuardianId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Guardian not found"));
        Student student = studentRepository.findById(req.getStudentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

        guardian.getStudentIds().remove(req.getStudentId());
        guardianRepository.save(guardian);

        student.getGuardianIds().remove(req.getGuardianId());
        studentRepository.save(student);

        Guardian updated = guardianRepository.findById(req.getGuardianId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Guardian not found"));
        return ResponseEntity.ok(toGuardianLinkSummary(updated));
    }

    // Backward-compatible alias used by earlier frontend iterations.
    @PostMapping("/link-guardian")
    public ResponseEntity<GuardianLinkSummary> linkGuardianLegacy(@Valid @RequestBody LinkGuardianRequest req) {
        return linkGuardian(req);
    }

    // ---- Admissions Enrollment ----

    @Data
    static class AdmissionsEnrollRequest {
        // Guardian info
        @NotBlank
        private String guardianFirstName;
        private String guardianMiddleName;
        @NotBlank
        private String guardianLastName;
        @NotBlank
        private String guardianPhone;
        @NotBlank @Email
        private String guardianEmail;
        @NotBlank
        private String guardianPassword;
        private String guardianSpouseFirstName;
        private String guardianSpouseMiddleName;
        private String guardianSpouseLastName;
        private String guardianRelationship;

        // Student info
        @NotBlank
        private String studentFirstName;
        private String studentMiddleName;
        @NotBlank
        private String studentLastName;
        @NotBlank
        private String studentPassword;
        @NotBlank
        private String studentGender;
        private Integer studentAge;
        private String studentGrade;
    }

    @Data
    static class AdmissionsEnrollResponse {
        private UserSummary guardian;
        private UserSummary student;
    }

    @PostMapping("/admissions/enroll")
    public ResponseEntity<AdmissionsEnrollResponse> admissionsEnroll(
            @Valid @RequestBody AdmissionsEnrollRequest req,
            @AuthenticationPrincipal String adminUserId) {

        // Helper lambda to build full name from components
        java.util.function.Function<Object[], String> buildFullName = (obj) -> {
            String first = (String) obj[0];
            String middle = (String) obj[1];
            String last = (String) obj[2];
            return (first != null ? first : "") + (middle != null && !middle.isBlank() ? " " + middle : "") + (last != null ? " " + last : "");
        };

        String guardianFullName = buildFullName.apply(new Object[]{req.getGuardianFirstName(), req.getGuardianMiddleName(), req.getGuardianLastName()});
        String spouseFullName = buildFullName.apply(new Object[]{req.getGuardianSpouseFirstName(), req.getGuardianSpouseMiddleName(), req.getGuardianSpouseLastName()});

        User guardianUser;
        Guardian guardian;
        boolean guardianCreated;
        boolean guardianRoleAdded;

        var existingUserOpt = userRepository.findByEmail(req.getGuardianEmail());
        if (existingUserOpt.isPresent()) {
            guardianUser = existingUserOpt.get();
            Set<Role> roles = guardianUser.getRoles() == null
                    ? new HashSet<>()
                    : new HashSet<>(guardianUser.getRoles());

            if (roles.contains(Role.STUDENT)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Email already belongs to a student account and cannot be reused as guardian");
            }

            guardianRoleAdded = roles.add(Role.GUARDIAN);
            if (guardianRoleAdded) {
                guardianUser.setRoles(roles);
                guardianUser = userRepository.save(guardianUser);
            }

            final String existingGuardianUserId = guardianUser.getId();

            guardian = guardianRepository.findByUserId(existingGuardianUserId)
                    .orElseGet(() -> guardianRepository.save(Guardian.builder()
                            .userId(existingGuardianUserId)
                            .firstName(req.getGuardianFirstName())
                            .middleName(req.getGuardianMiddleName())
                            .lastName(req.getGuardianLastName())
                            .fullName(guardianFullName.trim())
                            .phone(req.getGuardianPhone())
                            .spouseFirstName(req.getGuardianSpouseFirstName())
                            .spouseMiddleName(req.getGuardianSpouseMiddleName())
                            .spouseLastName(req.getGuardianSpouseLastName())
                            .spouseFullName(!spouseFullName.trim().isEmpty() ? spouseFullName.trim() : null)
                            .relationship(req.getGuardianRelationship())
                            .build()));
            guardianCreated = false;
        } else {
            guardianRoleAdded = true;
            // Create guardian user when email is new.
            guardianUser = User.builder()
                    .email(req.getGuardianEmail())
                    .passwordHash(passwordEncoder.encode(req.getGuardianPassword()))
                    .roles(Set.of(Role.GUARDIAN))
                    .active(true)
                    .createdAt(Instant.now())
                    .build();
            guardianUser = userRepository.save(guardianUser);

            guardian = Guardian.builder()
                    .userId(guardianUser.getId())
                    .firstName(req.getGuardianFirstName())
                    .middleName(req.getGuardianMiddleName())
                    .lastName(req.getGuardianLastName())
                    .fullName(guardianFullName.trim())
                    .phone(req.getGuardianPhone())
                    .spouseFirstName(req.getGuardianSpouseFirstName())
                    .spouseMiddleName(req.getGuardianSpouseMiddleName())
                    .spouseLastName(req.getGuardianSpouseLastName())
                    .spouseFullName(!spouseFullName.trim().isEmpty() ? spouseFullName.trim() : null)
                    .relationship(req.getGuardianRelationship())
                    .build();
            guardian = guardianRepository.save(guardian);
            guardianCreated = true;
        }

        // Create student user (use guardian email prefix + student name as email)
        String studentEmail = req.getStudentFirstName().toLowerCase().replaceAll("\\s+", ".")
                + "." + req.getStudentLastName().toLowerCase().replaceAll("\\s+", ".")
                + "@student.ftehc.local";
        // Ensure uniqueness
        if (userRepository.existsByEmail(studentEmail)) {
            studentEmail = req.getStudentFirstName().toLowerCase().replaceAll("\\s+", ".")
                    + "." + req.getStudentLastName().toLowerCase().replaceAll("\\s+", ".")
                    + "." + System.currentTimeMillis() + "@student.ftehc.local";
        }

        User studentUser = User.builder()
                .email(studentEmail)
                .passwordHash(passwordEncoder.encode(req.getStudentPassword()))
                .roles(Set.of(Role.STUDENT))
                .active(true)
                .createdAt(Instant.now())
                .build();
        studentUser = userRepository.save(studentUser);

         Student student = Student.builder()
                 .userId(studentUser.getId())
                 .firstName(req.getStudentFirstName())
                 .middleName(req.getStudentMiddleName())
                 .lastName(req.getStudentLastName())
                 .age(req.getStudentAge())
                 .gender(req.getStudentGender())
                 .grade(req.getStudentGrade())
                 .build();
         student.getGuardianIds().add(guardian.getId());
         student = studentRepository.save(student);

         // Link guardian to student
         guardian.getStudentIds().add(student.getId());
         guardianRepository.save(guardian);

        String studentFullName = buildFullName.apply(new Object[]{req.getStudentFirstName(), req.getStudentMiddleName(), req.getStudentLastName()});
        auditService.log(adminUserId, "USER_CREATE", "User", guardianUser.getId(), null, null, null, null,
                Map.of(
                        "type", guardianCreated
                                ? "ADMISSIONS_ENROLL_NEW_GUARDIAN"
                                : (guardianRoleAdded ? "ADMISSIONS_ENROLL_EXISTING_USER_ROLE_UPGRADED" : "ADMISSIONS_ENROLL_EXISTING_GUARDIAN"),
                        "guardianEmail", guardianUser.getEmail(),
                        "studentName", studentFullName.trim()));

        AdmissionsEnrollResponse response = new AdmissionsEnrollResponse();
        response.setGuardian(toUserSummary(guardianUser));
        response.setStudent(toUserSummary(studentUser));

        return ResponseEntity.ok(response);
    }

    // ---- Announcements ----

    @Data
    static class AnnouncementRequest {
        @NotBlank
        private String title;
        @NotBlank
        private String body;
    }

    @PostMapping("/announcements")
    public ResponseEntity<Announcement> postAnnouncement(
            @Valid @RequestBody AnnouncementRequest req,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(announcementService.create(
                AnnouncementScope.SCHOOL, null, req.getTitle(), req.getBody(), userId));
    }
}
