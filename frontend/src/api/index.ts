import type { GroupMember, StudyActivity, StudyGroup, Subject, Subscription } from '../types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `Erro ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const api = {
  groups: {
    list: () => request<StudyGroup[]>('/groups'),
    create: (name: string, members: GroupMember[]) =>
      request<StudyGroup>('/groups', {
        method: 'POST',
        body: JSON.stringify({ name, members }),
      }),
  },

  subjects: {
    list: () => request<Subject[]>('/subjects'),
    create: (data: { title: string; teacher: string; schedule: string }) =>
      request<Subject>('/subjects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    toggleGroup: (subjectId: string, groupId: string) =>
      request<{ id: string; groupIds: string[] }>(`/subjects/${subjectId}/groups`, {
        method: 'PATCH',
        body: JSON.stringify({ groupId }),
      }),
  },

  activities: {
    list: () => request<StudyActivity[]>('/activities'),
    create: (data: {
      title: string
      subjectId: string
      groupId: string
      dueDate: string
      description?: string
    }) =>
      request<StudyActivity>('/activities', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  subscription: {
    get: () => request<Subscription>('/subscription'),
    update: (data: Partial<Subscription>) =>
      request<Subscription>('/subscription', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
}
