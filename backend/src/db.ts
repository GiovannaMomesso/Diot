import Database from 'better-sqlite3'
import { randomUUID } from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'doit.db')

export const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS study_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS group_members (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      teacher TEXT NOT NULL,
      schedule TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subject_groups (
      subject_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      PRIMARY KEY (subject_id, group_id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      due_date TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Planejada',
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (group_id) REFERENCES study_groups(id)
    );

    CREATE TABLE IF NOT EXISTS subscription (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      plan_id TEXT NOT NULL DEFAULT 'mensal',
      separate_billing INTEGER NOT NULL DEFAULT 1
    );
  `)

  const groupCount = db.prepare('SELECT COUNT(*) as count FROM study_groups').get() as { count: number }
  if (groupCount.count === 0) {
    seedDb()
  } else {
    ensureSeedActivityDate()
  }
}

function ensureSeedActivityDate() {
  const today = getLocalDateKey(new Date())
  db.prepare('UPDATE activities SET due_date = ? WHERE id = ?').run(today, 'activity-1')
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function seedDb() {
  const insertGroup = db.prepare('INSERT INTO study_groups (id, name) VALUES (?, ?)')
  const insertMember = db.prepare('INSERT INTO group_members (id, group_id, name, role) VALUES (?, ?, ?, ?)')
  const insertSubject = db.prepare('INSERT INTO subjects (id, title, teacher, schedule) VALUES (?, ?, ?, ?)')
  const insertSubjectGroup = db.prepare('INSERT INTO subject_groups (subject_id, group_id) VALUES (?, ?)')
  const insertActivity = db.prepare(
    'INSERT INTO activities (id, title, subject_id, group_id, due_date, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
  const insertSubscription = db.prepare('INSERT INTO subscription (id, plan_id, separate_billing) VALUES (1, ?, ?)')

  const seed = db.transaction(() => {
    insertGroup.run('group-1', 'Amigos do Intervalo')
    insertMember.run(randomUUID(), 'group-1', 'Alice', 'Pesquisa')
    insertMember.run(randomUUID(), 'group-1', 'Bruno', 'Apresentação')
    insertMember.run(randomUUID(), 'group-1', 'Catarina', 'Slides')

    insertGroup.run('group-2', 'Clube de Ciências')
    insertMember.run(randomUUID(), 'group-2', 'Daniel', 'Experimento')
    insertMember.run(randomUUID(), 'group-2', 'Elena', 'Relatório')

    insertSubject.run('subject-1', 'Ciências', 'Prof. Marco', 'Segunda 10:00')
    insertSubjectGroup.run('subject-1', 'group-1')

    insertSubject.run('subject-2', 'História', 'Profa. Sofia', 'Quarta 14:00')
    insertSubjectGroup.run('subject-2', 'group-2')

    insertActivity.run(
      'activity-1',
      'Montar maquete do ecossistema',
      'subject-1',
      'group-1',
      getLocalDateKey(new Date()),
      'Cada membro prepara sua parte para a apresentação.',
      'Em andamento',
    )

    insertSubscription.run('mensal', 1)
  })

  seed()
}
