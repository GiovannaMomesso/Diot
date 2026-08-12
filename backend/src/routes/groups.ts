import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../db.js'
import type { GroupMember, StudyGroup } from '../types.js'

const router = Router()

router.get('/', (_req, res) => {
  const groups = db.prepare('SELECT id, name FROM study_groups ORDER BY name').all() as Array<{ id: string; name: string }>
  const members = db.prepare('SELECT group_id, name, role FROM group_members').all() as Array<{
    group_id: string
    name: string
    role: string
  }>

  const result: StudyGroup[] = groups.map((group) => ({
    id: group.id,
    name: group.name,
    members: members
      .filter((m) => m.group_id === group.id)
      .map((m) => ({ name: m.name, role: m.role })),
  }))

  res.json(result)
})

router.post('/', (req, res) => {
  const { name, members } = req.body as { name?: string; members?: GroupMember[] }

  if (!name?.trim()) {
    res.status(400).json({ error: 'Nome do grupo é obrigatório' })
    return
  }

  const id = randomUUID()
  const insertGroup = db.prepare('INSERT INTO study_groups (id, name) VALUES (?, ?)')
  const insertMember = db.prepare('INSERT INTO group_members (id, group_id, name, role) VALUES (?, ?, ?, ?)')

  const create = db.transaction(() => {
    insertGroup.run(id, name.trim())
    for (const member of members ?? []) {
      if (member.name?.trim()) {
        insertMember.run(randomUUID(), id, member.name.trim(), member.role?.trim() || 'Estudo')
      }
    }
  })

  create()

  const groupMembers = db
    .prepare('SELECT name, role FROM group_members WHERE group_id = ?')
    .all(id) as GroupMember[]

  res.status(201).json({ id, name: name.trim(), members: groupMembers })
})

export default router
