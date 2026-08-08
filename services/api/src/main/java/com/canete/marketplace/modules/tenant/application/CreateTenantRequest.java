package com.canete.marketplace.modules.tenant.application;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateTenantRequest(
    @NotBlank @Size(max = 120) String name,
    @Size(max = 80) @Pattern(regexp = "^[a-z0-9-]*$", message = "slug must contain only lowercase letters, numbers and hyphens") String slug,
    @NotBlank
    @Size(max = 40)
    @Pattern(
        regexp = "^(restaurant|hotel|experience|winery|other)$",
        message = "category must be one of: restaurant, hotel, experience, winery, other"
    )
    String category,
    @NotBlank @Size(max = 200) String location,
    @Size(max = 255) String tagline,
    String description,
    @Size(max = 30) String phone,
    @Size(max = 255) String address,
    String lat,
    String lng,
    @Size(max = 20)
    @Pattern(
        regexp = "^$|^#[0-9a-fA-F]{6}$",
        message = "primaryColor must be a hex color like #0c4a6e"
    )
    String primaryColor
) {
}
