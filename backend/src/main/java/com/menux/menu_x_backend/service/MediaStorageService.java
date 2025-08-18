package com.menux.menu_x_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.menux.menu_x_backend.dto.media.UploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import jakarta.annotation.PostConstruct;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class MediaStorageService {

    private final RestTemplate restTemplate;

    @Value("${app.media.supabase.url:}")
    private String supabaseUrl;

    @Value("${app.media.supabase.service-key:}")
    private String supabaseServiceKey;

    @Value("${app.media.supabase.bucket:menu-images}")
    private String bucket;

    @Value("${app.media.supabase.prefix:restaurants}")
    private String prefix;

    private static final long MAX_IMAGE_BYTES = 1 * 1024 * 1024; // 1MB

    public MediaStorageService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @PostConstruct
    private void sanitizeConfig() {
        // Remove any accidental whitespace/newlines from env-injected values that can break HTTP headers
        if (supabaseServiceKey != null) {
            supabaseServiceKey = supabaseServiceKey.trim();
            // If someone pasted with a 'Bearer ' prefix, drop it (setBearerAuth will add it)
            String lower = supabaseServiceKey.toLowerCase();
            if (lower.startsWith("bearer ")) {
                supabaseServiceKey = supabaseServiceKey.substring(7);
            }
            // Remove control characters/newlines/tabs that break header values
            supabaseServiceKey = supabaseServiceKey.replaceAll("[\\r\\n\\t]", "");
            // Strip surrounding quotes if the value was pasted with quotes
            if ((supabaseServiceKey.startsWith("\"") && supabaseServiceKey.endsWith("\""))
                    || (supabaseServiceKey.startsWith("'") && supabaseServiceKey.endsWith("'"))) {
                supabaseServiceKey = supabaseServiceKey.substring(1, supabaseServiceKey.length() - 1).trim();
            }
        }
        if (supabaseUrl != null) {
            supabaseUrl = supabaseUrl.trim();
            // Ensure no trailing slash to avoid double slashes in constructed URLs
            while (supabaseUrl.endsWith("/")) {
                supabaseUrl = supabaseUrl.substring(0, supabaseUrl.length() - 1);
            }
        }
    }

    public UploadResponse uploadMenuImage(MultipartFile file, String restaurantId) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("Image too large. Max size is 1MB.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !(contentType.equals("image/jpeg") || contentType.equals("image/png") || contentType.equals("image/webp"))) {
            throw new IllegalArgumentException("Unsupported image type. Use JPG, PNG, or WebP.");
        }

        if (supabaseUrl == null || supabaseUrl.isBlank() || supabaseServiceKey == null || supabaseServiceKey.isBlank()) {
            throw new IllegalStateException("Storage not configured on server. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.");
        }

        String ext = contentType.equals("image/png") ? "png" : contentType.equals("image/webp") ? "webp" : "jpg";
        LocalDate today = LocalDate.now();
        String rid = (restaurantId == null || restaurantId.isBlank()) ? "common" : restaurantId;
        String folder = String.format("%s/%s/%d/%02d/%02d", prefix, rid, today.getYear(), today.getMonthValue(), today.getDayOfMonth());
        String filename = UUID.randomUUID() + "." + ext;
        String path = folder + "/" + filename;

        String uploadUrl = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucket, path);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.setBearerAuth(supabaseServiceKey);
        headers.add("x-upsert", "false");

        try {
            HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);
            ResponseEntity<String> resp = restTemplate.exchange(uploadUrl, HttpMethod.POST, requestEntity, String.class);
            if (!resp.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Upload failed with status: " + resp.getStatusCode());
            }
        } catch (HttpStatusCodeException httpEx) {
            throw new RuntimeException("Upload failed: " + httpEx.getStatusCode() + " " + httpEx.getResponseBodyAsString(), httpEx);
        } catch (Exception ex) {
            throw new RuntimeException("Upload failed: " + ex.getMessage(), ex);
        }

        String publicUrl = String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, bucket, path);
        String signedUrl = generateSignedUrl(path, 3600);
        UploadResponse resp = new UploadResponse(publicUrl, path);
        resp.setSignedUrl(signedUrl);
        return resp;
    }

    public String generateSignedUrl(String maybePath, int expiresInSeconds) {
        String path = extractPath(maybePath);
        try {
            // Do NOT URL-encode slashes in the key; Supabase expects path segments
            String signUrl = String.format("%s/storage/v1/object/sign/%s/%s", supabaseUrl, bucket, path);
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(supabaseServiceKey);
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, Object> body = new HashMap<>();
            body.put("expiresIn", expiresInSeconds);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> resp = restTemplate.exchange(signUrl, HttpMethod.POST, entity, String.class);
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                throw new RuntimeException("Failed to create signed URL: " + resp.getStatusCode());
            }
            ObjectMapper om = new ObjectMapper();
            JsonNode node = om.readTree(resp.getBody());
            String signed = node.path("signedURL").asText();
            if (signed == null || signed.isBlank()) {
                throw new RuntimeException("Signed URL not returned by Supabase");
            }
            // Supabase returns a relative URL starting with /storage/...
            if (signed.startsWith("/")) {
                return supabaseUrl + signed;
            }
            return signed;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create signed URL: " + e.getMessage(), e);
        }
    }

    public void deleteObject(String maybePathOrUrl) {
        String path = extractPath(maybePathOrUrl);
        String deleteUrl = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucket, path);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(supabaseServiceKey);
        try {
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Void> resp = restTemplate.exchange(deleteUrl, HttpMethod.DELETE, entity, Void.class);
            if (!resp.getStatusCode().is2xxSuccessful() && resp.getStatusCode() != HttpStatus.NO_CONTENT) {
                throw new RuntimeException("Failed to delete object: " + resp.getStatusCode());
            }
        } catch (HttpStatusCodeException httpEx) {
            // If the file doesn't exist, don't block the flow
            if (httpEx.getStatusCode() != HttpStatus.NOT_FOUND) {
                throw new RuntimeException("Delete failed: " + httpEx.getStatusCode() + " " + httpEx.getResponseBodyAsString(), httpEx);
            }
        }
    }

    private String extractPath(String maybeUrl) {
        if (maybeUrl == null) return null;
        String publicPrefix = String.format("%s/storage/v1/object/public/%s/", supabaseUrl, bucket);
        String objectPrefix = String.format("%s/storage/v1/object/%s/", supabaseUrl, bucket);
        if (maybeUrl.startsWith(publicPrefix)) {
            return maybeUrl.substring(publicPrefix.length());
        }
        if (maybeUrl.startsWith(objectPrefix)) {
            return maybeUrl.substring(objectPrefix.length());
        }
        return maybeUrl; // assume already a path
    }

    public String normalizeToPath(String maybeUrlOrPath) {
        return extractPath(maybeUrlOrPath);
    }

    public ResponseEntity<byte[]> fetchObject(String maybePathOrUrl) {
        String path = extractPath(maybePathOrUrl);
        String getUrl = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucket, path);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(supabaseServiceKey);
        try {
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<byte[]> resp = restTemplate.exchange(getUrl, HttpMethod.GET, entity, byte[].class);
            return ResponseEntity.status(resp.getStatusCode())
                    .headers(resp.getHeaders())
                    .body(resp.getBody());
        } catch (HttpStatusCodeException httpEx) {
            return ResponseEntity.status(httpEx.getStatusCode()).body(httpEx.getResponseBodyAsByteArray());
        }
    }
}
