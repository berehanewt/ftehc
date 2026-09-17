package com.ftehc.ftehc.admin;

import com.ftehc.ftehc.announcements.AnnouncementService;
import com.ftehc.ftehc.audit.AuditService;
import com.ftehc.ftehc.classes.SchoolClassRepository;
import com.ftehc.ftehc.guardians.Guardian;
import com.ftehc.ftehc.guardians.GuardianRepository;
import com.ftehc.ftehc.students.Student;
import com.ftehc.ftehc.students.StudentRepository;
import com.ftehc.ftehc.teachers.TeacherRepository;
import com.ftehc.ftehc.users.Role;
import com.ftehc.ftehc.users.User;
import com.ftehc.ftehc.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminAdmissionsRoleUpgradeTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private GuardianRepository guardianRepository;
    @Mock
    private TeacherRepository teacherRepository;
    @Mock
    private SchoolClassRepository classRepository;
    @Mock
    private AnnouncementService announcementService;
    @Mock
    private AuditService auditService;
    @Mock
    private PasswordEncoder passwordEncoder;

    private AdminController controller;

    @BeforeEach
    void setUp() {
        controller = new AdminController(
                userRepository,
                studentRepository,
                guardianRepository,
                teacherRepository,
                classRepository,
                announcementService,
                auditService,
                passwordEncoder
        );
    }

    @Test
    void upgradesExistingAdminToGuardianAndKeepsLinkingMultipleKids() {
        when(passwordEncoder.encode(anyString())).thenAnswer(invocation -> "enc-" + invocation.getArgument(0));

        String guardianEmail = "admin.roleup@test.local";

        User existingAdmin = User.builder()
                .id("admin-user-1")
                .email(guardianEmail)
                .passwordHash("enc-old")
                .roles(new HashSet<>(Set.of(Role.ADMIN)))
                .active(true)
                .createdAt(Instant.now())
                .build();

        AtomicInteger userCounter = new AtomicInteger(1);
        AtomicInteger studentCounter = new AtomicInteger(1);
        AtomicReference<Guardian> guardianRef = new AtomicReference<>();
        Map<String, Student> studentsByUserId = new HashMap<>();

        when(userRepository.findByEmail(guardianEmail)).thenReturn(Optional.of(existingAdmin));
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            if (user.getId() == null || user.getId().isBlank()) {
                user.setId("user-" + userCounter.getAndIncrement());
            }
            return user;
        });

        when(guardianRepository.findByUserId("admin-user-1")).thenAnswer(invocation -> Optional.ofNullable(guardianRef.get()));
        when(guardianRepository.save(any(Guardian.class))).thenAnswer(invocation -> {
            Guardian guardian = invocation.getArgument(0);
            if (guardian.getId() == null || guardian.getId().isBlank()) {
                guardian.setId("guardian-1");
            }
            guardianRef.set(guardian);
            return guardian;
        });

        when(studentRepository.save(any(Student.class))).thenAnswer(invocation -> {
            Student student = invocation.getArgument(0);
            if (student.getId() == null || student.getId().isBlank()) {
                student.setId("student-" + studentCounter.getAndIncrement());
            }
            studentsByUserId.put(student.getUserId(), student);
            return student;
        });

        when(studentRepository.findByUserId(anyString())).thenAnswer(invocation -> {
            String userId = invocation.getArgument(0);
            return Optional.ofNullable(studentsByUserId.get(userId));
        });

        AdminController.AdmissionsEnrollRequest firstReq = buildRequest(
                guardianEmail,
                "KidOne",
                "Role"
        );
        AdminController.AdmissionsEnrollRequest secondReq = buildRequest(
                guardianEmail,
                "KidTwo",
                "Role"
        );

        AdminController.AdmissionsEnrollResponse first = controller.admissionsEnroll(firstReq, "admin-user-1").getBody();
        AdminController.AdmissionsEnrollResponse second = controller.admissionsEnroll(secondReq, "admin-user-1").getBody();

        assertTrue(first != null && first.getGuardian() != null);
        assertTrue(second != null && second.getGuardian() != null);

        Set<Role> firstRoles = first.getGuardian().getRoles();
        Set<Role> secondRoles = second.getGuardian().getRoles();
        assertTrue(firstRoles.contains(Role.ADMIN));
        assertTrue(firstRoles.contains(Role.GUARDIAN));
        assertTrue(secondRoles.contains(Role.ADMIN));
        assertTrue(secondRoles.contains(Role.GUARDIAN));

        Guardian linkedGuardian = guardianRef.get();
        assertNotNull(linkedGuardian);
        assertEquals(2, linkedGuardian.getStudentIds().size());

        verify(userRepository, atLeastOnce()).save(any(User.class));
    }

    @Test
    void blocksStudentEmailFromBeingReusedAsGuardianInAdminAdmissions() {
        String studentEmail = "student-only@test.local";
        User existingStudent = User.builder()
                .id("student-user-1")
                .email(studentEmail)
                .passwordHash("enc-student")
                .roles(Set.of(Role.STUDENT))
                .active(true)
                .createdAt(Instant.now())
                .build();

        when(userRepository.findByEmail(studentEmail)).thenReturn(Optional.of(existingStudent));

        AdminController.AdmissionsEnrollRequest req = buildRequest(studentEmail, "Kid", "Blocked");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.admissionsEnroll(req, "admin-user-1"));

        assertEquals(409, ex.getStatusCode().value());
        assertTrue(ex.getReason() != null && ex.getReason().contains("student account"));

        verify(guardianRepository, never()).save(any(Guardian.class));
    }

    private AdminController.AdmissionsEnrollRequest buildRequest(String guardianEmail, String studentFirstName, String studentLastName) {
        AdminController.AdmissionsEnrollRequest req = new AdminController.AdmissionsEnrollRequest();
        req.setGuardianFirstName("Admin");
        req.setGuardianLastName("Guardian");
        req.setGuardianPhone("555-2000");
        req.setGuardianEmail(guardianEmail);
        req.setGuardianPassword("@AdminGuard123");

        req.setStudentFirstName(studentFirstName);
        req.setStudentLastName(studentLastName);
        req.setStudentPassword("@Student123");
        req.setStudentGender("MALE");
        req.setStudentAge(10);
        req.setStudentGrade("5");
        return req;
    }
}

