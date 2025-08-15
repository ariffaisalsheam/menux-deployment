package com.menux.menu_x_backend.dto.media;

public class UploadResponse {
    private String url;       // public URL (may be disabled in production)
    private String path;      // internal storage path
    private String signedUrl; // short-lived URL
    private String proxyUrl;  // backend proxy URL

    public UploadResponse() {}

    public UploadResponse(String url, String path) {
        this.url = url;
        this.path = path;
    }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getSignedUrl() { return signedUrl; }
    public void setSignedUrl(String signedUrl) { this.signedUrl = signedUrl; }

    public String getProxyUrl() { return proxyUrl; }
    public void setProxyUrl(String proxyUrl) { this.proxyUrl = proxyUrl; }
}
