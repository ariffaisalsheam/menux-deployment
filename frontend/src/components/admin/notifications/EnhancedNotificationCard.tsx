import React from 'react';
import { Badge } from '../../ui/badge';
import {
  Bell,
  User,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  TrendingUp,
  ArrowDownRight,
  UserPlus,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { EnhancedNotification, NotificationType } from '../../../types/notifications';

interface EnhancedNotificationCardProps {
  notification: EnhancedNotification;
  onClick: () => void;
  className?: string;
}

const EnhancedNotificationCard: React.FC<EnhancedNotificationCardProps> = ({
  notification,
  onClick,
  className = '',
}) => {
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'NEW_ORDER':
        return <CreditCard className="w-4 h-4 text-green-600" />;
      case 'FEEDBACK_RECEIVED':
        return <Bell className="w-4 h-4 text-blue-600" />;
      case 'ITEM_OUT_OF_STOCK':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'TABLE_CALLED':
        return <Bell className="w-4 h-4 text-purple-600" />;
      case 'user_registered':
        return <UserPlus className="w-4 h-4 text-green-600" />;
      case 'plan_upgraded':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'plan_downgraded':
        return <ArrowDownRight className="w-4 h-4 text-orange-600" />;
      case 'payment_received':
        return <CreditCard className="w-4 h-4 text-green-600" />;
      case 'notification_sent':
        return <Bell className="w-4 h-4 text-blue-600" />;
      case 'system_alert':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
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
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'READ':
        return <CheckCircle className="w-3 h-3 text-blue-600" />;
      case 'FAILED':
        return <XCircle className="w-3 h-3 text-red-600" />;
      case 'PENDING':
        return <Clock className="w-3 h-3 text-orange-600" />;
      default:
        return <Clock className="w-3 h-3 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const isUnread = notification.status !== 'READ' && !notification.readAt;

  return (
    <div
      className={`
        group relative p-4 rounded-lg border transition-all duration-200 cursor-pointer
        hover:shadow-md hover:border-blue-300 hover:bg-blue-50/30
        ${isUnread ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-gray-200'}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full"></div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-medium text-gray-900 line-clamp-1 group-hover:text-blue-900">
              {notification.title}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className={`text-xs ${getPriorityColor(notification.priority)}`}>
                {notification.priority}
              </Badge>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </div>

          {/* Body */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-3 group-hover:text-gray-700">
            {notification.body}
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              {/* Status */}
              <div className="flex items-center gap-1">
                {getStatusIcon(notification.status)}
                <span className="capitalize">{notification.status.toLowerCase()}</span>
              </div>

              {/* Target User */}
              {notification.targetUser && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-24">{notification.targetUser.fullName}</span>
                </div>
              )}

              {/* Restaurant */}
              {notification.restaurant && (
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate max-w-24">{notification.restaurant.name}</span>
                </div>
              )}
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(notification.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-transparent transition-all duration-200 pointer-events-none"></div>
    </div>
  );
};

export default EnhancedNotificationCard;
