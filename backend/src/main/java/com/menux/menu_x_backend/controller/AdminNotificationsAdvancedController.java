package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.entity.DeliveryAttempt;
import com.menux.menu_x_backend.entity.NotificationCampaign;
import com.menux.menu_x_backend.entity.NotificationSegment;
import com.menux.menu_x_backend.entity.NotificationTemplate;
import com.menux.menu_x_backend.repository.DeliveryAttemptRepository;
import com.menux.menu_x_backend.repository.NotificationCampaignRepository;
import com.menux.menu_x_backend.repository.NotificationSegmentRepository;
import com.menux.menu_x_backend.repository.NotificationTemplateRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/notifications")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminNotificationsAdvancedController {

    private final DeliveryAttemptRepository deliveryAttemptRepository;
    private final NotificationTemplateRepository templateRepository;
    private final NotificationSegmentRepository segmentRepository;
    private final NotificationCampaignRepository campaignRepository;

    public AdminNotificationsAdvancedController(
            DeliveryAttemptRepository deliveryAttemptRepository,
            NotificationTemplateRepository templateRepository,
            NotificationSegmentRepository segmentRepository,
            NotificationCampaignRepository campaignRepository
    ) {
        this.deliveryAttemptRepository = deliveryAttemptRepository;
        this.templateRepository = templateRepository;
        this.segmentRepository = segmentRepository;
        this.campaignRepository = campaignRepository;
    }

    // ===== Templates =====
    @GetMapping("/templates")
    public ResponseEntity<?> listTemplates() {
        return ResponseEntity.ok(templateRepository.findAll());
    }

    @PostMapping("/templates")
    public ResponseEntity<?> createTemplate(@RequestBody Map<String, Object> payload) {
        try {
            NotificationTemplate t = new NotificationTemplate();
            Object name = payload.get("name");
            Object body = payload.get("body");
            Object channel = payload.get("channel");
            if (name == null || name.toString().isBlank() || body == null || channel == null) {
                return badRequest("name, body, channel are required");
            }
            t.setName(name.toString().trim());
            t.setBody(body.toString());
            t.setChannel(parseChannel(channel.toString()));
            if (payload.containsKey("title")) t.setTitle(asStringOrNull(payload.get("title")));
            if (payload.containsKey("variables")) t.setVariables(asStringList(payload.get("variables")));
            if (payload.containsKey("enabled")) t.setEnabled(Boolean.TRUE.equals(payload.get("enabled")) || Boolean.parseBoolean(String.valueOf(payload.get("enabled"))));
            return ResponseEntity.status(HttpStatus.CREATED).body(templateRepository.save(t));
        } catch (IllegalArgumentException ex) {
            return badRequest(ex.getMessage());
        }
    }

    @PutMapping("/templates/{id}")
    public ResponseEntity<?> updateTemplate(@PathVariable("id") Long id, @RequestBody Map<String, Object> payload) {
        return templateRepository.findById(id).<ResponseEntity<?>>map(t -> {
            if (payload.containsKey("name")) t.setName(asStringOrNull(payload.get("name")));
            if (payload.containsKey("body")) t.setBody(asStringOrNull(payload.get("body")));
            if (payload.containsKey("title")) t.setTitle(asStringOrNull(payload.get("title")));
            if (payload.containsKey("channel")) t.setChannel(parseChannel(String.valueOf(payload.get("channel"))));
            if (payload.containsKey("variables")) t.setVariables(asStringList(payload.get("variables")));
            if (payload.containsKey("enabled")) t.setEnabled(Boolean.TRUE.equals(payload.get("enabled")) || Boolean.parseBoolean(String.valueOf(payload.get("enabled"))));
            return ResponseEntity.ok(templateRepository.save(t));
        }).orElseGet(() -> notFound("Template not found"));
    }

    @DeleteMapping("/templates/{id}")
    public ResponseEntity<?> deleteTemplate(@PathVariable("id") Long id) {
        if (templateRepository.existsById(id)) {
            templateRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("success", true));
        }
        return notFound("Template not found");
    }

    // ===== Segments =====
    @GetMapping("/segments")
    public ResponseEntity<?> listSegments() {
        return ResponseEntity.ok(segmentRepository.findAll());
    }

    @PostMapping("/segments")
    public ResponseEntity<?> createSegment(@RequestBody Map<String, Object> payload) {
        Object name = payload.get("name");
        if (name == null || name.toString().isBlank()) return badRequest("name is required");
        NotificationSegment s = new NotificationSegment();
        s.setName(name.toString().trim());
        if (payload.containsKey("description")) s.setDescription(asStringOrNull(payload.get("description")));
        // MVP: store empty filters
        s.setFilters(Map.of());
        if (payload.containsKey("estimatedCount")) {
            try { s.setEstimatedCount(Integer.parseInt(String.valueOf(payload.get("estimatedCount")))); } catch (Exception ignore) {}
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(segmentRepository.save(s));
    }

    @PutMapping("/segments/{id}")
    public ResponseEntity<?> updateSegment(@PathVariable("id") Long id, @RequestBody Map<String, Object> payload) {
        return segmentRepository.findById(id).<ResponseEntity<?>>map(s -> {
            if (payload.containsKey("name")) s.setName(asStringOrNull(payload.get("name")));
            if (payload.containsKey("description")) s.setDescription(asStringOrNull(payload.get("description")));
            if (payload.containsKey("filters")) s.setFilters(Map.of()); // MVP
            if (payload.containsKey("estimatedCount")) {
                try { s.setEstimatedCount(Integer.parseInt(String.valueOf(payload.get("estimatedCount")))); } catch (Exception ignore) {}
            }
            return ResponseEntity.ok(segmentRepository.save(s));
        }).orElseGet(() -> notFound("Segment not found"));
    }

    @DeleteMapping("/segments/{id}")
    public ResponseEntity<?> deleteSegment(@PathVariable("id") Long id) {
        if (segmentRepository.existsById(id)) {
            segmentRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("success", true));
        }
        return notFound("Segment not found");
    }

    @PostMapping("/segments/preview")
    public ResponseEntity<?> previewSegment(@RequestBody(required = false) Map<String, Object> payload) {
        // MVP: return 0 until filters targeting is implemented
        return ResponseEntity.ok(Map.of("estimatedCount", 0));
    }

    // ===== Campaigns =====
    @GetMapping("/campaigns")
    public ResponseEntity<?> listCampaigns() {
        return ResponseEntity.ok(campaignRepository.findAll());
    }

    @PostMapping("/campaigns")
    public ResponseEntity<?> createCampaign(@RequestBody Map<String, Object> payload) {
        Object name = payload.get("name");
        Object templateId = payload.get("templateId");
        Object segmentId = payload.get("segmentId");
        if (name == null || name.toString().isBlank() || templateId == null || segmentId == null) {
            return badRequest("name, templateId, segmentId are required");
        }
        NotificationCampaign c = new NotificationCampaign();
        c.setName(name.toString().trim());
        Long tId = parseLong(templateId);
        Long sId = parseLong(segmentId);
        var template = templateRepository.findById(tId).orElse(null);
        var segment = segmentRepository.findById(sId).orElse(null);
        if (template == null || segment == null) return notFound("Template or Segment not found");
        c.setTemplate(template);
        c.setSegment(segment);
        if (payload.containsKey("scheduleAt") && payload.get("scheduleAt") != null) {
            c.setScheduleAt(parseDateTimeOrNow(String.valueOf(payload.get("scheduleAt"))));
        }
        // status defaults to DRAFT
        return ResponseEntity.status(HttpStatus.CREATED).body(campaignRepository.save(c));
    }

    @PutMapping("/campaigns/{id}")
    public ResponseEntity<?> updateCampaign(@PathVariable("id") Long id, @RequestBody Map<String, Object> payload) {
        return campaignRepository.findById(id).<ResponseEntity<?>>map(c -> {
            if (payload.containsKey("name")) c.setName(asStringOrNull(payload.get("name")));
            if (payload.containsKey("templateId") && payload.get("templateId") != null) {
                Long tId = parseLong(payload.get("templateId"));
                var t = templateRepository.findById(tId).orElse(null);
                if (t == null) return notFound("Template not found");
                c.setTemplate(t);
            }
            if (payload.containsKey("segmentId") && payload.get("segmentId") != null) {
                Long sId = parseLong(payload.get("segmentId"));
                var s = segmentRepository.findById(sId).orElse(null);
                if (s == null) return notFound("Segment not found");
                c.setSegment(s);
            }
            if (payload.containsKey("scheduleAt")) {
                Object v = payload.get("scheduleAt");
                c.setScheduleAt(v == null ? null : parseDateTimeOrNow(String.valueOf(v)));
            }
            return ResponseEntity.ok(campaignRepository.save(c));
        }).orElseGet(() -> notFound("Campaign not found"));
    }

    @PostMapping("/campaigns/{id}/schedule")
    public ResponseEntity<?> scheduleCampaign(@PathVariable("id") Long id, @RequestBody Map<String, Object> payload) {
        return campaignRepository.findById(id).<ResponseEntity<?>>map(c -> {
            Object scheduleAt = payload.get("scheduleAt");
            if (scheduleAt == null) return badRequest("scheduleAt is required");
            c.setScheduleAt(parseDateTimeOrNow(String.valueOf(scheduleAt)));
            c.setStatus(NotificationCampaign.Status.SCHEDULED);
            return ResponseEntity.ok(campaignRepository.save(c));
        }).orElseGet(() -> notFound("Campaign not found"));
    }

    @PostMapping("/campaigns/{id}/pause")
    public ResponseEntity<?> pauseCampaign(@PathVariable("id") Long id) {
        return campaignRepository.findById(id).<ResponseEntity<?>>map(c -> {
            c.setStatus(NotificationCampaign.Status.PAUSED);
            return ResponseEntity.ok(campaignRepository.save(c));
        }).orElseGet(() -> notFound("Campaign not found"));
    }

    @PostMapping("/campaigns/{id}/resume")
    public ResponseEntity<?> resumeCampaign(@PathVariable("id") Long id) {
        return campaignRepository.findById(id).<ResponseEntity<?>>map(c -> {
            c.setStatus(NotificationCampaign.Status.RUNNING);
            return ResponseEntity.ok(campaignRepository.save(c));
        }).orElseGet(() -> notFound("Campaign not found"));
    }

    // ===== Analytics =====
    @GetMapping("/analytics/summary")
    public ResponseEntity<?> analyticsSummary(
            @RequestParam(value = "from", required = false) String from,
            @RequestParam(value = "to", required = false) String to
    ) {
        // Determine time window (default: last 7 days)
        LocalDateTime[] range = parseRangeOrDefault(from, to, 7);
        LocalDateTime start = range[0];
        LocalDateTime end = range[1];

        long sent = deliveryAttemptRepository.countByStatusAndAttemptAtGreaterThanEqualAndAttemptAtLessThan(
                DeliveryAttempt.Status.SENT, start, end);
        long failed = deliveryAttemptRepository.countByStatusAndAttemptAtGreaterThanEqualAndAttemptAtLessThan(
                DeliveryAttempt.Status.FAILED, start, end);
        // For now, treat delivered == sent (no separate delivery receipt tracking yet)
        long delivered = sent;

        Map<String, Object> result = new HashMap<>();
        result.put("sent", sent);
        result.put("delivered", delivered);
        result.put("failed", failed);
        // Opened/Clicked not tracked yet; return 0 to satisfy frontend contract
        result.put("opened", 0);
        result.put("clicked", 0);
        result.put("unsubscribed", 0);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/analytics/series")
    public ResponseEntity<?> analyticsSeries(
            @RequestParam("metric") String metric,
            @RequestParam(value = "from", required = false) String from,
            @RequestParam(value = "to", required = false) String to,
            @RequestParam(value = "interval", required = false) String interval
    ) {
        String m = metric == null ? "sent" : metric.toLowerCase();
        String iv = (interval == null || interval.isBlank()) ? "day" : interval.toLowerCase();
        // Determine bucketing implicitly below
        LocalDateTime[] range = parseRangeOrDefault(from, to, iv.equals("hour") ? 1 : 7);
        LocalDateTime startAt = range[0];
        LocalDateTime endAt = range[1];

        List<Map<String, Object>> dataSeries = new ArrayList<>();
        LocalDateTime cursor = startAt;
        while (cursor.isBefore(endAt)) {
            LocalDateTime bucketEnd;
            if (iv.equals("hour")) {
                bucketEnd = cursor.plus(1, ChronoUnit.HOURS);
            } else if (iv.equals("week")) {
                bucketEnd = cursor.plusDays(7);
            } else {
                bucketEnd = cursor.plusDays(1);
            }
            if (bucketEnd.isAfter(endAt)) bucketEnd = endAt;

            long value;
            if (m.equals("sent") || m.equals("delivered")) {
                value = deliveryAttemptRepository.countByStatusAndAttemptAtGreaterThanEqualAndAttemptAtLessThan(
                        DeliveryAttempt.Status.SENT, cursor, bucketEnd);
            } else if (m.equals("failed")) {
                value = deliveryAttemptRepository.countByStatusAndAttemptAtGreaterThanEqualAndAttemptAtLessThan(
                        DeliveryAttempt.Status.FAILED, cursor, bucketEnd);
            } else if (m.equals("opened") || m.equals("clicked")) {
                value = 0; // not tracked yet
            } else {
                value = 0;
            }

            dataSeries.add(Map.of(
                    "ts", cursor.toString(),
                    "value", value
            ));
            cursor = bucketEnd;
        }
        return ResponseEntity.ok(dataSeries);
    }

    // ===== Helpers =====
    private static ResponseEntity<Map<String, Object>> badRequest(String message) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "success", false,
                "status", 400,
                "message", message
        ));
    }

    private static ResponseEntity<Map<String, Object>> notFound(String message) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "success", false,
                "status", 404,
                "message", message
        ));
    }

    private static Long parseLong(Object v) {
        if (v == null) return null;
        return Long.parseLong(String.valueOf(v));
    }

    private static String asStringOrNull(Object v) {
        if (v == null) return null;
        String s = String.valueOf(v);
        return s.equalsIgnoreCase("null") ? null : s;
    }

    private static List<String> asStringList(Object v) {
        List<String> list = new ArrayList<>();
        if (v instanceof List<?> raw) {
            for (Object o : raw) list.add(String.valueOf(o));
        }
        return list;
    }

    private static NotificationTemplate.Channel parseChannel(String s) {
        if (s == null) throw new IllegalArgumentException("channel is required");
        String v = s.trim().toLowerCase().replace('-', '_');
        return switch (v) {
            case "push" -> NotificationTemplate.Channel.PUSH;
            case "email" -> NotificationTemplate.Channel.EMAIL;
            case "in_app", "inapp" -> NotificationTemplate.Channel.IN_APP;
            default -> throw new IllegalArgumentException("Unsupported channel: " + s);
        };
    }

    private static LocalDateTime[] parseRangeOrDefault(String from, String to, int defaultDays) {
        LocalDateTime end = parseDateTimeOrNow(to);
        LocalDateTime start;
        if (from == null || from.isBlank()) {
            start = end.minusDays(defaultDays);
        } else {
            start = parseDateTimeOrNow(from);
        }
        return new LocalDateTime[]{ start, end };
    }

    private static LocalDateTime parseDateTimeOrNow(String s) {
        if (s == null || s.isBlank()) return LocalDateTime.now();
        try {
            return LocalDateTime.parse(s);
        } catch (Exception ignore) {
        }
        try {
            return LocalDate.parse(s, DateTimeFormatter.ISO_DATE).atStartOfDay();
        } catch (Exception ignore) {
        }
        try {
            return LocalDateTime.parse(s, DateTimeFormatter.ISO_DATE_TIME);
        } catch (Exception ignore) {
        }
        return LocalDateTime.now();
    }
}
