import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { ScrollArea } from '../../ui/scroll-area';
import {
  Bell,
  User,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Trash2,

  CreditCard,
  TrendingUp,
  ArrowDownRight,
  UserPlus,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { NotificationDetailModalProps, NotificationType } from '../../../types/notifications';

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  isOpen,
  onClose,
  onMarkAsRead,
  onDelete,
}) => {
  if (!notification) return null;

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'NEW_ORDER':
        return <CreditCard className="w-5 h-5 text-green-600" />;
      case 'FEEDBACK_RECEIVED':
        return <Bell className="w-5 h-5 text-blue-600" />;
      case 'ITEM_OUT_OF_STOCK':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'TABLE_CALLED':
        return <Bell className="w-5 h-5 text-purple-600" />;
      case 'user_registered':
        return <UserPlus className="w-5 h-5 text-green-600" />;
      case 'plan_upgraded':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'plan_downgraded':
        return <ArrowDownRight className="w-5 h-5 text-orange-600" />;
      case 'payment_received':
        return <CreditCard className="w-5 h-5 text-green-600" />;
      case 'notification_sent':
        return <Bell className="w-5 h-5 text-blue-600" />;
      case 'system_alert':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'READ':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      absolute: date.toLocaleString(),
    };
  };

  const parsedData = notification.parsedData || 
    (notification.data ? JSON.parse(notification.data) : null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getNotificationIcon(notification.type)}
            <span className="flex-1">Notification Details</span>
            <Badge variant="outline" className={getPriorityColor(notification.priority)}>
              {notification.priority}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{notification.title}</h3>
                <p className="text-gray-700 leading-relaxed">{notification.body}</p>
              </div>

              {/* Status and Timing */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  {getStatusIcon(notification.status)}
                  <span className="capitalize">{notification.status.toLowerCase()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span title={formatDate(notification.createdAt).absolute}>
                    {formatDate(notification.createdAt).relative}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Context Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Target User */}
              {notification.targetUser && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Target User
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                    <p className="font-medium">{notification.targetUser.fullName}</p>
                    <p className="text-sm text-gray-600">{notification.targetUser.email}</p>
                    <Badge variant="outline" className="text-xs">
                      {notification.targetUser.role}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Restaurant */}
              {notification.restaurant && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Restaurant
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                    <p className="font-medium">{notification.restaurant.name}</p>
                    {notification.restaurant.address && (
                      <p className="text-sm text-gray-600">{notification.restaurant.address}</p>
                    )}
                    {notification.restaurant.phone && (
                      <p className="text-sm text-gray-600">{notification.restaurant.phone}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Data */}
            {parsedData && Object.keys(parsedData).length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Additional Information</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(parsedData, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            )}

            {/* Technical Details */}
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium">Technical Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">ID:</span>
                  <span className="ml-2 font-mono">{notification.id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2">{notification.type}</span>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2">{formatDate(notification.createdAt).absolute}</span>
                </div>
                {notification.readAt && (
                  <div>
                    <span className="text-gray-600">Read:</span>
                    <span className="ml-2">{formatDate(notification.readAt).absolute}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {notification.status !== 'READ' && onMarkAsRead && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkAsRead(notification.id)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Mark as Read
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(notification.id)}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
          </div>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationDetailModal;
