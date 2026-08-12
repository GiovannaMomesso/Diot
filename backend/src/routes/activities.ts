import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../db.js'
import type { ActivityStatus, StudyActivity } from '../types.js'

const router = Router()

router.get('/', (_req, res) => {
  const rows = db
    .prepare(
      'SELECT id, title, subject_id, group_id, due_date, description, status FROM activities ORDER BY due_date',
    )
    .all() as Array<{
    id: string
    title: string
    subject_id: string
    group_id: string
    due_date: string
    description: string
    status: ActivityStatus
  }>

  const result: StudyActivity[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    subjectId: row.subject_id,
    groupId: row.group_id,
    dueDate: row.due_date,
    description: row.description,
    status: row.status,
  }))

  res.json(result)
})

router.post('/', (req, res) => {
  const { title, subjectId, groupId, dueDate, description } = req.body as {
    title?: string
    subjectId?: string
    groupId?: string
    dueDate?: string
    description?: string
  }

  if (!title?.trim() || !subjectId || !groupId || !dueDate) {
    res.status(400).json({ error: 'Título, disciplina, grupo e prazo são obrigatórios' })
    return
  }

  const id = randomUUID()
  const status: ActivityStatus = 'Planejada'
  const desc = description?.trim() || 'Sem descrição adicional.'

  db.prepare(
    'INSERT INTO activities (id, title, subject_id, group_id, due_date, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(id, title.trim(), subjectId, groupId, dueDate, desc, status)

  res.status(201).json({
    id,
    title: title.trim(),
    subjectId,
    groupId,
    dueDate,
    description: desc,
    status,
  })
})

export default router
