import React, { useState } from 'react';
import { use_file_explorer_store } from '@/stores/fileExplorerStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Home,
  ChevronRight,
  Edit2,
  Check,
  X,
  Star,
  Heart
} from 'lucide-react';

export function PathBreadcrumb() {
  const [is_editing, set_is_editing] = useState(false);
  const [edit_path, set_edit_path] = useState('');
  
  const {
    current_directory,
    favorites,
    navigate_to_directory,
    add_favorite,
    remove_favorite,
  } = use_file_explorer_store();

  const path_segments = current_directory.split('/').filter(Boolean);
  const is_favorited = favorites.some(f => f.path === current_directory);

  const handle_segment_click = (index: number) => {
    if (index === -1) {
      // Root click
      navigate_to_directory('/');
    } else {
      const path = '/' + path_segments.slice(0, index + 1).join('/');
      navigate_to_directory(path);
    }
  };

  const handle_edit_start = () => {
    set_edit_path(current_directory);
    set_is_editing(true);
  };

  const handle_edit_save = () => {
    if (edit_path.trim()) {
      navigate_to_directory(edit_path.trim());
    }
    set_is_editing(false);
  };

  const handle_edit_cancel = () => {
    set_is_editing(false);
    set_edit_path('');
  };

  const handle_edit_key_down = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handle_edit_save();
    } else if (e.key === 'Escape') {
      handle_edit_cancel();
    }
  };

  const handle_favorite_toggle = () => {
    if (is_favorited) {
      const favorite = favorites.find(f => f.path === current_directory);
      if (favorite) {
        remove_favorite(favorite.id);
      }
    } else {
      add_favorite(current_directory);
    }
  };

  const handle_favorite_navigate = (path: string) => {
    navigate_to_directory(path);
  };

  return (
    <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30">
      {/* Favorites Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Star className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => handle_favorite_navigate('/')}>
            <Home className="h-4 w-4 mr-2" />
            Root
          </DropdownMenuItem>
          {favorites.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {favorites.map((favorite) => (
                <DropdownMenuItem
                  key={favorite.id}
                  onClick={() => handle_favorite_navigate(favorite.path)}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  {favorite.name}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Path Display/Edit */}
      <div className="flex-1 flex items-center gap-1">
        {is_editing ? (
          <div className="flex-1 flex items-center gap-1">
            <input
              type="text"
              value={edit_path}
              onChange={(e) => set_edit_path(e.target.value)}
              onKeyDown={handle_edit_key_down}
              className="flex-1 px-2 py-1 text-sm border border-input rounded bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <Button variant="ghost" size="sm" onClick={handle_edit_save}>
              <Check className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handle_edit_cancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-1 overflow-hidden">
            {/* Root */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handle_segment_click(-1)}
              className="flex-shrink-0"
            >
              <Home className="h-4 w-4" />
            </Button>

            {/* Path segments */}
            {path_segments.map((segment, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handle_segment_click(index)}
                  className="text-sm font-normal flex-shrink-0 max-w-32 truncate"
                  title={segment}
                >
                  {segment}
                </Button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handle_edit_start}
          title="Edit Path"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handle_favorite_toggle}
          title={is_favorited ? 'Remove from Favorites' : 'Add to Favorites'}
          className={is_favorited ? 'text-yellow-500' : ''}
        >
          {is_favorited ? <Heart className="h-4 w-4 fill-current" /> : <Heart className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

PathBreadcrumb.displayName = 'PathBreadcrumb';