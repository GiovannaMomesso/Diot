import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type GroupMember = {
  name: string
  role: string
}

type StudyGroup = {
  id: string
  name: string
  members: GroupMember[]
}

type Subject = {
  id: string
  title: string
  teacher: string
  schedule: string
  groupIds: string[]
}

type StudyActivity = {
  id: string
  title: string
  subjectId: string
  groupId: string
  dueDate: string
  description: string
  status: 'Planejada' | 'Em andamento' | 'Finalizada'
}

const initialGroups: StudyGroup[] = [
  {
    id: 'group-1',
    name: 'Amigos do Intervalo',
    members: [
      { name: 'Alice', role: 'Pesquisa' },
      { name: 'Bruno', role: 'Apresentação' },
      { name: 'Catarina', role: 'Slides' },
    ],
  },
  {
    id: 'group-2',
    name: 'Clube de Ciências',
    members: [
      { name: 'Daniel', role: 'Experimento' },
      { name: 'Elena', role: 'Relatório' },
    ],
  },
]

const initialSubjects: Subject[] = [
  {
    id: 'subject-1',
    title: 'Ciências',
    teacher: 'Prof. Marco',
    schedule: 'Segunda 10:00',
    groupIds: ['group-1'],
  },
  {
    id: 'subject-2',
    title: 'História',
    teacher: 'Profa. Sofia',
    schedule: 'Quarta 14:00',
    groupIds: ['group-2'],
  },
]

const initialActivities: StudyActivity[] = [
  {
    id: 'activity-1',
    title: 'Montar maquete do ecossistema',
    subjectId: 'subject-1',
    groupId: 'group-1',
    dueDate: '2026-08-12',
    description: 'Cada membro prepara sua parte para a apresentação.',
    status: 'Em andamento',
  },
]

const pageOptions = ['Resumo', 'Grupos', 'Agenda'] as const

type Page = (typeof pageOptions)[number]

function parseGroupMembers(value: string) {
  return value
    .split(',')
    .map((member) => {
      const [name, role] = member.split(':').map((item) => item.trim())
      return name ? { name, role: role || 'Estudo' } : null
    })
    .filter((member): member is GroupMember => Boolean(member))
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const totalDays = new Date(year, month + 1, 0).getDate()
  const startWeekDay = (firstDay.getDay() + 6) % 7
  const days: Array<Date | null> = []

  for (let i = 0; i < startWeekDay; i += 1) {
    days.push(null)
  }

  for (let day = 1; day <= totalDays; day += 1) {
    days.push(new Date(year, month, day))
  }

  return days
}

