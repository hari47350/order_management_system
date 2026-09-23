package com.oms;

import com.oms.dto.request.ProductRequest;
import com.oms.dto.response.ProductResponse;
import com.oms.entity.Category;
import com.oms.entity.Product;
import com.oms.repository.CategoryRepository;
import com.oms.repository.ProductRepository;
import com.oms.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private ProductService productService;

    private Category category;
    private Product product;

    @BeforeEach
    void setUp() {
        category = Category.builder().id(1L).name("Electronics").active(true).build();
        product = Product.builder()
                .id(10L)
                .name("Smartphone")
                .description("Flagship 5G phone")
                .price(new BigDecimal("699.99"))
                .stockQuantity(15)
                .category(category)
                .active(true)
                .build();
    }

    @Test
    void testCreateProduct() {
        ProductRequest request = new ProductRequest();
        request.setName("Smartphone");
        request.setDescription("Flagship 5G phone");
        request.setPrice(new BigDecimal("699.99"));
        request.setStockQuantity(15);
        request.setCategoryId(1L);

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenReturn(product);

        ProductResponse response = productService.createProduct(request);

        assertNotNull(response);
        assertEquals("Smartphone", response.getName());
        assertEquals(new BigDecimal("699.99"), response.getPrice());
        assertEquals(15, response.getStockQuantity());
    }

    @Test
    void testGetProductById() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));

        ProductResponse response = productService.getProductById(10L);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("Smartphone", response.getName());
    }
}
