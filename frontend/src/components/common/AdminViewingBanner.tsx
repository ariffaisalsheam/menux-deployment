import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';

export const AdminViewingBanner: React.FC = () => {
  const { isViewingAsUser, originalAdminUser, returnToAdmin } = useAuth();

  if (!isViewingAsUser || !originalAdminUser) {
    return null;
  }

  return (
    <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4" />
        <span className="text-sm font-medium">
          Admin View: You are viewing as a restaurant owner
        </span>
        <span className="text-xs opacity-75">
          (Logged in as {originalAdminUser.fullName})
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={returnToAdmin}
        className="bg-white text-red-600 hover:bg-gray-100 border-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Return to Admin Dashboard
      </Button>
    </div>
  );
};
