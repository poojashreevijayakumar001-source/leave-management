import { Router } from 'express'
import Leave from '../models/Leave.js'
import { verifyLogin, managerOnly } from '../middleware/verifyLogin.js'

const router = Router()
router.use(verifyLogin)

router.post('/', async (req, res) => {
  try {
    const { type, fromDate, toDate, reason } = req.body
    const from = new Date(fromDate), to = new Date(toDate)
    if (isNaN(from) || isNaN(to) || to < from) return res.status(400).json({ message: 'Invalid date range' })
    const days = Math.round((to - from) / 86400000) + 1
    const leave = await Leave.create({ user: req.user.id, type, fromDate: from, toDate: to, days, reason })
    res.status(201).json(leave)
  } catch (e) { res.status(500).json({ message: e.message }) }
})

router.get('/my', async (req, res) => {
  res.json(await Leave.find({ user: req.user.id }).sort({ createdAt: -1 }))
})

router.get('/', managerOnly, async (_req, res) => {
  res.json(await Leave.find().populate('user', 'name email').sort({ createdAt: -1 }))
})

router.patch('/:id', managerOnly, async (req, res) => {
  if (!['Approved', 'Rejected'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' })
  const leave = await Leave.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })
  if (!leave) return res.status(404).json({ message: 'Leave not found' })
  res.json(leave)
})

export default router
