export type GroupMember = {
  name: string
  role: string
}

export type StudyGroup = {
  id: string
  name: string
  members: GroupMember[]
}

export type Subject = {
  id: string
  title: string
  teacher: string
  schedule: string
  groupIds: string[]
}

export type StudyActivity = {
  id: string
  title: string
  subjectId: string
  groupId: string
  dueDate: string
  description: string
  status: 'Planejada' | 'Em andamento' | 'Finalizada'
}

export type Subscription = {
  planId: string
  separateBilling: boolean
}
