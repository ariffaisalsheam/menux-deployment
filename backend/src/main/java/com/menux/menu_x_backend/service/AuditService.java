package com.menux.menu_x_backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.menux.menu_x_backend.entity.AuditLog;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ObjectMapper objectMapper;

    public void log(String action, String resourceType, String resourceId, Object metadataObj) {
        AuditLog log = new AuditLog();
        Long actorId = getCurrentUserId();
        log.setActorId(actorId);
        log.setAction(action);
        log.setResourceType(resourceType);
        log.setResourceId(resourceId);
        if (metadataObj != null) {
            try {
                log.setMetadata(objectMapper.writeValueAsString(metadataObj));
            } catch (JsonProcessingException e) {
                // Fallback: toString
                log.setMetadata(String.valueOf(metadataObj));
            }
        }
        HttpServletRequest req = getCurrentHttpRequest();
        if (req != null) {
            log.setIp(getClientIp(req));
            log.setUserAgent(req.getHeader("User-Agent"));
        }
        auditLogRepository.save(log);
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User u) {
            return u.getId();
        }
        return null;
    }

    private HttpServletRequest getCurrentHttpRequest() {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) {
            return sra.getRequest();
        }
        return null;
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isBlank()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
