import TodoItem from './TodoItem';
import AddTodo from './AddTodo';

interface Todo {
  id: string;
  title: string;
  is_done: boolean;
}

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (text: string) => void;
  onEdit: (id: string, newText: string) => void;
}

export default function TodoList({ todos, onToggle, onDelete, onAdd, onEdit }: TodoListProps) {
  return (
    <div className="max-w-2xl mx-auto p-6 ">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">My Todo List</h1>
        <p className="text-gray-600">Stay organized and get things done</p>
      </div>
      <AddTodo onAdd={onAdd} />
      <div className="space-y-3 mt-6">
        {todos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-500 text-lg">No todos yet. Add one above!</p>
          </div>
        ) : (
          todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </div>
  );
}