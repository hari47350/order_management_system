package com.oms.service;

import com.oms.config.JwtService;
import com.oms.dto.request.LoginRequest;
import com.oms.dto.request.RegisterRequest;
import com.oms.dto.response.AuthResponse;
import com.oms.entity.Role;
import com.oms.entity.User;
import com.oms.exception.BadRequestException;
import com.oms.exception.DuplicateResourceException;
import com.oms.exception.UnauthorizedException;
import com.oms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists.");
        }

        User user = User.builder()
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phone(request.getPhone())
                .role(Role.ROLE_CUSTOMER) // Default registration is customer
                .build();

        user = userRepository.save(user);
        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail().trim().toLowerCase(),
                            request.getPassword()
                    )
            );
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    public User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new UnauthorizedException("User is not authenticated.");
        }
        return (User) authentication.getPrincipal();
    }

    @Transactional
    public void changePassword(com.oms.dto.request.ChangePasswordRequest request) {
        User user = getCurrentAuthenticatedUser();
        // Reload user from database to ensure up-to-date state
        User persistentUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new UnauthorizedException("User not found."));

        if (!passwordEncoder.matches(request.getCurrentPassword(), persistentUser.getPassword())) {
            throw new BadRequestException("Current password is incorrect.");
        }
        persistentUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(persistentUser);
    }
}
