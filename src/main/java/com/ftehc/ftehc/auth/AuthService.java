package com.ftehc.ftehc.auth;

import com.ftehc.ftehc.audit.AuditService;
import com.ftehc.ftehc.auth.dto.*;
import com.ftehc.ftehc.email.EmailService;
import com.ftehc.ftehc.users.User;
import com.ftehc.ftehc.users.UserRepository;
import com.ftehc.ftehc.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditService auditService;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Value("${app.password-reset.expiration-ms}")
    private long passwordResetExpirationMs;

    public LoginResponse login(LoginRequest request, String ip, String userAgent) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!user.isActive()) {
            throw new RuntimeException("Account is disabled");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            auditService.log(user.getId(), "LOGIN_FAILURE", "User", user.getId(), null, null, ip, userAgent, null);
            throw new RuntimeException("Invalid credentials");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        String accessToken = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRoles());
        String refreshToken = createRefreshToken(user.getId());

        auditService.log(user.getId(), "LOGIN_SUCCESS", "User", user.getId(), null, null, ip, userAgent, null);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .roles(user.getRoles().stream().map(Enum::name).collect(Collectors.toSet()))
                .build();
    }

    public LoginResponse refresh(RefreshRequest request) {
        RefreshToken rt = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (rt.isRevoked() || rt.getExpiresAt().isBefore(Instant.now())) {
            throw new RuntimeException("Refresh token expired or revoked");
        }

        User user = userRepository.findById(rt.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Rotate refresh token
        rt.setRevoked(true);
        refreshTokenRepository.save(rt);
        String newRefreshToken = createRefreshToken(user.getId());

        String accessToken = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRoles());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newRefreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .roles(user.getRoles().stream().map(Enum::name).collect(Collectors.toSet()))
                .build();
    }

    @Transactional
    public void logout(String userId, String ip, String userAgent) {
        refreshTokenRepository.deleteByUserId(userId);
        auditService.log(userId, "LOGOUT", "User", userId, null, null, ip, userAgent, null);
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            PasswordResetToken prt = PasswordResetToken.builder()
                    .userId(user.getId())
                    .token(token)
                    .expiresAt(Instant.now().plusMillis(passwordResetExpirationMs))
                    .used(false)
                    .build();
            passwordResetTokenRepository.save(prt);
            emailService.sendPasswordReset(user.getEmail(), token);
        });
    }

    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken prt = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));

        if (prt.isUsed() || prt.getExpiresAt().isBefore(Instant.now())) {
            throw new RuntimeException("Token already used or expired");
        }

        User user = userRepository.findById(prt.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        prt.setUsed(true);
        passwordResetTokenRepository.save(prt);
    }

    private String createRefreshToken(String userId) {
        String token = UUID.randomUUID().toString();
        RefreshToken rt = RefreshToken.builder()
                .userId(userId)
                .token(token)
                .expiresAt(Instant.now().plusMillis(refreshExpirationMs))
                .revoked(false)
                .build();
        refreshTokenRepository.save(rt);
        return token;
    }
}

