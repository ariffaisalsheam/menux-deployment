package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.media.UploadResponse;
import com.menux.menu_x_backend.service.MediaStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    private final MediaStorageService mediaStorageService;

    public MediaController(MediaStorageService mediaStorageService) {
        this.mediaStorageService = mediaStorageService;
    }

    @PostMapping(path = "/upload", consumes = { "multipart/form-data" })
    public ResponseEntity<UploadResponse> upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "restaurantId", required = false) String restaurantId
    ) {
        UploadResponse result = mediaStorageService.uploadMenuImage(file, restaurantId);
        // Provide backend proxy URL so frontend doesn't expose storage domain
        String proxy = "/api/media/stream?path=" + URLEncoder.encode(result.getPath(), StandardCharsets.UTF_8);
        result.setProxyUrl(proxy);
        return ResponseEntity.ok(result);
    }

    // Generate a short-lived signed URL for a stored object
    @GetMapping("/signed")
    public ResponseEntity<Map<String, String>> getSignedUrl(
            @RequestParam("path") String path,
            @RequestParam(value = "expiresIn", defaultValue = "3600") int expiresIn
    ) {
        String signed = mediaStorageService.generateSignedUrl(path, expiresIn);
        Map<String, String> map = new HashMap<>();
        map.put("signedUrl", signed);
        return ResponseEntity.ok(map);
    }

    // Stream the object via backend proxy to hide storage domain
    @GetMapping("/stream")
    public ResponseEntity<byte[]> stream(@RequestParam("path") String path) {
        return mediaStorageService.fetchObject(path);
    }
}
