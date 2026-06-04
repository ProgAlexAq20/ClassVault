Usage examples for newly added Firestore services and hooks

1) Create a task from a React component using `useTasks`:

```ts
import { useTasks } from "@/modules/tasks/hooks/use-tasks";

function NewTaskForm() {
  const { createTask } = useTasks();

  async function submit() {
    await createTask({
      classroomId: "CLASS_1",
      subjectId: "SUBJ_1",
      title: "Estudar cap 5",
      description: "Exercícios",
      dueDate: "2026-06-10",
      priority: "high"
    });
  }
}
```

2) Create an AI message from a component using `useAi`:

```ts
import { useAi } from "@/modules/ai/hooks/use-ai";

function ChatInput({ userId, conversationId }) {
  const { createAiMessage } = useAi();

  async function send(text: string) {
    await createAiMessage(userId, conversationId, "user", text);
  }
}
```

3) Quick manual tests (Node/REPL) using the service directly:

```ts
import { createTask } from "./src/modules/tasks/services/task.service";
import { createAiMessage } from "./src/modules/ai/services/ai.service";

await createTask("USER_UID", "SUBJ_1", { title: "Teste" });
await createAiMessage("USER_UID", "CONV_1", "user", "Olá");
```

Run these in the app context (browser) where `firebaseApp` is initialized, or adapt to server-side with proper credentials.
