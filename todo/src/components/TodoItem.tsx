import { Check, Trash2, Edit3, Save, X } from 'lucide-react';
import { useState } from 'react';

interface Todo {
  id: string;
  title: string;
  is_done: boolean;
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
}

export default function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.title);

  const handleEdit = () => {
    if (isEditing) {
      if (editText.trim()) {
        onEdit(todo.id, editText.trim());
      }
      setIsEditing(false);
    } else {
      setEditText(todo.title);
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setEditText(todo.title);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group">
      <button
        onClick={() => onToggle(todo.id)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          todo.is_done
            ? 'bg-green-500 border-green-500 hover:bg-green-600'
            : 'border-gray-300 hover:border-green-400'
        }`}
      >
        {todo.is_done && <Check size={14} className="text-white" />}
      </button>
      {isEditing ? (
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 text-lg border-none outline-none bg-transparent text-gray-800"
          autoFocus
        />
      ) : (
        <span
          className={`flex-1 text-lg transition-all duration-200 ${
            todo.is_done
              ? 'line-through text-gray-400'
              : 'text-gray-800 group-hover:text-gray-900'
          }`}
        >
          {todo.title}
        </span>
      )}
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {isEditing ? (
          <>
            <button
              onClick={handleEdit}
              className="text-green-500 hover:text-green-700 p-2 rounded-lg hover:bg-green-50"
            >
              <Save size={18} />
            </button>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-50"
            >
              <X size={18} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50"
          >
            <Edit3 size={18} />
          </button>
        )}
        <button
          onClick={() => onDelete(todo.id)}
          className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}