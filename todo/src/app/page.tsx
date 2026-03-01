"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TodoList from '../components/TodoList';
import { supabase } from '@/lib/supabase';
import { User, LogOut, CheckSquare, Square } from 'lucide-react';

interface Todo {
  id: string;
  title: string;
  is_done: boolean;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchTodos = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setTodos(data.map(d => ({ id: d.id, title: d.title, is_done: d.is_done })));
    setLoading(false);
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/login');
    else fetchTodos();
  }, [session, status, router]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTodo = async (text: string) => {
    if (!session?.user?.id) return;
    const { data, error } = await supabase.from('todos').insert({ user_id: session.user.id, title: text, is_done: false }).select();
    if (!error && data) setTodos(prev => [data[0], ...prev]);
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    await supabase.from('todos').update({ is_done: !todo.is_done }).eq('id', id);
    setTodos(prev => prev.map(t => t.id === id ? { ...t, is_done: !t.is_done } : t));
  };

  const deleteTodo = async (id: string) => {
    await supabase.from('todos').delete().eq('id', id);
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const editTodo = async (id: string, newText: string) => {
    await supabase.from('todos').update({ title: newText }).eq('id', id);
    setTodos(prev => prev.map(t => t.id === id ? { ...t, title: newText } : t));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-pink-100 to-yellow-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-100 via-pink-100 to-yellow-100 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute -top-40 -left-40 h-96 w-96 bg-indigo-300/40 rounded-full blur-3xl" />
      <div className="absolute top-1/3 -right-40 h-96 w-96 bg-pink-300/40 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 h-72 w-72 bg-yellow-200/40 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <header className="mb-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-pink-500 to-amber-500 bg-clip-text text-transparent mb-2">
                My Tasks
              </h1>
              <p className="text-slate-600">Stay organized and productive ✨</p>
            </div>
            <div className="flex items-center gap-6 relative z-50">
              {/* Stats cards */}
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/60 shadow-lg">
                <Square className="text-indigo-500" />
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold text-indigo-600">{todos.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/60 shadow-lg">
                <CheckSquare className="text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-xl font-bold text-green-600">{todos.filter(t => t.is_done).length}</p>
                </div>
              </div>

              {/* Avatar */}
              <div className="relative z-50" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md"
                >
                  <img src={session.user?.image ?? ''} alt="avatar" className="w-full h-full object-cover" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-gray-800">{session.user?.name}</p>
                      <p className="text-sm text-gray-500">{session.user?.email}</p>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Todo List */}
        <main className="max-w-4xl mx-auto relative z-10">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.15)] p-8 border border-white/60">
            <TodoList
              todos={todos}
              onAdd={addTodo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onEdit={editTodo}
              
            />
          </div>
        </main>
      </div>
    </div>
  );
}