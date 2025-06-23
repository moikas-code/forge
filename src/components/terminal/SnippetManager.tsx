'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Edit3, Trash2, Copy, Search, Tag, Star, Clock } from 'lucide-react';
import { useTerminalPersistenceStore, CommandSnippet } from '@/stores/terminalPersistenceStore';
import { Button } from '@/components/ui/button';

interface SnippetManagerProps {
  className?: string;
  is_embedded?: boolean;
}

interface SnippetFormData {
  name: string;
  description: string;
  command: string;
  category: string;
  tags: string[];
}

export function SnippetManager({ className, is_embedded = false }: SnippetManagerProps) {
  const [search_query, set_search_query] = useState('');
  const [selected_category, set_selected_category] = useState<string>('All');
  const [is_form_open, set_is_form_open] = useState(false);
  const [editing_snippet, set_editing_snippet] = useState<CommandSnippet | null>(null);
  const [form_data, set_form_data] = useState<SnippetFormData>({
    name: '',
    description: '',
    command: '',
    category: 'Custom',
    tags: [],
  });

  const {
    snippets,
    snippet_categories,
    add_snippet,
    update_snippet,
    delete_snippet,
    increment_snippet_usage,
    search_snippets,
    get_snippets_by_category,
  } = useTerminalPersistenceStore();

  // Filter snippets based on search and category
  const filtered_snippets = useMemo(() => {
    let result = snippets;

    if (search_query.trim()) {
      result = search_snippets(search_query);
    }

    if (selected_category !== 'All') {
      result = result.filter(s => s.category === selected_category);
    }

    // Sort by usage count (descending) and then by name
    return result.sort((a, b) => {
      if (a.usage_count !== b.usage_count) {
        return b.usage_count - a.usage_count;
      }
      return a.name.localeCompare(b.name);
    });
  }, [snippets, search_query, selected_category, search_snippets]);

  // Get categories with counts
  const categories_with_counts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    snippets.forEach(snippet => {
      counts[snippet.category] = (counts[snippet.category] || 0) + 1;
    });

    return [
      { name: 'All', count: snippets.length },
      ...snippet_categories.map(cat => ({
        name: cat,
        count: counts[cat] || 0,
      })),
    ];
  }, [snippets, snippet_categories]);

  const handle_form_submit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form_data.name.trim() || !form_data.command.trim()) {
      return;
    }

    if (editing_snippet) {
      update_snippet(editing_snippet.id, {
        name: form_data.name.trim(),
        description: form_data.description.trim(),
        command: form_data.command.trim(),
        category: form_data.category,
        tags: form_data.tags,
      });
    } else {
      add_snippet({
        name: form_data.name.trim(),
        description: form_data.description.trim(),
        command: form_data.command.trim(),
        category: form_data.category,
        tags: form_data.tags,
        is_custom: true,
      });
    }

    // Reset form
    set_form_data({
      name: '',
      description: '',
      command: '',
      category: 'Custom',
      tags: [],
    });
    set_editing_snippet(null);
    set_is_form_open(false);
  };

  const handle_edit_snippet = (snippet: CommandSnippet) => {
    set_form_data({
      name: snippet.name,
      description: snippet.description,
      command: snippet.command,
      category: snippet.category,
      tags: snippet.tags,
    });
    set_editing_snippet(snippet);
    set_is_form_open(true);
  };

  const handle_delete_snippet = (id: string) => {
    if (confirm('Are you sure you want to delete this snippet?')) {
      delete_snippet(id);
    }
  };

  const handle_copy_command = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      console.log('Command copied to clipboard');
    } catch (error) {
      console.error('Failed to copy command:', error);
    }
  };

  const handle_tags_change = (tags_string: string) => {
    const tags = tags_string
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    set_form_data(prev => ({ ...prev, tags }));
  };

  const cancel_form = () => {
    set_form_data({
      name: '',
      description: '',
      command: '',
      category: 'Custom',
      tags: [],
    });
    set_editing_snippet(null);
    set_is_form_open(false);
  };

  return (
    <div className={`snippet-manager ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Command Snippets
        </h2>
        <Button
          onClick={() => set_is_form_open(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Snippet
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search snippets..."
            value={search_query}
            onChange={(e) => set_search_query(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories_with_counts.map(category => (
            <button
              key={category.name}
              onClick={() => set_selected_category(category.name)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selected_category === category.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Snippet Form */}
      {is_form_open && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            {editing_snippet ? 'Edit Snippet' : 'Create New Snippet'}
          </h3>
          
          <form onSubmit={handle_form_submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={form_data.name}
                  onChange={(e) => set_form_data(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Git Status"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={form_data.category}
                  onChange={(e) => set_form_data(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {snippet_categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <input
                type="text"
                value={form_data.description}
                onChange={(e) => set_form_data(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of what this command does"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Command
              </label>
              <textarea
                required
                value={form_data.command}
                onChange={(e) => set_form_data(prev => ({ ...prev, command: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="e.g., git status"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use variables like ${'{variable_name}'} for dynamic values
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={form_data.tags.join(', ')}
                onChange={(e) => handle_tags_change(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., git, version control, status"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
                {editing_snippet ? 'Update' : 'Create'} Snippet
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={cancel_form}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Snippets List */}
      <div className="space-y-3">
        {filtered_snippets.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No snippets found</p>
            <p className="text-sm mt-1">
              {search_query ? 'Try a different search term' : 'Create your first snippet to get started'}
            </p>
          </div>
        ) : (
          filtered_snippets.map(snippet => (
            <div
              key={snippet.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {snippet.name}
                    </h3>
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                      {snippet.category}
                    </span>
                    {snippet.usage_count > 0 && (
                      <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        {snippet.usage_count} uses
                      </span>
                    )}
                  </div>
                  
                  {snippet.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {snippet.description}
                    </p>
                  )}
                  
                  <div className="bg-gray-50 dark:bg-gray-900 rounded px-3 py-2 mb-2">
                    <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
                      {snippet.command}
                    </code>
                  </div>
                  
                  {snippet.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {snippet.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handle_copy_command(snippet.command)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  
                  {snippet.is_custom && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handle_edit_snippet(snippet)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handle_delete_snippet(snippet.id)}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}