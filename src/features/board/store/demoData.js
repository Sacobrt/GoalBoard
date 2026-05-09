import { useBoardStore } from "./boardStore";
import { useKanbanStore } from "../../kanban/store/kanbanStore";

const uuid = () => crypto.randomUUID();

export function seedDemoProject(userId) {
    const boardStore = useBoardStore.getState();
    const kanbanStore = useKanbanStore.getState();

    const now = new Date().toISOString();
    const boardId = uuid();

    const colBacklogId = uuid();
    const colTodoId = uuid();
    const colProgressId = uuid();
    const colReviewId = uuid();
    const colDoneId = uuid();

    const prioLowId = uuid();
    const prioMedId = uuid();
    const prioHighId = uuid();

    // Create the Demo Board
    const demoBoard = {
        id: boardId,
        name: "🚀 Product Launch (Demo)",
        ownerId: userId,
        members: [{ userId: userId, role: "owner" }],
        budget: 25000,
        columns: [
            { id: colBacklogId, title: "Backlog", order: 0, color: "#64748b", isDone: false },
            { id: colTodoId, title: "To Do", order: 1, color: "#cbd5e1", isDone: false },
            { id: colProgressId, title: "In Progress", order: 2, color: "#3b82f6", isDone: false },
            { id: colReviewId, title: "Review", order: 3, color: "#f59e0b", isDone: false },
            { id: colDoneId, title: "Done", order: 4, color: "#10b981", isDone: true },
        ],
        priorities: [
            { id: prioLowId, label: "Low Priority", color: "#64748b", order: 0 },
            { id: prioMedId, label: "Medium", color: "#f59e0b", order: 1 },
            { id: prioHighId, label: "Urgent", color: "#ef4444", order: 2 },
        ],
        createdAt: now,
        updatedAt: now,
    };

    // Helper to generate dates
    const daysAgo = (d) => {
        const date = new Date();
        date.setDate(date.getDate() - d);
        return date.toISOString();
    };
    const daysFromNow = (d) => {
        const date = new Date();
        date.setDate(date.getDate() + d);
        return date.toISOString();
    };

    // Create Demo Tasks
    const demoTasks = [
        {
            id: uuid(),
            boardId,
            userId,
            title: "Market Research Analysis",
            description: "Analyze competitor pricing and feature parity.\n\n- [x] Gather data\n- [x] Create comparison matrix\n- [ ] Draft final report",
            columnId: colDoneId,
            priorityIds: [prioHighId],
            assigneeIds: [userId],
            dueDate: daysAgo(5),
            cost: 1500,
            completedAt: daysAgo(2),
            archived: false,
            createdAt: daysAgo(10),
        },
        {
            id: uuid(),
            boardId,
            userId,
            title: "Design Landing Page Mockups",
            description: "Create high-fidelity mockups for the new product landing page in Figma. Need to ensure mobile responsiveness.",
            columnId: colDoneId,
            priorityIds: [prioMedId],
            assigneeIds: [userId],
            dueDate: daysAgo(1),
            cost: 2400,
            completedAt: daysAgo(1),
            archived: false,
            createdAt: daysAgo(8),
        },
        {
            id: uuid(),
            boardId,
            userId,
            title: "Setup CI/CD Pipeline",
            description: "Configure GitHub Actions to automate testing and deployment to staging environment.",
            columnId: colReviewId,
            priorityIds: [prioHighId],
            assigneeIds: [userId],
            dueDate: daysFromNow(2),
            cost: 1800,
            completedAt: null,
            archived: false,
            createdAt: daysAgo(4),
        },
        {
            id: uuid(),
            boardId,
            userId,
            title: "Write API Documentation",
            description: "Document the new v2 REST API endpoints using Swagger. Include examples for standard requests and error responses.",
            columnId: colProgressId,
            priorityIds: [prioMedId],
            assigneeIds: [userId],
            dueDate: daysFromNow(5),
            cost: 800,
            completedAt: null,
            archived: false,
            createdAt: daysAgo(2),
        },
        {
            id: uuid(),
            boardId,
            userId,
            title: "Implement Authentication Flow",
            description: "Integrate JWT based authentication on the backend and wire up login/register flows on frontend.",
            columnId: colProgressId,
            priorityIds: [prioHighId],
            assigneeIds: [userId],
            dueDate: daysFromNow(3),
            cost: 3500,
            completedAt: null,
            archived: false,
            createdAt: daysAgo(1),
        },
        {
            id: uuid(),
            boardId,
            userId,
            title: "Record Promo Video",
            description: "Shoot and edit the 60-second promotional video for social media channels.",
            columnId: colTodoId,
            priorityIds: [prioMedId],
            assigneeIds: [userId],
            dueDate: daysFromNow(10),
            cost: 4500,
            completedAt: null,
            archived: false,
            createdAt: now,
        },
        {
            id: uuid(),
            boardId,
            userId,
            title: "Draft Email Sequence",
            description: "Write the 5-part onboarding email sequence for new signups.",
            columnId: colTodoId,
            priorityIds: [prioLowId],
            assigneeIds: [userId],
            dueDate: daysFromNow(7),
            cost: 600,
            completedAt: null,
            archived: false,
            createdAt: now,
        },
        {
            id: uuid(),
            boardId,
            userId,
            title: "SEO Optimization",
            description: "Optimize meta tags and test page load speed for the main marketing site.",
            columnId: colBacklogId,
            priorityIds: [prioMedId],
            assigneeIds: [],
            dueDate: null,
            cost: 900,
            completedAt: null,
            archived: false,
            createdAt: now,
        },
        {
            id: uuid(),
            boardId,
            userId,
            title: "Prepare Investor Deck",
            description: "Update the pitch deck with Q3 metrics and the new product roadmap.",
            columnId: colBacklogId,
            priorityIds: [prioHighId],
            assigneeIds: [userId],
            dueDate: daysFromNow(20),
            cost: 1200,
            completedAt: null,
            archived: false,
            createdAt: now,
        },
    ];

    // Inject directly into Zustand stores
    useBoardStore.setState((state) => ({
        boards: [demoBoard, ...state.boards],
    }));

    useKanbanStore.setState((state) => ({
        tasks: [...demoTasks, ...state.tasks],
    }));

    return boardId;
}
