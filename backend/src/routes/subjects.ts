import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../db.js'
import type { Subject } from '../types.js'

const router = Router()

router.get('/', (_req, res) => {
  const subjects = db.prepare('SELECT id, title, teacher, schedule FROM subjects ORDER BY title').all() as Array<{
    id: string
    title: string
    teacher: string
    schedule: string
  }>
  const links = db.prepare('SELECT subject_id, group_id FROM subject_groups').all() as Array<{
    subject_id: string
    group_id: string
  }>

  const result: Subject[] = subjects.map((subject) => ({
    id: subject.id,
    title: subject.title,
    teacher: subject.teacher,
    schedule: subject.schedule,
    groupIds: links.filter((l) => l.subject_id === subject.id).map((l) => l.group_id),
  }))

  res.json(result)
})

router.post('/', (req, res) => {
  const { title, teacher, schedule } = req.body as {
    title?: string
    teacher?: string
    schedule?: string
  }

  if (!title?.trim() || !teacher?.trim() || !schedule?.trim()) {
    res.status(400).json({ error: 'Disciplina, professor e horário são obrigatórios' })
    return
  }

  const id = randomUUID()
  db.prepare('INSERT INTO subjects (id, title, teacher, schedule) VALUES (?, ?, ?, ?)').run(
    id,
    title.trim(),
    teacher.trim(),
    schedule.trim(),
  )

  res.status(201).json({
    id,
    title: title.trim(),
    teacher: teacher.trim(),
    schedule: schedule.trim(),
    groupIds: [],
  })
})

router.patch('/:id/groups', (req, res) => {
  const { id } = req.params
  const { groupId } = req.body as { groupId?: string }

  if (!groupId) {
    res.status(400).json({ error: 'groupId é obrigatório' })
    return
  }

  const subject = db.prepare('SELECT id FROM subjects WHERE id = ?').get(id)
  if (!subject) {
    res.status(404).json({ error: 'Matéria não encontrada' })
    return
  }

  const existing = db
    .prepare('SELECT 1 FROM subject_groups WHERE subject_id = ? AND group_id = ?')
    .get(id, groupId)

  if (existing) {
    db.prepare('DELETE FROM subject_groups WHERE subject_id = ? AND group_id = ?').run(id, groupId)
  } else {
    db.prepare('INSERT INTO subject_groups (subject_id, group_id) VALUES (?, ?)').run(id, groupId)
  }

  const groupIds = db
    .prepare('SELECT group_id FROM subject_groups WHERE subject_id = ?')
    .all(id) as Array<{ group_id: string }>

  res.json({ id, groupIds: groupIds.map((g) => g.group_id) })
})

export default router
