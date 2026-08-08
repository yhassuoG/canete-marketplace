package com.canete.marketplace.modules.user.infrastructure.web;

import com.canete.marketplace.modules.user.application.AuthService;
import com.canete.marketplace.modules.user.application.LoginResponse;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
    ) {}

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Validated LoginRequest request) {
        return authService.login(request.email(), request.password())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(401).build());
    }
}
