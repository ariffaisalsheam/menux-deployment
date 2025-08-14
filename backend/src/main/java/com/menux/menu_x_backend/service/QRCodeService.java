package com.menux.menu_x_backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import com.menux.menu_x_backend.entity.QRCustomizationSettings;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

@Service
public class QRCodeService {

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Generate QR code for restaurant menu (DEPRECATED - use table-specific QR codes instead)
     * This method is kept for backward compatibility but should not be used for new QR codes
     */
    @Deprecated
    public byte[] generateMenuQRCode(Long restaurantId, int size) throws WriterException, IOException {
        // For backward compatibility, we'll generate a QR code that requires table parameter
        // This will show an error message to users who scan old QR codes
        String menuUrl = frontendUrl + "/menu/" + restaurantId + "?table=LEGACY";
        return generateQRCode(menuUrl, size);
    }

    /**
     * Generate QR code for specific table
     */
    public byte[] generateTableQRCode(Long restaurantId, String tableNumber, int size) throws WriterException, IOException {
        String menuUrl = frontendUrl + "/menu/" + restaurantId + "?table=" + tableNumber;
        return generateQRCode(menuUrl, size);
    }

    /**
     * Generate QR code with custom content
     */
    public byte[] generateQRCode(String content, int size) throws WriterException, IOException {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.MARGIN, 1);

        BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, size, size, hints);
        
        return bitMatrixToByteArray(bitMatrix, "PNG");
    }

    /**
     * Generate QR code with restaurant branding (DEPRECATED - use table-specific QR codes instead)
     * This method is kept for backward compatibility but should not be used for new QR codes
     */
    @Deprecated
    public byte[] generateBrandedQRCode(Long restaurantId, String restaurantName, int size)
            throws WriterException, IOException {
        // For backward compatibility, we'll generate a QR code that requires table parameter
        String menuUrl = frontendUrl + "/menu/" + restaurantId + "?table=LEGACY";

        // Generate base QR code
        byte[] qrCodeBytes = generateQRCode(menuUrl, size);

        // Add restaurant name below QR code
        return addTextToQRCode(qrCodeBytes, restaurantName, size);
    }

    /**
     * Generate branded QR code for specific table
     */
    public byte[] generateBrandedTableQRCode(Long restaurantId, String restaurantName,
                                           String tableNumber, int size) throws WriterException, IOException {
        String menuUrl = frontendUrl + "/menu/" + restaurantId + "?table=" + tableNumber;

        // Generate base QR code
        byte[] qrCodeBytes = generateQRCode(menuUrl, size);

        // Add restaurant name and table number below QR code
        String displayText = restaurantName + "\nTable " + tableNumber;
        return addTextToQRCode(qrCodeBytes, displayText, size);
    }

    /**
     * Generate customized branded QR code for specific table with custom settings
     */
    public byte[] generateCustomizedBrandedTableQRCode(Long restaurantId, String restaurantName,
                                                     String tableNumber, int size,
                                                     QRCustomizationSettings customSettings) throws WriterException, IOException {
        String menuUrl = frontendUrl + "/menu/" + restaurantId + "?table=" + tableNumber;

        // Generate base QR code
        byte[] qrCodeBytes = generateQRCode(menuUrl, size);

        // Format restaurant name according to settings
        String formattedRestaurantName = customSettings.getFormattedRestaurantName(restaurantName);

        // Format table name according to settings
        String formattedTableName = customSettings.getFormattedTableName(tableNumber);

        // Build display text based on settings
        String displayText = "";
        if (!formattedRestaurantName.isEmpty()) {
            displayText = formattedRestaurantName;
            if (!formattedTableName.isEmpty()) {
                displayText += "\n" + formattedTableName;
            }
        } else if (!formattedTableName.isEmpty()) {
            displayText = formattedTableName;
        }

        if (displayText.isEmpty()) {
            // No text to add, return plain QR code
            return qrCodeBytes;
        }

        return addCustomizedTextToQRCode(qrCodeBytes, displayText, size, customSettings);
    }

    /**
     * Convert BitMatrix to byte array
     */
    private byte[] bitMatrixToByteArray(BitMatrix bitMatrix, String format) throws IOException {
        int width = bitMatrix.getWidth();
        int height = bitMatrix.getHeight();
        
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        
        for (int x = 0; x < width; x++) {
            for (int y = 0; y < height; y++) {
                image.setRGB(x, y, bitMatrix.get(x, y) ? Color.BLACK.getRGB() : Color.WHITE.getRGB());
            }
        }
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(image, format, outputStream);
        return outputStream.toByteArray();
    }

    /**
     * Add restaurant name text below QR code
     */
    private byte[] addTextToQRCode(byte[] qrCodeBytes, String text, int qrSize) throws IOException {
        // Read the QR code image
        BufferedImage qrImage = ImageIO.read(new java.io.ByteArrayInputStream(qrCodeBytes));
        
        // Calculate dimensions for the final image
        int textHeight = 40;
        int padding = 20;
        int finalWidth = qrSize + (padding * 2);
        int finalHeight = qrSize + textHeight + (padding * 3);
        
        // Create final image with text
        BufferedImage finalImage = new BufferedImage(finalWidth, finalHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = finalImage.createGraphics();
        
        // Set background to white
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, finalWidth, finalHeight);
        
        // Draw QR code centered
        int qrX = (finalWidth - qrSize) / 2;
        int qrY = padding;
        g2d.drawImage(qrImage, qrX, qrY, null);
        
        // Draw restaurant name
        g2d.setColor(Color.BLACK);
        g2d.setFont(new Font("Arial", Font.BOLD, 16));
        FontMetrics fm = g2d.getFontMetrics();
        int textWidth = fm.stringWidth(text);
        int textX = (finalWidth - textWidth) / 2;
        int textY = qrY + qrSize + padding + fm.getAscent();
        g2d.drawString(text, textX, textY);
        
        g2d.dispose();

        // Convert to byte array
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(finalImage, "PNG", outputStream);
        return outputStream.toByteArray();
    }

    /**
     * Add customized text to QR code based on settings
     */
    private byte[] addCustomizedTextToQRCode(byte[] qrCodeBytes, String text, int qrSize,
                                           QRCustomizationSettings customSettings) throws IOException {
        // Read the QR code image
        BufferedImage qrImage = ImageIO.read(new java.io.ByteArrayInputStream(qrCodeBytes));

        // Get font size from settings
        int fontSize = customSettings.getFontSizePixels();

        // Calculate dimensions for the final image
        int textHeight = fontSize + 20; // Add some padding
        int padding = 20;
        int finalWidth = qrSize + (padding * 2);

        // Calculate final height based on text position
        int finalHeight;
        int qrX, qrY, textY;

        if (customSettings.getTextPosition() == QRCustomizationSettings.TextPosition.TOP) {
            finalHeight = qrSize + textHeight + (padding * 3);
            qrX = (finalWidth - qrSize) / 2;
            qrY = textHeight + (padding * 2);
            textY = padding + fontSize;
        } else { // BOTTOM
            finalHeight = qrSize + textHeight + (padding * 3);
            qrX = (finalWidth - qrSize) / 2;
            qrY = padding;
            textY = qrY + qrSize + padding + fontSize;
        }

        // Create final image with text
        BufferedImage finalImage = new BufferedImage(finalWidth, finalHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = finalImage.createGraphics();

        // Set background to white
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, finalWidth, finalHeight);

        // Draw QR code
        g2d.drawImage(qrImage, qrX, qrY, null);

        // Draw text
        g2d.setColor(Color.BLACK);
        g2d.setFont(new Font("Arial", Font.BOLD, fontSize));

        // Handle multi-line text
        String[] lines = text.split("\n");
        FontMetrics fm = g2d.getFontMetrics();
        int lineHeight = fm.getHeight();

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            int textWidth = fm.stringWidth(line);
            int textX = (finalWidth - textWidth) / 2;
            int currentTextY = textY + (i * lineHeight);
            g2d.drawString(line, textX, currentTextY);
        }

        g2d.dispose();

        // Convert to byte array
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(finalImage, "PNG", outputStream);
        return outputStream.toByteArray();
    }

    /**
     * Generate QR code sheet for multiple tables (PDF-like layout)
     */
    public byte[] generateTableQRCodeSheet(Long restaurantId, String restaurantName,
                                         List<String> tableNumbers, int qrSize,
                                         int tablesPerRow) throws WriterException, IOException {

        int margin = 20;
        int textHeight = 60;
        int cellWidth = qrSize + (margin * 2);
        int cellHeight = qrSize + textHeight + (margin * 2);

        int rows = (int) Math.ceil((double) tableNumbers.size() / tablesPerRow);
        int sheetWidth = tablesPerRow * cellWidth;
        int sheetHeight = rows * cellHeight;

        BufferedImage sheetImage = new BufferedImage(sheetWidth, sheetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = sheetImage.createGraphics();

        // Set background to white
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, sheetWidth, sheetHeight);

        // Generate QR codes for each table
        for (int i = 0; i < tableNumbers.size(); i++) {
            String tableNumber = tableNumbers.get(i);
            int row = i / tablesPerRow;
            int col = i % tablesPerRow;

            int x = col * cellWidth + margin;
            int y = row * cellHeight + margin;

            try {
                // Generate table QR code
                byte[] qrBytes = generateTableQRCode(restaurantId, tableNumber, qrSize);
                BufferedImage qrImage = ImageIO.read(new java.io.ByteArrayInputStream(qrBytes));

                // Draw QR code
                g2d.drawImage(qrImage, x, y, null);

                // Draw table information
                g2d.setColor(Color.BLACK);
                g2d.setFont(new Font("Arial", Font.BOLD, 14));
                FontMetrics fm = g2d.getFontMetrics();

                String tableText = "Table " + tableNumber;
                int textWidth = fm.stringWidth(tableText);
                int textX = x + (qrSize - textWidth) / 2;
                int textY = y + qrSize + 20;

                g2d.drawString(tableText, textX, textY);

                // Draw restaurant name (smaller)
                g2d.setFont(new Font("Arial", Font.PLAIN, 10));
                fm = g2d.getFontMetrics();
                int nameWidth = fm.stringWidth(restaurantName);
                int nameX = x + (qrSize - nameWidth) / 2;
                int nameY = textY + 20;

                g2d.drawString(restaurantName, nameX, nameY);

            } catch (Exception e) {
                // Skip this QR code if generation fails
                continue;
            }
        }

        g2d.dispose();

        // Convert to byte array
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(sheetImage, "PNG", outputStream);
        return outputStream.toByteArray();
    }

    /**
     * Get menu URL for restaurant (DEPRECATED - use table-specific URLs instead)
     */
    @Deprecated
    public String getMenuUrl(Long restaurantId) {
        return frontendUrl + "/menu/" + restaurantId + "?table=LEGACY";
    }

    /**
     * Get table-specific menu URL
     */
    public String getTableMenuUrl(Long restaurantId, String tableNumber) {
        return frontendUrl + "/menu/" + restaurantId + "?table=" + tableNumber;
    }

    /**
     * Validate QR code size
     */
    public int validateSize(Integer size) {
        if (size == null) {
            return 256; // Default size
        }
        
        // Ensure size is within reasonable bounds
        if (size < 128) {
            return 128;
        } else if (size > 1024) {
            return 1024;
        }
        
        return size;
    }
}
