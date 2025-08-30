package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.dto.audit.AuditLogDTO;
import com.menux.menu_x_backend.entity.AuditLog;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.AuditLogRepository;
import com.menux.menu_x_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

@Service
public class AdminAuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    public Page<AuditLogDTO> findLogs(String action,
                                      String resourceType,
                                      Long actorId,
                                      LocalDateTime from,
                                      LocalDateTime to,
                                      Pageable pageable) {
        Specification<AuditLog> spec = (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();
            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (resourceType != null && !resourceType.isBlank()) {
                predicates.add(cb.equal(root.get("resourceType"), resourceType));
            }
            if (actorId != null) {
                predicates.add(cb.equal(root.get("actorId"), actorId));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        return auditLogRepository.findAll(spec, pageable)
                .map(this::toDto);
    }

    public Optional<AuditLogDTO> getById(Long id) {
        if (id == null) return Optional.empty();
        return auditLogRepository.findById(id).map(this::toDto);
    }

    private AuditLogDTO toDto(AuditLog e) {
        String actorUsername = null;
        if (e.getActorId() != null) {
            actorUsername = userRepository.findById(e.getActorId())
                    .map(User::getUsername)
                    .orElse(null);
        }

        return new AuditLogDTO(
                e.getId(),
                e.getActorId(),
                actorUsername,
                e.getAction(),
                e.getResourceType(),
                e.getResourceId(),
                e.getMetadata(),
                e.getIp(),
                e.getUserAgent(),
                e.getCreatedAt()
        );
    }

    @Transactional
    public void deleteLog(Long id) {
        auditLogRepository.deleteById(id);
    }

    @Transactional
    public void clearAllLogs() {
        auditLogRepository.deleteAll();
    }

    @Transactional
    public void clearLogsByCriteria(String action, String resourceType, Long actorId,
                                   LocalDateTime from, LocalDateTime to) {
        Specification<AuditLog> spec = (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();
            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (resourceType != null && !resourceType.isBlank()) {
                predicates.add(cb.equal(root.get("resourceType"), resourceType));
            }
            if (actorId != null) {
                predicates.add(cb.equal(root.get("actorId"), actorId));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        auditLogRepository.deleteAll(auditLogRepository.findAll(spec));
    }
}
