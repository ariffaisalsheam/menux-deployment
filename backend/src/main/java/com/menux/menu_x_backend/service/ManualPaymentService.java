package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.entity.ManualPayment;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.entity.Notification;
import com.menux.menu_x_backend.repository.ManualPaymentRepository;
import com.menux.menu_x_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.Map;

@Service
public class ManualPaymentService {

    private static final Pattern BD_MSISDN = Pattern.compile("^01\\d{9}$");

    @Autowired
    private ManualPaymentRepository manualPaymentRepository;

    @Autowired
    private RestaurantService restaurantService;

    @Autowired
    private PlatformSettingService platformSettingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminService adminService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SubscriptionService subscriptionService;

    private Optional<User> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return Optional.empty();
        return userRepository.findByUsername(auth.getName());
    }

    private Long requireCurrentUserId() {
        return getCurrentUser().map(User::getId)
                .orElseThrow(() -> new RuntimeException("Unauthorized"));
    }

    private Long requireAdminUserId() {
        // Same as current user; admin-only endpoints will guard via annotations
        return requireCurrentUserId();
    }

    @Transactional
    public ManualPayment submitManualBkash(BigDecimal amount, String trxId, String senderMsisdn, String screenshotPath) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Amount must be greater than 0");
        }
        // Min amount from settings (Double) -> BigDecimal
        Double minAmountSetting = platformSettingService.getDecimalSetting("PAYMENT_BKASH_MIN_AMOUNT", 0.0);
        BigDecimal minAmount = BigDecimal.valueOf(minAmountSetting);
        if (minAmount.compareTo(BigDecimal.ZERO) > 0 && amount.compareTo(minAmount) < 0) {
            throw new RuntimeException("Amount is below the minimum required: " + minAmount);
        }
        if (trxId == null || trxId.trim().length() < 6) {
            throw new RuntimeException("Invalid TrxID");
        }
        if (manualPaymentRepository.findByTrxId(trxId.trim()).isPresent()) {
            throw new RuntimeException("This TrxID has already been submitted");
        }
        if (senderMsisdn == null || !BD_MSISDN.matcher(senderMsisdn.trim()).matches()) {
            throw new RuntimeException("Sender number must be a valid Bangladeshi mobile number (11 digits starting with 01)");
        }

        User user = getCurrentUser().orElseThrow(() -> new RuntimeException("Unauthorized"));
        if (user.getRole() != User.Role.RESTAURANT_OWNER) {
            throw new RuntimeException("Only restaurant owners can submit payments");
        }

        Restaurant restaurant = restaurantService.getCurrentUserRestaurant()
                .orElseThrow(() -> new RuntimeException("No restaurant found for current owner"));

        ManualPayment mp = new ManualPayment();
        mp.setOwnerId(user.getId());
        mp.setRestaurantId(restaurant.getId());
        mp.setAmount(amount);
        mp.setTrxId(trxId.trim());
        mp.setSenderMsisdn(senderMsisdn.trim());
        mp.setScreenshotPath(screenshotPath);
        mp.setStatus(ManualPayment.Status.PENDING);
        mp.setCreatedAt(LocalDateTime.now());

        ManualPayment saved = manualPaymentRepository.save(mp);

        // Notify all active SUPER_ADMIN users about the new manual payment submission
        try {
            List<User> admins = userRepository.findActiveUsersByRole(User.Role.SUPER_ADMIN);
            String title = "Manual payment submitted";
            String body = "Restaurant '" + restaurant.getName() + "' submitted a bKash payment (TrxID: " + saved.getTrxId() + ") for review.";
            Map<String, Object> data = Map.of(
                    "manualPaymentId", saved.getId(),
                    "paymentId", saved.getId(),
                    "ownerId", saved.getOwnerId(),
                    "restaurantId", saved.getRestaurantId(),
                    "trxId", saved.getTrxId(),
                    "amount", saved.getAmount(),
                    "status", saved.getStatus().name()
            );
            for (User admin : admins) {
                notificationService.createNotification(
                        admin.getId(),
                        saved.getRestaurantId(),
                        Notification.Type.GENERIC,
                        title,
                        body,
                        data
                );
            }
        } catch (Exception ignored) {
            // Best-effort: don't fail the submission if notifications fail
        }

        return saved;
    }

    @Transactional(readOnly = true)
    public List<ManualPayment> listMyPayments() {
        Long userId = requireCurrentUserId();
        return manualPaymentRepository.findByOwnerIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<ManualPayment> adminList(ManualPayment.Status status) {
        if (status == null) {
            return manualPaymentRepository.findAll()
                    .stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .toList();
        }
        return manualPaymentRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    @Transactional
    public ManualPayment approve(Long id, String note) {
        Long adminId = requireAdminUserId();
        ManualPayment mp = manualPaymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        if (mp.getStatus() != ManualPayment.Status.PENDING) {
            throw new RuntimeException("Only pending payments can be approved");
        }
        mp.setStatus(ManualPayment.Status.APPROVED);
        mp.setVerifiedAt(LocalDateTime.now());
        mp.setVerifiedBy(adminId);
        if (note != null) mp.setNote(note);
        ManualPayment saved = manualPaymentRepository.save(mp);

        // Flip plan to PRO for the owner
        adminService.updateUserPlan(mp.getOwnerId(), Restaurant.SubscriptionPlan.PRO);

        // Extend subscription period according to settings
        try {
            subscriptionService.onManualPaymentApproved(saved);
        } catch (Exception ignored) {
            // best-effort; don't fail approval path
        }

        // Notify owner about approval (best-effort push handled inside NotificationService)
        String title = "Payment approved";
        String body = "Your bKash payment (TrxID: " + mp.getTrxId() + ") has been approved. Your plan is now Pro.";
        notificationService.createNotification(
                mp.getOwnerId(),
                mp.getRestaurantId(),
                Notification.Type.GENERIC,
                title,
                body,
                Map.of(
                        "paymentId", mp.getId(),
                        "trxId", mp.getTrxId(),
                        "amount", mp.getAmount(),
                        "status", mp.getStatus().name()
                )
        );
        return saved;
    }

    @Transactional
    public ManualPayment reject(Long id, String note) {
        Long adminId = requireAdminUserId();
        ManualPayment mp = manualPaymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        if (mp.getStatus() != ManualPayment.Status.PENDING) {
            throw new RuntimeException("Only pending payments can be rejected");
        }
        mp.setStatus(ManualPayment.Status.REJECTED);
        mp.setVerifiedAt(LocalDateTime.now());
        mp.setVerifiedBy(adminId);
        if (note != null) mp.setNote(note);
        ManualPayment saved = manualPaymentRepository.save(mp);

        // Notify owner about rejection
        String title = "Payment rejected";
        String body = "Your bKash payment (TrxID: " + mp.getTrxId() + ") was rejected" + (note != null && !note.isBlank() ? ": " + note : ".");
        notificationService.createNotification(
                mp.getOwnerId(),
                mp.getRestaurantId(),
                Notification.Type.GENERIC,
                title,
                body,
                Map.of(
                        "paymentId", mp.getId(),
                        "trxId", mp.getTrxId(),
                        "amount", mp.getAmount(),
                        "status", mp.getStatus().name()
                )
        );
        return saved;
    }
}
