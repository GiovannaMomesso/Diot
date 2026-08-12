import express from 'express'
import cors from 'cors'
import { initDb } from './db.js'
import groupsRouter from './routes/groups.js'
import subjectsRouter from './routes/subjects.js'
import activitiesRouter from './routes/activities.js'
import subscriptionRouter from './routes/subscription.js'

initDb()

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Rota raiz para facilitar acesso via navegador
app.get('/', (_req, res) => {
  res.redirect('/api/health')
})

app.use('/api/groups', groupsRouter)
app.use('/api/subjects', subjectsRouter)
app.use('/api/activities', activitiesRouter)
app.use('/api/subscription', subscriptionRouter)

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`)
})
