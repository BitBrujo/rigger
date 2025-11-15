'use client';

import { useEffect } from 'react';
import { useAgentStore } from '@/lib/store';
import { ApiClient } from '@/lib/api-client';
import { TodoList } from '@/lib/types';
import { CheckCircle2, Circle, Clock, ListTodo, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

export function TodoPanel() {
  const { todoLists, setTodoLists, removeTodoList } = useAgentStore();

  // Load todos on mount
  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const lists = await ApiClient.getTodos();
      setTodoLists(lists);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await ApiClient.deleteTodo(id);
      removeTodoList(id);
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500">In Progress</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const calculateProgress = (list: TodoList) => {
    const total = list.items.length;
    const completed = list.items.filter((item) => item.status === 'completed').length;
    return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  if (todoLists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ListTodo className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Todos Yet</h3>
        <p className="text-sm text-gray-500 max-w-md">
          When the agent uses the TodoWrite tool to create task lists, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {todoLists.map((list) => {
          const progress = calculateProgress(list);
          return (
            <Card key={list.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ListTodo className="h-4 w-4" />
                      {list.title || `Todo List #${list.id}`}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Created: {new Date(list.createdAt).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(list.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium">
                      {progress.completed}/{progress.total} ({Math.round(progress.percentage)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  {list.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="mt-0.5">{getStatusIcon(item.status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm ${
                              item.status === 'completed'
                                ? 'line-through text-gray-500'
                                : 'text-gray-900'
                            }`}
                          >
                            {item.status === 'in_progress' && item.activeForm
                              ? item.activeForm
                              : item.content}
                          </p>
                          {getStatusBadge(item.status)}
                        </div>
                        {item.status === 'in_progress' && item.activeForm && (
                          <p className="text-xs text-gray-500 mt-1">
                            Original: {item.content}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
