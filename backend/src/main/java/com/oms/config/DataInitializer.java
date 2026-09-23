package com.oms.config;

import com.oms.entity.*;
import com.oms.repository.AddressRepository;
import com.oms.repository.CategoryRepository;
import com.oms.repository.ProductRepository;
import com.oms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final AddressRepository addressRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    @Value("${app.seed.initial-admin.email:admin@oms.com}")
    private String initialAdminEmail;

    @Value("${app.seed.initial-admin.password:Admin@123}")
    private String initialAdminPassword;

    @Value("${app.seed.initial-admin.full-name:System Administrator}")
    private String initialAdminFullName;

    @Value("${app.seed.initial-admin.phone:+1 555-0100}")
    private String initialAdminPhone;

    @Override
    public void run(String... args) {
        log.info("Checking database initialization...");

        // 1. Provision initial super-admin if missing
        if (userRepository.findByEmail(initialAdminEmail.trim().toLowerCase()).isEmpty()) {
            User admin = User.builder()
                    .email(initialAdminEmail.trim().toLowerCase())
                    .password(passwordEncoder.encode(initialAdminPassword))
                    .fullName(initialAdminFullName)
                    .phone(initialAdminPhone)
                    .role(Role.ROLE_ADMIN)
                    .build();
            userRepository.save(admin);
            log.info("Provisioned initial ADMIN account: {}", initialAdminEmail);
        }

        // 2. If demo seeding is disabled, skip dummy data insertion
        if (!seedEnabled) {
            log.info("Demo data seeding is DISABLED (app.seed.enabled=false). Production clean catalog maintained.");
            return;
        }

        // 2. Seed Customer
        User customer = userRepository.findByEmail("customer@oms.com").orElse(null);
        if (customer == null) {
            customer = User.builder()
                    .email("customer@oms.com")
                    .password(passwordEncoder.encode("Customer@123"))
                    .fullName("John Doe")
                    .phone("+1 555-0199")
                    .role(Role.ROLE_CUSTOMER)
                    .build();
            customer = userRepository.save(customer);
            log.info("Created default CUSTOMER: customer@oms.com / Customer@123");

            // Seed address for customer
            Address address = Address.builder()
                    .user(customer)
                    .street("123 Market St, Suite 400")
                    .city("San Francisco")
                    .state("CA")
                    .postalCode("94105")
                    .country("USA")
                    .isDefault(true)
                    .build();
            addressRepository.save(address);
        }

        // 3. Seed Categories
        if (categoryRepository.count() == 0) {
            Category electronics = Category.builder().name("Electronics").description("Gadgets, accessories, and tech devices").active(true).build();
            Category apparel = Category.builder().name("Apparel & Fashion").description("Clothing, shoes, and lifestyle accessories").active(true).build();
            Category home = Category.builder().name("Home & Kitchen").description("Kitchenware, furniture, and home improvement").active(true).build();
            Category books = Category.builder().name("Books & Stationery").description("Novels, textbooks, and office essentials").active(true).build();
            categoryRepository.saveAll(List.of(electronics, apparel, home, books));
            log.info("Seeded initial categories.");
        }

        // 4. Seed Products
        if (productRepository.count() == 0) {
            Category electronics = categoryRepository.findByNameIgnoreCase("Electronics").orElse(null);
            Category apparel = categoryRepository.findByNameIgnoreCase("Apparel & Fashion").orElse(null);
            Category home = categoryRepository.findByNameIgnoreCase("Home & Kitchen").orElse(null);
            Category books = categoryRepository.findByNameIgnoreCase("Books & Stationery").orElse(null);

            if (electronics != null && apparel != null && home != null && books != null) {
                List<Product> products = List.of(
                    Product.builder()
                            .name("Wireless Noise-Canceling Headphones")
                            .description("Premium over-ear Bluetooth headphones with active noise cancellation and 30-hour battery life.")
                            .price(new BigDecimal("199.99"))
                            .stockQuantity(25)
                            .category(electronics)
                            .imageUrl("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80")
                            .active(true)
                            .build(),
                    Product.builder()
                            .name("Mechanical Gaming Keyboard")
                            .description("RGB backlit mechanical keyboard with hot-swappable switches and ergonomic wrist rest.")
                            .price(new BigDecimal("89.50"))
                            .stockQuantity(40)
                            .category(electronics)
                            .imageUrl("https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=500&q=80")
                            .active(true)
                            .build(),
                    Product.builder()
                            .name("4K Ultra HD Monitor 27-inch")
                            .description("IPS panel, HDR400, 144Hz refresh rate, USB-C 65W charging for seamless productivity.")
                            .price(new BigDecimal("349.00"))
                            .stockQuantity(15)
                            .category(electronics)
                            .imageUrl("https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80")
                            .active(true)
                            .build(),
                    Product.builder()
                            .name("Classic Cotton Crewneck T-Shirt")
                            .description("100% breathable organic cotton, comfortable fit, pre-shrunk fabric.")
                            .price(new BigDecimal("24.99"))
                            .stockQuantity(100)
                            .category(apparel)
                            .imageUrl("https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80")
                            .active(true)
                            .build(),
                    Product.builder()
                            .name("Waterproof Trail Hiking Jacket")
                            .description("Windproof and waterproof shell jacket designed for rugged outdoor adventures.")
                            .price(new BigDecimal("129.00"))
                            .stockQuantity(30)
                            .category(apparel)
                            .imageUrl("https://images.unsplash.com/photo-1544441893-675973e31985?w=500&q=80")
                            .active(true)
                            .build(),
                    Product.builder()
                            .name("Pour-Over Coffee Maker Set")
                            .description("Borosilicate glass carafe with permanent stainless steel mesh filter, 800ml capacity.")
                            .price(new BigDecimal("45.00"))
                            .stockQuantity(20)
                            .category(home)
                            .imageUrl("https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500&q=80")
                            .active(true)
                            .build(),
                    Product.builder()
                            .name("Ceramic Non-Stick Frying Pan (10-inch)")
                            .description("Eco-friendly ceramic coating, induction-ready bottom, cool-touch handle.")
                            .price(new BigDecimal("39.95"))
                            .stockQuantity(4) // Low stock example
                            .category(home)
                            .imageUrl("https://images.unsplash.com/photo-1584990347449-399042b93707?w=500&q=80")
                            .active(true)
                            .build(),
                    Product.builder()
                            .name("Clean Architecture & System Design")
                            .description("A comprehensive practical guide to resilient enterprise software engineering.")
                            .price(new BigDecimal("49.99"))
                            .stockQuantity(50)
                            .category(books)
                            .imageUrl("https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80")
                            .active(true)
                            .build()
                );
                productRepository.saveAll(products);
                log.info("Seeded initial products.");
            }
        }
    }
}
