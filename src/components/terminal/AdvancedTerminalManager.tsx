import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Plus, X, Settings, MoreHorizontal } from 'lucide-react';
import { useTerminalStore } from '@/stores/terminalStore';
import { SplitTerminalPane } from './SplitTerminalPane';
import { ProfileSelector } from './ProfileSelector';
import { ProfileManagement } from './ProfileManagement';
import { Button } from '@/components/ui/button';
import './TerminalManager.css';

interface AdvancedTerminalManagerProps {
  className?: string;
}

export function AdvancedTerminalManager({ className }: AdvancedTerminalManagerProps) {
  const { 
    sessions, 
    active_session_id, 
    create_session, 
    remove_session, 
    set_active_session,
    get_active_session,
    profiles,
    default_profile_id,
  } = useTerminalStore();
  
  const [show_profile_management, set_show_profile_management] = useState(false);
  const terminal_container_ref = useRef<HTMLDivElement>(null);
  
  // Create initial terminal if none exist
  useEffect(() => {
    if (sessions.length === 0) {
      create_session();
    }
  }, [sessions.length, create_session]);
  
  const handle_new_terminal = (profile_id?: string) => {
    create_session(profile_id);
  };
  
  const handle_close_terminal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    remove_session(id);
  };

  const handle_manage_profiles = () => {
    set_show_profile_management(true);
  };

  const handle_close_profile_management = () => {
    set_show_profile_management(false);
  };

  const active_session = get_active_session();
  
  // Memoize terminal instances to prevent unnecessary re-renders
  const terminal_instances = useMemo(() => {
    return sessions.map(session => ({
      id: session.id,
      element: (
        <div
          key={session.id}
          className={`terminal-instance ${session.id === active_session_id ? 'active' : 'hidden'}`}
        >
          {session.splits.map(split => (
            <SplitTerminalPane
              key={split.id}
              session_id={session.id}
              split={split}
              className="h-full"
            />
          ))}
        </div>
      )
    }));
  }, [sessions, active_session_id]);

  if (show_profile_management) {
    return (
      <div className={`advanced-terminal-manager ${className || ''}`}>
        <ProfileManagement onClose={handle_close_profile_management} />
      </div>
    );
  }
  
  return (
    <div className={`advanced-terminal-manager ${className || ''}`}>
      {/* Enhanced tab bar */}
      <div className="terminal-tabs-container">
        <div className="terminal-tabs">
          {/* Profile selector */}
          <div className="profile-selector-container">
            <ProfileSelector 
              onProfileSelect={handle_new_terminal}
              onManageProfiles={handle_manage_profiles}
            />
          </div>
          
          {/* Session tabs */}
          <div className="session-tabs">
            {sessions.map((session) => {
              const profile = profiles.find(p => p.id === session.profile_id);
              const pane_count = session.splits.reduce((sum, split) => sum + split.panes.length, 0);
              
              return (
                <div
                  key={session.id}
                  className={`terminal-tab ${session.id === active_session_id ? 'active' : ''}`}
                  onClick={() => set_active_session(session.id)}
                >
                  <div className="terminal-tab-content">
                    <span className="terminal-tab-title">{session.title}</span>
                    {pane_count > 1 && (
                      <span className="pane-count">({pane_count})</span>
                    )}
                    {profile && profile.id !== default_profile_id && (
                      <span className="profile-indicator">{profile.shell_type}</span>
                    )}
                  </div>
                  {sessions.length > 1 && (
                    <button
                      className="terminal-tab-close"
                      onClick={(e) => handle_close_terminal(session.id, e)}
                      aria-label="Close terminal"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Actions */}
          <div className="terminal-actions">
            <Button
              variant="ghost"
              size="icon"
              className="terminal-new-tab"
              onClick={() => handle_new_terminal()}
              aria-label="New terminal"
            >
              <Plus size={14} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="terminal-settings"
              onClick={handle_manage_profiles}
              aria-label="Terminal settings"
            >
              <Settings size={14} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Terminal content area */}
      <div ref={terminal_container_ref} className="terminal-content">
        {terminal_instances.map(({ element }) => element)}
      </div>
      
      <style jsx>{`
        .advanced-terminal-manager {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #1e1e1e;
        }
        
        .terminal-tabs-container {
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .terminal-tabs {
          display: flex;
          align-items: center;
          min-height: 36px;
          padding: 0 8px;
          gap: 8px;
        }
        
        .profile-selector-container {
          flex-shrink: 0;
        }
        
        .session-tabs {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .session-tabs::-webkit-scrollbar {
          display: none;
        }
        
        .terminal-tab {
          display: flex;
          align-items: center;
          min-width: 120px;
          max-width: 200px;
          height: 28px;
          padding: 0 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px 6px 0 0;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
          white-space: nowrap;
          overflow: hidden;
        }
        
        .terminal-tab:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .terminal-tab.active {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.2);
        }
        
        .terminal-tab-content {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
          gap: 4px;
        }
        
        .terminal-tab-title {
          font-size: 12px;
          color: #cccccc;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
        }
        
        .pane-count {
          font-size: 10px;
          color: #888888;
          flex-shrink: 0;
        }
        
        .profile-indicator {
          font-size: 9px;
          color: #6eb5ff;
          background: rgba(110, 181, 255, 0.2);
          padding: 1px 4px;
          border-radius: 2px;
          flex-shrink: 0;
        }
        
        .terminal-tab-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          margin-left: 4px;
          border: none;
          background: none;
          color: #888888;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        
        .terminal-tab-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #cccccc;
        }
        
        .terminal-actions {
          display: flex;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
        }
        
        .terminal-new-tab,
        .terminal-settings {
          width: 24px;
          height: 24px;
          color: #888888;
        }
        
        .terminal-new-tab:hover,
        .terminal-settings:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #cccccc;
        }
        
        .terminal-content {
          flex: 1;
          min-height: 0;
          position: relative;
        }
        
        .terminal-instance {
          position: absolute;
          inset: 0;
        }
        
        .terminal-instance.hidden {
          display: none;
        }
        
        .terminal-instance.active {
          display: block;
        }
      `}</style>
    </div>
  );
}