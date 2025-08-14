package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.entity.MenuView;
import com.menux.menu_x_backend.repository.MenuViewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class MenuViewTrackingService {
    
    @Autowired
    private MenuViewRepository menuViewRepository;
    
    /**
     * Track a menu scan (QR code scan)
     */
    @Transactional
    public void trackMenuScan(Long restaurantId, String tableNumber, HttpServletRequest request) {
        MenuView view = new MenuView(restaurantId, MenuView.ViewType.MENU_SCAN);
        view.setTableNumber(tableNumber);
        setRequestInfo(view, request);
        menuViewRepository.save(view);
    }
    
    /**
     * Track a menu item view
     */
    @Transactional
    public void trackMenuItemView(Long restaurantId, Long menuItemId, HttpServletRequest request) {
        MenuView view = new MenuView(restaurantId, menuItemId, MenuView.ViewType.ITEM_VIEW);
        setRequestInfo(view, request);
        menuViewRepository.save(view);
    }
    
    /**
     * Track a category view
     */
    @Transactional
    public void trackCategoryView(Long restaurantId, HttpServletRequest request) {
        MenuView view = new MenuView(restaurantId, MenuView.ViewType.CATEGORY_VIEW);
        setRequestInfo(view, request);
        menuViewRepository.save(view);
    }
    
    /**
     * Set request information (IP, User Agent) from HttpServletRequest
     */
    private void setRequestInfo(MenuView view, HttpServletRequest request) {
        if (request != null) {
            // Get real IP address (considering proxies)
            String ip = getClientIpAddress(request);
            view.setVisitorIp(ip);
            
            // Get user agent
            String userAgent = request.getHeader("User-Agent");
            if (userAgent != null && userAgent.length() > 255) {
                userAgent = userAgent.substring(0, 255); // Truncate if too long
            }
            view.setUserAgent(userAgent);
        }
    }
    
    /**
     * Get the real client IP address, considering various proxy headers
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String[] headerNames = {
            "X-Forwarded-For",
            "X-Real-IP", 
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_X_FORWARDED_FOR",
            "HTTP_X_FORWARDED",
            "HTTP_X_CLUSTER_CLIENT_IP",
            "HTTP_CLIENT_IP",
            "HTTP_FORWARDED_FOR",
            "HTTP_FORWARDED",
            "HTTP_VIA",
            "REMOTE_ADDR"
        };
        
        for (String header : headerNames) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // X-Forwarded-For can contain multiple IPs, take the first one
                if (ip.contains(",")) {
                    ip = ip.split(",")[0].trim();
                }
                return ip;
            }
        }
        
        // Fallback to remote address
        return request.getRemoteAddr();
    }
}
