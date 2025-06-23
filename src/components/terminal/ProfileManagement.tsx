'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Star,
  Terminal,
  Settings 
} from 'lucide-react';
import { 
  useTerminalStore, 
  type TerminalProfile, 
  type ShellType 
} from '@/stores/terminalStore';
import { Button } from '@/components/ui/button';

interface ProfileManagementProps {
  onClose?: () => void;
  className?: string;
}

interface ProfileFormData {
  name: string;
  shell_type: ShellType;
  shell_path: string;
  shell_args: string;
  environment: string;
  working_directory: string;
}

const SHELL_TYPES: { value: ShellType; label: string; default_path: string }[] = [
  { value: 'bash', label: 'Bash', default_path: '/bin/bash' },
  { value: 'zsh', label: 'Zsh', default_path: '/bin/zsh' },
  { value: 'fish', label: 'Fish', default_path: '/usr/bin/fish' },
  { value: 'powershell', label: 'PowerShell', default_path: '/usr/bin/pwsh' },
  { value: 'cmd', label: 'Command Prompt', default_path: 'cmd.exe' },
  { value: 'custom', label: 'Custom', default_path: '' },
];

export function ProfileManagement({ onClose, className }: ProfileManagementProps) {
  const {
    profiles,
    default_profile_id,
    add_profile,
    update_profile,
    remove_profile,
    set_default_profile,
  } = useTerminalStore();

  const [editing_profile_id, set_editing_profile_id] = useState<string | null>(null);
  const [creating_profile, set_creating_profile] = useState(false);
  const [form_data, set_form_data] = useState<ProfileFormData>({
    name: '',
    shell_type: 'bash',
    shell_path: '/bin/bash',
    shell_args: '-l',
    environment: '',
    working_directory: '',
  });

  const is_editing = editing_profile_id !== null || creating_profile;
  const current_profile = profiles.find(p => p.id === editing_profile_id);

  const start_editing = (profile: TerminalProfile) => {
    set_editing_profile_id(profile.id);
    set_form_data({
      name: profile.name,
      shell_type: profile.shell_type,
      shell_path: profile.shell_path || '',
      shell_args: profile.shell_args?.join(' ') || '',
      environment: profile.environment ? 
        Object.entries(profile.environment)
          .map(([key, value]) => `${key}=${value}`)
          .join('\n') : '',
      working_directory: profile.working_directory || '',
    });
  };

  const start_creating = () => {
    set_creating_profile(true);
    set_form_data({
      name: 'New Profile',
      shell_type: 'bash',
      shell_path: '/bin/bash',
      shell_args: '-l',
      environment: '',
      working_directory: '',
    });
  };

  const cancel_editing = () => {
    set_editing_profile_id(null);
    set_creating_profile(false);
    set_form_data({
      name: '',
      shell_type: 'bash',
      shell_path: '/bin/bash',
      shell_args: '-l',
      environment: '',
      working_directory: '',
    });
  };

  const save_profile = () => {
    const shell_args = form_data.shell_args
      .split(/\s+/)
      .filter(arg => arg.trim());

    const environment: Record<string, string> = {};
    if (form_data.environment.trim()) {
      form_data.environment.split('\n').forEach(line => {
        const [key, ...value_parts] = line.split('=');
        if (key?.trim() && value_parts.length > 0) {
          environment[key.trim()] = value_parts.join('=');
        }
      });
    }

    const profile_data = {
      name: form_data.name.trim() || 'Unnamed Profile',
      shell_type: form_data.shell_type,
      shell_path: form_data.shell_path.trim() || undefined,
      shell_args: shell_args.length > 0 ? shell_args : undefined,
      environment: Object.keys(environment).length > 0 ? environment : undefined,
      working_directory: form_data.working_directory.trim() || undefined,
    };

    if (creating_profile) {
      add_profile(profile_data);
    } else if (editing_profile_id) {
      update_profile(editing_profile_id, profile_data);
    }

    cancel_editing();
  };

  const delete_profile = (profile_id: string) => {
    if (profiles.length <= 1) {
      alert('Cannot delete the last profile');
      return;
    }
    
    if (confirm('Are you sure you want to delete this profile?')) {
      remove_profile(profile_id);
    }
  };

  const set_as_default = (profile_id: string) => {
    set_default_profile(profile_id);
  };

  const handle_shell_type_change = (shell_type: ShellType) => {
    const shell_info = SHELL_TYPES.find(s => s.value === shell_type);
    set_form_data(prev => ({
      ...prev,
      shell_type,
      shell_path: shell_info?.default_path || prev.shell_path,
    }));
  };

  if (is_editing) {
    return (
      <div className={`profile-management ${className || ''}`}>
        {/* Header */}
        <div className="profile-header flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={cancel_editing}
            >
              <ArrowLeft size={16} />
            </Button>
            <Terminal size={16} />
            <h2 className="text-lg font-semibold">
              {creating_profile ? 'New Profile' : 'Edit Profile'}
            </h2>
          </div>
          
          <Button onClick={save_profile} size="sm">
            <Save size={14} className="mr-2" />
            Save
          </Button>
        </div>

        {/* Form */}
        <div className="profile-form p-4 space-y-4">
          {/* Name */}
          <div className="form-group">
            <label className="form-label block text-sm font-medium mb-1">
              Name
            </label>
            <input
              type="text"
              className="form-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              value={form_data.name}
              onChange={(e) => set_form_data(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Profile name"
            />
          </div>

          {/* Shell Type */}
          <div className="form-group">
            <label className="form-label block text-sm font-medium mb-1">
              Shell Type
            </label>
            <select
              className="form-select w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              value={form_data.shell_type}
              onChange={(e) => handle_shell_type_change(e.target.value as ShellType)}
            >
              {SHELL_TYPES.map(shell => (
                <option key={shell.value} value={shell.value}>
                  {shell.label}
                </option>
              ))}
            </select>
          </div>

          {/* Shell Path */}
          <div className="form-group">
            <label className="form-label block text-sm font-medium mb-1">
              Shell Path
            </label>
            <input
              type="text"
              className="form-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              value={form_data.shell_path}
              onChange={(e) => set_form_data(prev => ({ ...prev, shell_path: e.target.value }))}
              placeholder="/bin/bash"
            />
          </div>

          {/* Shell Arguments */}
          <div className="form-group">
            <label className="form-label block text-sm font-medium mb-1">
              Shell Arguments
            </label>
            <input
              type="text"
              className="form-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              value={form_data.shell_args}
              onChange={(e) => set_form_data(prev => ({ ...prev, shell_args: e.target.value }))}
              placeholder="-l"
            />
            <p className="form-help text-xs text-gray-500 mt-1">
              Space-separated arguments passed to the shell
            </p>
          </div>

          {/* Working Directory */}
          <div className="form-group">
            <label className="form-label block text-sm font-medium mb-1">
              Working Directory
            </label>
            <input
              type="text"
              className="form-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              value={form_data.working_directory}
              onChange={(e) => set_form_data(prev => ({ ...prev, working_directory: e.target.value }))}
              placeholder="/home/user"
            />
            <p className="form-help text-xs text-gray-500 mt-1">
              Leave empty to use default directory
            </p>
          </div>

          {/* Environment Variables */}
          <div className="form-group">
            <label className="form-label block text-sm font-medium mb-1">
              Environment Variables
            </label>
            <textarea
              className="form-textarea w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              rows={4}
              value={form_data.environment}
              onChange={(e) => set_form_data(prev => ({ ...prev, environment: e.target.value }))}
              placeholder="TERM=xterm-256color&#10;PATH=/usr/local/bin:$PATH"
            />
            <p className="form-help text-xs text-gray-500 mt-1">
              One variable per line in KEY=value format
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`profile-management ${className || ''}`}>
      {/* Header */}
      <div className="profile-header flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <ArrowLeft size={16} />
            </Button>
          )}
          <Settings size={16} />
          <h2 className="text-lg font-semibold">Terminal Profiles</h2>
        </div>
        
        <Button onClick={start_creating} size="sm">
          <Plus size={14} className="mr-2" />
          New Profile
        </Button>
      </div>

      {/* Profile List */}
      <div className="profile-list">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="profile-item flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="profile-info flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="profile-name font-medium">
                  {profile.name}
                </h3>
                {profile.id === default_profile_id && (
                  <Star size={14} className="text-yellow-500 fill-current" />
                )}
              </div>
              <div className="profile-details text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span className="shell-type">{profile.shell_type}</span>
                {profile.shell_path && (
                  <span className="shell-path"> • {profile.shell_path}</span>
                )}
                {profile.shell_args && (
                  <span className="shell-args"> • args: {profile.shell_args.join(' ')}</span>
                )}
              </div>
            </div>
            
            <div className="profile-actions flex items-center space-x-2">
              {profile.id !== default_profile_id && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => set_as_default(profile.id)}
                  title="Set as default"
                >
                  <Star size={14} />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => start_editing(profile)}
                title="Edit profile"
              >
                <Edit size={14} />
              </Button>
              
              {profiles.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => delete_profile(profile.id)}
                  title="Delete profile"
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}