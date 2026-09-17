package com.ftehc.ftehc.admissions;

import com.ftehc.ftehc.audit.AuditService;
import com.ftehc.ftehc.guardians.Guardian;
import com.ftehc.ftehc.guardians.GuardianRepository;
import com.ftehc.ftehc.students.Student;
import com.ftehc.ftehc.students.StudentRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.HashMap;

@RestController
@RequestMapping("/api/public/admissions")
@RequiredArgsConstructor
public class PublicAdmissionsController {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final GuardianRepository guardianRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Data
    static class AdmissionsEnrollRequest {
        @NotBlank
        private String guardianFirstName;
        private String guardianMiddleName;
        @NotBlank
        private String guardianLastName;
        @NotBlank
        private String guardianPhone;
        @NotBlank
        @Email
        private String guardianEmail;
        @NotBlank
        private String guardianPassword;
        private String guardianSpouseFirstName;
        private String guardianSpouseMiddleName;
        private String guardianSpouseLastName;
        private String guardianRelationship;

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
    static class EnrollUserSummary {
        private String id;
        private String email;
        private String fullName;
        private String phone;
        private String spouseFullName;
        private String firstName;
        private String lastName;
        private Integer age;
        private String gender;
    }

    @Data
    static class AdmissionsEnrollResponse {
        private EnrollUserSummary guardian;
        private EnrollUserSummary student;
    }

    @Data
    static class GuardianEmailCheckResponse {
        private String email;
        private String status;
        private List<String> roles;
        private String message;
    }

    @GetMapping("/guardian-email-check")
    public ResponseEntity<GuardianEmailCheckResponse> checkGuardianEmail(@RequestParam String email) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        if (normalizedEmail.isBlank() || !normalizedEmail.contains("@")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid email is required");
        }

        GuardianEmailCheckResponse response = new GuardianEmailCheckResponse();
        response.setEmail(normalizedEmail);

        var userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            response.setStatus("NEW_EMAIL");
            response.setRoles(List.of());
            response.setMessage("Email is available for new guardian enrollment.");
            return ResponseEntity.ok(response);
        }

        User user = userOpt.get();
        Set<Role> roles = user.getRoles() == null ? Set.of() : user.getRoles();
        response.setRoles(roles.stream().map(Enum::name).sorted().toList());

        if (roles.contains(Role.GUARDIAN)) {
            response.setStatus("EXISTING_GUARDIAN");
            response.setMessage("Email already belongs to a guardian account. You can add another student to the same guardian.");
            return ResponseEntity.ok(response);
        }

        if (roles.contains(Role.STUDENT)) {
            response.setStatus("EXISTING_STUDENT");
            response.setMessage("Email belongs to a student account and cannot be used as guardian.");
            return ResponseEntity.ok(response);
        }

        response.setStatus("EXISTING_NON_GUARDIAN");
        response.setMessage("Email belongs to an existing non-guardian account. Public enrollment requires a new guardian email.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/enroll")
    public ResponseEntity<AdmissionsEnrollResponse> admissionsEnroll(@Valid @RequestBody AdmissionsEnrollRequest req) {
        Function<Object[], String> buildFullName = (obj) -> {
            String first = (String) obj[0];
            String middle = (String) obj[1];
            String last = (String) obj[2];
            return (first != null ? first : "")
                    + (middle != null && !middle.isBlank() ? " " + middle : "")
                    + (last != null ? " " + last : "");
        };

        String guardianFullName = buildFullName.apply(new Object[]{req.getGuardianFirstName(), req.getGuardianMiddleName(), req.getGuardianLastName()});
        String spouseFullName = buildFullName.apply(new Object[]{req.getGuardianSpouseFirstName(), req.getGuardianSpouseMiddleName(), req.getGuardianSpouseLastName()});

        User guardianUser;
        Guardian guardian;
        boolean guardianCreated;

        var existingUserOpt = userRepository.findByEmail(req.getGuardianEmail());
        if (existingUserOpt.isPresent()) {
            guardianUser = existingUserOpt.get();
            if (guardianUser.getRoles() == null || !guardianUser.getRoles().contains(Role.GUARDIAN)) {
                throw new EmailConflictException("Email already belongs to a non-guardian account. Use a new guardian email on the public admissions page, or ask an admin to enroll from Admin Admissions.");
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

        String studentEmail = req.getStudentFirstName().toLowerCase().replaceAll("\\s+", ".")
                + "." + req.getStudentLastName().toLowerCase().replaceAll("\\s+", ".")
                + "@student.ftehc.local";
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

        guardian.getStudentIds().add(student.getId());
        guardian = guardianRepository.save(guardian);

        String studentFullName = buildFullName.apply(new Object[]{req.getStudentFirstName(), req.getStudentMiddleName(), req.getStudentLastName()});
        auditService.log("PUBLIC", "USER_CREATE", "User", guardianUser.getId(), null, null, null, null,
                Map.of(
                        "type", guardianCreated ? "PUBLIC_ADMISSIONS_NEW_GUARDIAN" : "PUBLIC_ADMISSIONS_EXISTING_GUARDIAN",
                        "guardianEmail", guardianUser.getEmail(),
                        "studentName", studentFullName.trim()));

        AdmissionsEnrollResponse response = new AdmissionsEnrollResponse();

        EnrollUserSummary guardianSummary = new EnrollUserSummary();
        guardianSummary.setId(guardianUser.getId());
        guardianSummary.setEmail(guardianUser.getEmail());
        guardianSummary.setFullName(guardian.getFullName());
        guardianSummary.setPhone(guardian.getPhone());
        guardianSummary.setSpouseFullName(guardian.getSpouseFullName());

        EnrollUserSummary studentSummary = new EnrollUserSummary();
        studentSummary.setId(studentUser.getId());
        studentSummary.setEmail(studentUser.getEmail());
        studentSummary.setFirstName(student.getFirstName());
        studentSummary.setLastName(student.getLastName());
        studentSummary.setAge(student.getAge());
        studentSummary.setGender(student.getGender());

        response.setGuardian(guardianSummary);
        response.setStudent(studentSummary);

        return ResponseEntity.ok(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new java.util.HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            fieldErrors.put(error.getField(), error.getDefaultMessage())
        );
        return Map.of(
            "status", "BAD_REQUEST",
            "message", "Validation failed",
            "errors", fieldErrors
        );
    }

    @ExceptionHandler(EmailConflictException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object> handleEmailConflict(EmailConflictException ex) {
        return Map.of(
            "status", "CONFLICT",
            "message", ex.getMessage()
        );
    }

    static class EmailConflictException extends RuntimeException {
        EmailConflictException(String message) {
            super(message);
        }
    }
}

