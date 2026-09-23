package com.oms.repository;

import com.oms.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("SELECT p FROM Product p WHERE " +
           "(:activeOnly IS NULL OR p.active = :activeOnly) AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:searchPattern IS NULL OR LOWER(p.name) LIKE :searchPattern OR LOWER(p.description) LIKE :searchPattern) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice)")
    Page<Product> searchProducts(
            @Param("searchPattern") String searchPattern,
            @Param("categoryId") Long categoryId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("activeOnly") Boolean activeOnly,
            Pageable pageable);

    List<Product> findByStockQuantityLessThanEqual(Integer threshold);

    long countByStockQuantityLessThanEqual(Integer threshold);

    long countByActiveTrue();
}
