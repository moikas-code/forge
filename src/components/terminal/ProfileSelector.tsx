'use client';

import React, { useState } from 'react';
import { Check, ChevronDown, Plus, Settings } from 'lucide-react';
import { useTerminalStore, type TerminalProfile } from '@/stores/terminalStore';
import { Button } from '@/components/ui/button';

interface ProfileSelectorProps {
  onProfileSelect?: (profile_id: string) => void;
  onManageProfiles?: () => void;
  className?: string;
}

export function ProfileSelector({ 
  onProfileSelect, 
  onManageProfiles, 
  className 
}: ProfileSelectorProps) {
  const { 
    profiles, 
    default_profile_id, 
    create_session 
  } = useTerminalStore();
  
  const [is_open, set_is_open] = useState(false);
  const [selected_profile_id, set_selected_profile_id] = useState<string | undefined>(default_profile_id);
  
  const selected_profile = profiles.find(p => p.id === selected_profile_id);
  
  const handle_profile_select = (profile_id: string) => {
    set_selected_profile_id(profile_id);
    set_is_open(false);
    
    if (onProfileSelect) {
      onProfileSelect(profile_id);
    } else {
      // Default behavior: create new session with profile
      create_session(profile_id);
    }
  };
  
  const handle_manage_profiles = () => {
    set_is_open(false);
    if (onManageProfiles) {
      onManageProfiles();
    }
  };
  
  return (
    <div className={`profile-selector relative ${className || ''}`}>
      <Button
        variant="outline"
        size="sm"
        className="profile-selector-trigger"
        onClick={() => set_is_open(!is_open)}
      >
        <span className="profile-name">
          {selected_profile?.name || 'Select Profile'}
        </span>
        <ChevronDown 
          size={12} 
          className={`ml-2 transition-transform ${is_open ? 'rotate-180' : ''}`} 
        />
      </Button>
      
      {is_open && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => set_is_open(false)}
          />
          
          {/* Dropdown */}
          <div className="profile-dropdown absolute top-full left-0 mt-1 min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20 overflow-hidden">
            {/* Profile list */}
            <div className="profile-list">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  className="profile-item w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                  onClick={() => handle_profile_select(profile.id)}
                >
                  <div className="profile-info flex-1">
                    <div className="profile-name text-sm font-medium">
                      {profile.name}
                    </div>
                    <div className="profile-shell text-xs text-gray-500 dark:text-gray-400">
                      {profile.shell_type} {profile.shell_path && `(${profile.shell_path})`}
                    </div>
                  </div>
                  
                  {profile.id === selected_profile_id && (
                    <Check size={14} className="text-blue-500" />
                  )}
                </button>
              ))}
            </div>
            
            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700" />
            
            {/* Actions */}
            <div className="profile-actions">
              <button
                className="action-item w-full flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left text-sm"
                onClick={handle_manage_profiles}
              >
                <Settings size={14} className="mr-2" />
                Manage Profiles
              </button>
            </div>
          </div>
        </>
      )}
      
      <style jsx>{`
        .profile-selector {
          position: relative;
          display: inline-block;
        }
        
        .profile-selector-trigger {
          font-size: 13px;
          height: 28px;
          padding: 0 8px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          transition: all 0.2s ease;
        }
        
        .profile-selector-trigger:hover {
          background: rgba(255, 255, 255, 1);
          border-color: rgba(0, 0, 0, 0.2);
        }
        
        .dark .profile-selector-trigger {
          border-color: rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.3);
        }
        
        .dark .profile-selector-trigger:hover {
          background: rgba(0, 0, 0, 0.5);
          border-color: rgba(255, 255, 255, 0.2);
        }
        
        .profile-dropdown {
          animation: slideDown 0.15s ease-out;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .profile-item,
        .action-item {
          transition: background-color 0.15s ease;
        }
        
        .profile-info {
          min-width: 0;
        }
        
        .profile-name {
          truncate: true;
        }
        
        .profile-shell {
          truncate: true;
        }
      `}</style>
    </div>
  );
}