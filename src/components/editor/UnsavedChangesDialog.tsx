'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Save, X, FileText } from 'lucide-react';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  fileName?: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export function UnsavedChangesDialog({
  isOpen,
  fileName = 'Untitled',
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Unsaved Changes</span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes in <strong>{fileName}</strong>. 
            What would you like to do with your changes?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </Button>
          <Button
            variant="destructive"
            onClick={onDiscard}
            className="flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Discard Changes</span>
          </Button>
          <Button
            onClick={onSave}
            className="flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}