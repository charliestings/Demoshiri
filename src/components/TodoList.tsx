import TodoItem from './TodoItem';
import AddTodo from './AddTodo';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onAdd: (text: string) => void;
}

export default function TodoList({ todos, onToggle, onDelete, onAdd }: TodoListProps) {
  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">Todo App</h1>
      <AddTodo onAdd={onAdd} />
      <div className="space-y-2">
        {todos.length === 0 ? (
          <p className="text-gray-500 text-center">No todos yet. Add one above!</p>
        ) : (
          todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}