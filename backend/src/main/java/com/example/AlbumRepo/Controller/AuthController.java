package com.example.AlbumRepo.Controller;

import com.example.AlbumRepo.DTO.AuthResponse;
import com.example.AlbumRepo.Entity.User;
import com.example.AlbumRepo.Repository.IUserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.web.csrf.CsrfToken;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final IUserRepository userRepository;

    public AuthController(IUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(@AuthenticationPrincipal OidcUser oidcUser) {
        // No authenticated user.
        if (oidcUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Find their corresponding application user.
        User user = userRepository.findByGoogleId(oidcUser.getSubject())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Application user not found"
                ));

        return ResponseEntity.ok(
                new AuthResponse(
                        user.getId(),
                        user.getEmail(),
                        user.getDisplayName()
                )
        );
    }

    @GetMapping("/csrf")
    public ResponseEntity<Map<String, String>> getCsrfToken(@RequestAttribute("rawCsrfToken") CsrfToken csrfToken) {
        return ResponseEntity.ok(Map.of("token", csrfToken.getToken()));
    }
}