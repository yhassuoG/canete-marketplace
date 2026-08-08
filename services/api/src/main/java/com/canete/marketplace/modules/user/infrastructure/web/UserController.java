package com.canete.marketplace.modules.user.infrastructure.web;

import com.canete.marketplace.modules.user.application.UserDto;
import com.canete.marketplace.modules.user.infrastructure.persistence.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** GET /api/v1/users — lista todos los usuarios del sistema. */
    @GetMapping
    public ResponseEntity<List<UserDto>> list() {
        List<UserDto> users = userRepository.findAll().stream()
            .map(UserDto::from)
            .toList();
        return ResponseEntity.ok(users);
    }
}
