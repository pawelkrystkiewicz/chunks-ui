export type TaskStatus = "backlog" | "in-progress" | "in-review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: TeamMember;
  dueDate: string;
  tags: string[];
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  email: string;
  tasksCompleted: number;
  tasksTotal: number;
};

export type Activity = {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
};

const alice: TeamMember = {
  id: "u1",
  name: "Alice Chen",
  role: "Lead Engineer",
  email: "alice@acme.dev",
  tasksCompleted: 24,
  tasksTotal: 28,
  avatar: "/jane.jpeg",
};

const bob: TeamMember = {
  id: "u2",
  name: "Bob Rivera",
  role: "Designer",
  email: "bob@acme.dev",
  tasksCompleted: 12,
  tasksTotal: 15,
};

const carol: TeamMember = {
  id: "u3",
  name: "Carl Zhang",
  role: "Backend Engineer",
  email: "carol@acme.dev",
  tasksCompleted: 18,
  tasksTotal: 22,
  avatar: "/bro2.jpeg",
};

const dan: TeamMember = {
  id: "u4",
  name: "Dan Kowalski",
  role: "Frontend Engineer",
  email: "dan@acme.dev",
  tasksCompleted: 9,
  tasksTotal: 16,
  avatar: "/bro.jpeg",
};

const eve: TeamMember = {
  id: "u5",
  name: "Eve Nakamura",
  role: "PM",
  email: "eve@acme.dev",
  tasksCompleted: 31,
  tasksTotal: 34,
};

export const TEAM: TeamMember[] = [alice, bob, carol, dan, eve];

export const TASKS: Task[] = [
  {
    id: "TSK-001",
    title: "Implement user authentication flow",
    status: "done",
    priority: "critical",
    assignee: alice,
    dueDate: "2026-03-05",
    tags: ["auth", "backend"],
  },
  {
    id: "TSK-002",
    title: "Design dashboard layout",
    status: "done",
    priority: "high",
    assignee: bob,
    dueDate: "2026-03-08",
    tags: ["design", "ui"],
  },
  {
    id: "TSK-003",
    title: "Set up CI/CD pipeline",
    status: "in-review",
    priority: "high",
    assignee: carol,
    dueDate: "2026-03-12",
    tags: ["devops"],
  },
  {
    id: "TSK-004",
    title: "Build notification system",
    status: "in-progress",
    priority: "medium",
    assignee: dan,
    dueDate: "2026-03-15",
    tags: ["feature", "frontend"],
  },
  {
    id: "TSK-005",
    title: "Write API documentation",
    status: "in-progress",
    priority: "medium",
    assignee: eve,
    dueDate: "2026-03-18",
    tags: ["docs"],
  },
  {
    id: "TSK-006",
    title: "Optimize database queries",
    status: "backlog",
    priority: "high",
    assignee: carol,
    dueDate: "2026-03-22",
    tags: ["backend", "performance"],
  },
  {
    id: "TSK-007",
    title: "Add dark mode support",
    status: "backlog",
    priority: "low",
    assignee: bob,
    dueDate: "2026-03-25",
    tags: ["design", "frontend"],
  },
  {
    id: "TSK-008",
    title: "Implement file upload component",
    status: "in-progress",
    priority: "critical",
    assignee: alice,
    dueDate: "2026-03-10",
    tags: ["feature", "frontend"],
  },
];

export const ACTIVITIES: Activity[] = [
  {
    id: "a1",
    user: "Alice Chen",
    action: "completed",
    target: "TSK-001 Implement user authentication flow",
    time: "2 hours ago",
  },
  {
    id: "a2",
    user: "Bob Rivera",
    action: "uploaded designs for",
    target: "TSK-002 Design dashboard layout",
    time: "4 hours ago",
  },
  {
    id: "a3",
    user: "Carol Zhang",
    action: "opened review on",
    target: "TSK-003 Set up CI/CD pipeline",
    time: "5 hours ago",
  },
  {
    id: "a4",
    user: "Eve Nakamura",
    action: "commented on",
    target: "TSK-005 Write API documentation",
    time: "yesterday",
  },
  {
    id: "a5",
    user: "Dan Kowalski",
    action: "started working on",
    target: "TSK-004 Build notification system",
    time: "yesterday",
  },
];

export const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "in-progress", label: "In Progress" },
  { value: "in-review", label: "In Review" },
  { value: "done", label: "Done" },
];

export const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export const FAQ_ITEMS = [
  {
    value: "faq-1",
    question: "How do I invite team members?",
    answer:
      "Go to the Team tab, click the 'Invite Member' button, and enter their email address. They'll receive an invitation link.",
  },
  {
    value: "faq-2",
    question: "Can I export task data?",
    answer:
      "Yes. Use the menu on the top-right of the task table to export as CSV or JSON. Filters are applied to the export.",
  },
  {
    value: "faq-3",
    question: "What are the keyboard shortcuts?",
    answer:
      "Press Ctrl+K to open the command palette. From there you can search tasks, switch views, or trigger actions without touching the mouse.",
  },
  {
    value: "faq-4",
    question: "How does the notification system work?",
    answer:
      "Notifications are sent for task assignments, status changes, mentions in comments, and approaching due dates. Configure preferences in Settings.",
  },
];