const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function App() {
  const [page, setPage] = useState<Page>('Resumo')
  const [groups, setGroups] = useState<StudyGroup[]>(initialGroups)
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects)
  const [activities, setActivities] = useState<StudyActivity[]>(initialActivities)

  const [groupName, setGroupName] = useState('')
  const [groupMembers, setGroupMembers] = useState('')
  const [subjectTitle, setSubjectTitle] = useState('')
  const [subjectTeacher, setSubjectTeacher] = useState('')
  const [subjectSchedule, setSubjectSchedule] = useState('')
  const [activityTitle, setActivityTitle] = useState('')
  const [activitySubjectId, setActivitySubjectId] = useState(initialSubjects[0]?.id ?? '')
  const [activityGroupId, setActivityGroupId] = useState(initialGroups[0]?.id ?? '')
  const [activityDueDate, setActivityDueDate] = useState('')
  const [activityDescription, setActivityDescription] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear())

  const totalMembers = useMemo(
    () => new Set(groups.flatMap((group) => group.members.map((member) => member.name))).size,
    [groups],
  )

  const monthDays = useMemo(() => getMonthDays(calendarYear, calendarMonth), [calendarMonth, calendarYear])

  const activitiesByDate = useMemo(() => {
    const map = new Map<string, StudyActivity[]>()
    activities.forEach((activity) => {
      const dateKey = activity.dueDate
      const current = map.get(dateKey) ?? []
      map.set(dateKey, [...current, activity])
    })
    return map
  }, [activities])

  const nextActivities = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10)
    return activities
      .slice()
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .filter((activity) => activity.dueDate >= todayKey)
      .slice(0, 5)
  }, [activities])

  const handleCreateGroup = (event: FormEvent) => {
    event.preventDefault()
    const name = groupName.trim()
    if (!name) return
    setGroups((current) => [
      ...current,
      { id: crypto.randomUUID(), name, members: parseGroupMembers(groupMembers) },
    ])
    setGroupName('')
    setGroupMembers('')
  }

  const handleCreateSubject = (event: FormEvent) => {
    event.preventDefault()
    const title = subjectTitle.trim()
    if (!title || !subjectTeacher.trim() || !subjectSchedule.trim()) return
    setSubjects((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title,
        teacher: subjectTeacher.trim(),
        schedule: subjectSchedule.trim(),
        groupIds: [],
      },
    ])
    setSubjectTitle('')
    setSubjectTeacher('')
    setSubjectSchedule('')
  }

  const handleCreateActivity = (event: FormEvent) => {
    event.preventDefault()
    const title = activityTitle.trim()
    if (!title || !activityDueDate) return
    setActivities((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title,
        subjectId: activitySubjectId,
        groupId: activityGroupId,
        dueDate: activityDueDate,
        description: activityDescription.trim() || 'Sem descrição adicional.',
        status: 'Planejada',
      },
    ])
    setActivityTitle('')
    setActivityDueDate('')
    setActivityDescription('')
  }

  const toggleGroupInSubject = (subjectId: string, groupId: string) => {
    setSubjects((current) =>
      current.map((subject) => {
        if (subject.id !== subjectId) return subject
        const alreadyAssigned = subject.groupIds.includes(groupId)
        return {
          ...subject,
          groupIds: alreadyAssigned
            ? subject.groupIds.filter((id) => id !== groupId)
            : [...subject.groupIds, groupId],
        }
      }),
    )
  }

  const changeMonth = (direction: 'prev' | 'next') => {
    setCalendarMonth((current) => {
      const next = direction === 'prev' ? current - 1 : current + 1
      if (next < 0) {
        setCalendarYear((year) => year - 1)
        return 11
      }
      if (next > 11) {
        setCalendarYear((year) => year + 1)
        return 0
      }
      return next
    })
  }

  const statusClasses = {
    Planejada: 'bg-amber-100 text-amber-900',
    'Em andamento': 'bg-sky-100 text-sky-900',
    Finalizada: 'bg-emerald-100 text-emerald-900',
  }

  return (
    <div className="min-h-screen bg-stone-100 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-[32px] border border-stone-300 bg-white p-5 shadow-sm shadow-stone-200 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.24em] text-amber-700">Caderno escolar</p>
              <h1 className="text-3xl font-semibold text-slate-950 sm:text-4xl">Gestão de grupos, matérias e calendário de estudos</h1>
              <p className="max-w-2xl text-slate-600">Use o app em várias páginas para acompanhar suas tarefas, criar grupos de amigos e ver o plano de estudos do mês.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setPage('Resumo')}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${page === 'Resumo' ? 'border-amber-500 bg-amber-100 text-amber-900' : 'border-stone-200 bg-white text-slate-700 hover:border-stone-300'}`}
              >
                Resumo
              </button>
              <button
                type="button"
                onClick={() => setPage('Grupos')}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${page === 'Grupos' ? 'border-amber-500 bg-amber-100 text-amber-900' : 'border-stone-200 bg-white text-slate-700 hover:border-stone-300'}`}
              >
                Grupos
              </button>
              <button
                type="button"
                onClick={() => setPage('Agenda')}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${page === 'Agenda' ? 'border-amber-500 bg-amber-100 text-amber-900' : 'border-stone-200 bg-white text-slate-700 hover:border-stone-300'}`}
              >
                Agenda
              </button>
            </div>
          </div>
        </header>

        <main className="space-y-6">
          {page === 'Resumo' && (
            <section className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Total de grupos</p>
                  <p className="mt-3 text-3xl font-semibold text-amber-700">{groups.length}</p>
                  <p className="mt-2 text-sm text-slate-600">Grupos de amigos e estudo criados.</p>
                </div>
                <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Total de matérias</p>
                  <p className="mt-3 text-3xl font-semibold text-amber-700">{subjects.length}</p>
                  <p className="mt-2 text-sm text-slate-600">Disciplinas registradas no caderno.</p>
                </div>
                <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Alunos únicos</p>
                  <p className="mt-3 text-3xl font-semibold text-amber-700">{totalMembers}</p>
                  <p className="mt-2 text-sm text-slate-600">Pessoas envolvidas em seus grupos.</p>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                  <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-950">Próximas atividades</h2>
                        <p className="mt-2 text-sm text-slate-600">Veja os próximos prazos e grupos responsáveis.</p>
                      </div>
                    </div>
                    <div className="mt-6 space-y-4">
                      {nextActivities.length ? (
                        nextActivities.map((activity) => {
                          const subjectInfo = subjects.find((item) => item.id === activity.subjectId)
                          const groupInfo = groups.find((item) => item.id === activity.groupId)
                          return (
                            <div key={activity.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="font-semibold text-slate-950">{activity.title}</p>
                                  <p className="text-sm text-slate-600">{subjectInfo?.title ?? 'Disciplina'} • {groupInfo?.name ?? 'Grupo'}</p>
                                </div>
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">{activity.dueDate}</span>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-sm text-slate-600">Não há atividades agendadas para os próximos dias.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200">
                    <h2 className="text-xl font-semibold text-slate-950">Matérias recentes</h2>
                    <div className="mt-6 space-y-3">
                      {subjects.map((subject) => (
                        <div key={subject.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                          <p className="font-semibold text-slate-950">{subject.title}</p>
                          <p className="text-sm text-slate-600">{subject.teacher} • {subject.schedule}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="space-y-6">
                  <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200">
                    <h2 className="text-xl font-semibold text-slate-950">Grupos ativos</h2>
                    <div className="mt-6 space-y-3">
                      {groups.map((group) => (
                        <div key={group.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <p className="font-semibold text-slate-950">{group.name}</p>
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase text-amber-900">{group.members.length} pessoas</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200">
                    <h2 className="text-xl font-semibold text-slate-950">Dica rápida</h2>
                    <p className="mt-4 text-sm text-slate-600">Use o menu para alternar entre visão geral, organização de grupos e agenda de tarefas.</p>
                  </div>
                </aside>
              </div>
            </section>
          )}

          {page === 'Grupos' && (
            <section className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                  <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200">
                    <h2 className="text-xl font-semibold text-slate-950">Grupos de amizade</h2>
                    <p className="mt-2 text-slate-600">Crie seus grupos de estudo e registre o papel de cada amigo.</p>
                    <form className="mt-6 space-y-4" onSubmit={handleCreateGroup}>
                      <label className="block">
                        <span className="text-sm text-slate-700">Nome do grupo</span>
                        <input
                          value={groupName}
                          onChange={(event) => setGroupName(event.target.value)}
                          placeholder="Ex: Time de TCC"
                          className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm text-slate-700">Membros e função</span>
                        <input
                          value={groupMembers}
                          onChange={(event) => setGroupMembers(event.target.value)}
                          placeholder="Alice:Pesquisa, Bruno:Apresentação"
                          className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        />
                        <p className="mt-2 text-xs text-slate-500">Separe por vírgula. Use nome:função para cada integrante.</p>
                      </label>
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                      >
                        Adicionar grupo
                      </button>
                    </form>
                  </div>

                  <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200">
                    <h2 className="text-xl font-semibold text-slate-950">Nova matéria</h2>
                    <p className="mt-2 text-slate-600">Registre uma disciplina e o horário da aula.</p>
                    <form className="mt-6 space-y-4" onSubmit={handleCreateSubject}>
                      <label className="block">
                        <span className="text-sm text-slate-700">Disciplina</span>
                        <input
                          value={subjectTitle}
                          onChange={(event) => setSubjectTitle(event.target.value)}
                          placeholder="Ex: Matemática"
                          className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm text-slate-700">Professor(a)</span>
                        <input
                          value={subjectTeacher}
                          onChange={(event) => setSubjectTeacher(event.target.value)}
                          placeholder="Ex: Prof. Sofia"
                          className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm text-slate-700">Horário</span>
                        <input
                          value={subjectSchedule}
                          onChange={(event) => setSubjectSchedule(event.target.value)}
                          placeholder="Ex: Segunda 10:00"
                          className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        />
                      </label>
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                      >
                        Adicionar matéria
                      </button>
                    </form>
                  </div>

                  <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200">
                    <h2 className="text-xl font-semibold text-slate-950">Matérias e grupos</h2>
                    <p className="mt-2 text-slate-600">Associe um grupo a cada matéria para manter as tarefas organizadas.</p>
                    <div className="mt-6 space-y-4">
                      {subjects.map((subject) => (
                        <div key={subject.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold text-slate-950">{subject.title}</p>
                              <p className="text-sm text-slate-600">{subject.teacher} • {subject.schedule}</p>
                            </div>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {groups.map((group) => {
                              const selected = subject.groupIds.includes(group.id)
                              return (
                                <button
                                  key={group.id}
                                  type="button"
                                  onClick={() => toggleGroupInSubject(subject.id, group.id)}
                                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                                    selected
                                      ? 'border-amber-500 bg-amber-100 text-amber-900'
                                      : 'border-stone-300 bg-white text-slate-700 hover:border-stone-400'
                                  }`}
                                >
                                  <p className="font-semibold">{group.name}</p>
                                  <p className="mt-1 text-xs text-slate-500">{group.members.length} amigos</p>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="space-y-6">
                  <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200">
                    <h2 className="text-xl font-semibold text-slate-950">Equipes de estudo</h2>
                    <div className="mt-6 space-y-4">
                      {groups.map((group) => (
                        <div key={group.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                          <p className="font-semibold text-slate-950">{group.name}</p>
                          <div className="mt-3 space-y-2 text-sm text-slate-600">
                            {group.members.map((member) => (
                              <p key={`${group.id}-${member.name}`} className="rounded-2xl bg-white px-3 py-2 shadow-sm shadow-stone-100">
                                <span className="font-semibold text-slate-900">{member.name}</span>: {member.role}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200">
                    <h2 className="text-xl font-semibold text-slate-950">Registrar atividade</h2>
                    <p className="mt-2 text-slate-600">Use a aba Agenda para criar tarefas relacionadas à disciplina e grupo.</p>
                  </div>
                </aside>
              </div>
            </section>
          )}

          {page === 'Agenda' && (
            <section className="space-y-6">
              <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">Agenda de estudos</h2>
                    <p className="mt-2 text-slate-600">Visualize prazos e compromissos por mês.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => changeMonth('prev')}
                      className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-2 text-sm text-slate-700 transition hover:border-stone-400"
                    >
                      Anterior
                    </button>
                    <div className="rounded-2xl border border-stone-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
                      {monthNames[calendarMonth]} {calendarYear}
                    </div>
                    <button
                      type="button"
                      onClick={() => changeMonth('next')}
                      className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-2 text-sm text-slate-700 transition hover:border-stone-400"
                    >
                      Próximo
                    </button>
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto rounded-[28px] border border-stone-200 bg-stone-50 p-4">
                  <div className="grid min-w-[680px] grid-cols-7 gap-2 text-center text-xs uppercase text-slate-500">
                    {weekDays.map((day) => (
                      <div key={day} className="py-2">{day}</div>
                    ))}
                  </div>
                  <div className="mt-2 grid min-w-[680px] grid-cols-7 gap-2">
                    {monthDays.map((date, index) => {
                      const dateKey = date ? date.toISOString().slice(0, 10) : ''
                      const tasks = date ? activitiesByDate.get(dateKey) : undefined
                      return (
                        <div
                          key={`${index}-${dateKey}`}
                          className={`min-h-[90px] rounded-3xl border p-3 text-left transition ${
                            date ? 'border-stone-200 bg-white' : 'bg-transparent'
                          }`}
                        >
                          {date ? (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-950">{date.getDate()}</span>
                                {tasks ? (
                                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-900">{tasks.length}x</span>
                                ) : null}
                              </div>
                              {tasks ? (
                                <div className="mt-3 space-y-1 text-[11px] text-slate-600">
                                  {tasks.slice(0, 2).map((task) => (
                                    <p key={task.id} className="truncate">• {task.title}</p>
                                  ))}
                                  {tasks.length > 2 ? <p className="text-[11px] text-slate-500">+{tasks.length - 2} mais</p> : null}
                                </div>
                              ) : (
                                <p className="mt-3 text-[11px] text-slate-400">Sem tarefas</p>
                              )}
                            </>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200">
                  <h2 className="text-xl font-semibold text-slate-950">Atividades detalhadas</h2>
                  <p className="mt-2 text-slate-600">Veja as tarefas agendadas por data e disciplina.</p>
                  <div className="mt-6 space-y-4">
                    {activities.map((activity) => {
                      const subjectInfo = subjects.find((item) => item.id === activity.subjectId)
                      const groupInfo = groups.find((item) => item.id === activity.groupId)
                      return (
                        <div key={activity.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold text-slate-950">{activity.title}</p>
                              <p className="text-sm text-slate-600">{subjectInfo?.title ?? 'Disciplina'} • {groupInfo?.name ?? 'Grupo'}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusClasses[activity.status]}`}>{activity.status}</span>
                          </div>
                          <p className="mt-3 text-sm text-slate-600">{activity.description}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <aside className="space-y-6">
                  <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200">
                    <h2 className="text-xl font-semibold text-slate-950">Resumo do mês</h2>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <p>Você está vendo {activities.length} atividade(s) cadastradas.</p>
                      <p>Lembre-se de atualizar a agenda sempre que tiver um novo prazo.</p>
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200">
                    <h2 className="text-xl font-semibold text-slate-950">Registrar nova atividade</h2>
                    <p className="mt-2 text-slate-600">Cadastre tarefas diretamente na agenda e defina grupo e disciplina.</p>
                    <form className="mt-6 space-y-4" onSubmit={handleCreateActivity}>
                      <label className="block">
                        <span className="text-sm text-slate-700">Título</span>
                        <input
                          value={activityTitle}
                          onChange={(event) => setActivityTitle(event.target.value)}
                          placeholder="Ex: Revisar capítulo 4"
                          className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm text-slate-700">Disciplina</span>
                        <select
                          value={activitySubjectId}
                          onChange={(event) => setActivitySubjectId(event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        >
                          {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>{subject.title}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-sm text-slate-700">Grupo</span>
                        <select
                          value={activityGroupId}
                          onChange={(event) => setActivityGroupId(event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        >
                          {groups.map((group) => (
                            <option key={group.id} value={group.id}>{group.name}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-sm text-slate-700">Prazo</span>
                        <input
                          type="date"
                          value={activityDueDate}
                          onChange={(event) => setActivityDueDate(event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm text-slate-700">Descrição</span>
                        <textarea
                          value={activityDescription}
                          onChange={(event) => setActivityDescription(event.target.value)}
                          rows={3}
                          placeholder="O que cada amigo deve entregar"
                          className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        />
                      </label>
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                      >
                        Adicionar atividade
                      </button>
                    </form>
                  </div>

                  <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200">
                    <h2 className="text-xl font-semibold text-slate-950">Aula em destaque</h2>
                    <p className="mt-2 text-slate-600">A matéria com mais grupos será exibida aqui.</p>
                    <div className="mt-4 rounded-3xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
                      {subjects.length ? subjects[0].title : 'Nenhuma matéria cadastrada'}
                    </div>
                  </div>
                </aside>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
