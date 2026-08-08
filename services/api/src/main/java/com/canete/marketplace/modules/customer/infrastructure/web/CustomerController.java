package com.canete.marketplace.modules.customer.infrastructure.web;

import com.canete.marketplace.modules.customer.application.CustomerDto;
import com.canete.marketplace.modules.customer.application.CustomerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customers")
@CrossOrigin(origins = "*")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    /** GET /api/v1/customers?tenantSlug=muelle-pacifico (optional: omit to list all) */
    @GetMapping
    public ResponseEntity<List<CustomerDto>> list(@RequestParam(required = false) String tenantSlug) {
        if (tenantSlug == null || tenantSlug.isBlank()) {
            return ResponseEntity.ok(customerService.listAll());
        }
        return ResponseEntity.ok(customerService.listByTenantSlug(tenantSlug));
    }
}
