// Enhanced notification types for admin dashboard
export interface EnhancedNotification {
  id: number;
  targetUserId?: number;
  restaurantId?: number;
  type: NotificationType;
  title: string;
  body: string;
  data?: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
  
  // Enhanced context information
  targetUser?: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
  restaurant?: {
    id: number;
    name: string;
    address?: string;
    phone?: string;
  };
  parsedData?: Record<string, any>;
}

export type NotificationType = 
  | 'NEW_ORDER' 
  | 'FEEDBACK_RECEIVED' 
  | 'ITEM_OUT_OF_STOCK' 
  | 'TABLE_CALLED' 
  | 'GENERIC'
  | 'user_registered'
  | 'plan_upgraded'
  | 'plan_downgraded'
  | 'payment_received'
  | 'notification_sent'
  | 'system_alert';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH';

export type NotificationStatus = 'PENDING' | 'SENT' | 'READ' | 'FAILED';

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  icon?: React.ComponentType<{ className?: string }>;
}

export interface NotificationDetailModalProps {
  notification: EnhancedNotification | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead?: (id: number) => void;
  onDelete?: (id: number) => void;
}
