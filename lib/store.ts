import { create } from 'zustand'

export type Vote = {
  userId: string
  value: number | null
}

export type Task = {
  id: string
  title: string
  votes: Vote[]
  revealed: boolean
  finalEstimate?: number
  createdAt: Date
}

export type Session = {
  facilitatorId: string | null
  currentTask: Task | null
  tasks: Task[]
  participants: {
    id: string
    name: string
  }[]
}

type Store = {
  session: Session | null
  userId: string
  userName: string
  setUserName: (name: string) => void
  createSession: () => void
  joinSession: (userName: string) => void
  becomeFacilitator: () => void
  vote: (value: number) => void
  revealVotes: () => void
  resetVoting: () => void
  createTask: (title: string) => void
  selectTask: (taskId: string) => void
}

// Generate a random user ID
const generateUserId = () => Math.random().toString(36).substring(2, 15)

export const useStore = create<Store>((set) => ({
  session: null,
  userId: generateUserId(),
  userName: '',
  
  setUserName: (name) => set({ userName: name }),
  
  createSession: () => set({
    session: {
      facilitatorId: null,
      currentTask: null,
      tasks: [],
      participants: []
    }
  }),
  
  joinSession: (userName) => set((state) => {
    if (!state.session) return state

    const newParticipant = {
      id: state.userId,
      name: userName
    }

    return {
      session: {
        ...state.session,
        participants: [...state.session.participants, newParticipant]
      }
    }
  }),

  becomeFacilitator: () => set((state) => {
    if (!state.session) return state

    return {
      session: {
        ...state.session,
        facilitatorId: state.userId
      }
    }
  }),

  vote: (value) => set((state) => {
    if (!state.session?.currentTask) return state

    const vote: Vote = {
      userId: state.userId,
      value
    }

    return {
      session: {
        ...state.session,
        currentTask: {
          ...state.session.currentTask,
          votes: [...state.session.currentTask.votes.filter(v => v.userId !== state.userId), vote]
        }
      }
    }
  }),

  revealVotes: () => set((state) => {
    if (!state.session?.currentTask) return state

    return {
      session: {
        ...state.session,
        currentTask: {
          ...state.session.currentTask,
          revealed: true
        }
      }
    }
  }),

  resetVoting: () => set((state) => {
    if (!state.session?.currentTask) return state

    return {
      session: {
        ...state.session,
        currentTask: {
          ...state.session.currentTask,
          votes: [],
          revealed: false
        }
      }
    }
  }),

  createTask: (title) => set((state) => {
    if (!state.session) return state

    const newTask: Task = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      votes: [],
      revealed: false,
      createdAt: new Date()
    }

    return {
      session: {
        ...state.session,
        tasks: [...state.session.tasks, newTask],
        currentTask: newTask
      }
    }
  }),

  selectTask: (taskId) => set((state) => {
    if (!state.session) return state

    const task = state.session.tasks.find(t => t.id === taskId)
    if (!task) return state

    return {
      session: {
        ...state.session,
        currentTask: {
          ...task,
          votes: [],
          revealed: false
        }
      }
    }
  })
}))