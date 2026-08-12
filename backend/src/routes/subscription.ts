import { Router } from 'express'
import { db } from '../db.js'
import type { Subscription } from '../types.js'

const router = Router()

router.get('/', (_req, res) => {
  const row = db.prepare('SELECT plan_id, separate_billing FROM subscription WHERE id = 1').get() as
    | { plan_id: string; separate_billing: number }
    | undefined

  if (!row) {
    res.json({ planId: 'mensal', separateBilling: true } satisfies Subscription)
    return
  }

  res.json({
    planId: row.plan_id,
    separateBilling: row.separate_billing === 1,
  } satisfies Subscription)
})

router.put('/', (req, res) => {
  const { planId, separateBilling } = req.body as Partial<Subscription>

  const current = db.prepare('SELECT plan_id, separate_billing FROM subscription WHERE id = 1').get() as
    | { plan_id: string; separate_billing: number }
    | undefined

  const newPlanId = planId ?? current?.plan_id ?? 'mensal'
  const newSeparateBilling = separateBilling !== undefined ? (separateBilling ? 1 : 0) : (current?.separate_billing ?? 1)

  db.prepare(
    'INSERT INTO subscription (id, plan_id, separate_billing) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET plan_id = excluded.plan_id, separate_billing = excluded.separate_billing',
  ).run(newPlanId, newSeparateBilling)

  res.json({
    planId: newPlanId,
    separateBilling: newSeparateBilling === 1,
  } satisfies Subscription)
})

export default router
