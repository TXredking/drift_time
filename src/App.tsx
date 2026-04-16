import './App.css'
import { CONTEXTS } from './data/contexts'
import { projects, tasks } from './data/seed'
import type { ContextId, EffortSize, Task } from './types/app'

const selectedContextId: ContextId = 'home'
const selectedEffortSize: EffortSize = 'small'
const selectedTimeWindow = 15

const taskCards = tasks.slice(0, 9)

function getProject(task: Task) {
  return projects.find((project) => project.id === task.projectId)
}

function App() {
  const selectedContext = CONTEXTS.find(
    (context) => context.id === selectedContextId,
  )
  const selectedProjects = projects.filter(
    (project) => project.contextId === selectedContextId,
  )

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">DriftTime</p>
          <h1>Here's what you could do.</h1>
        </div>
        <button className="shuffle-button" type="button">
          Reshuffle
        </button>
      </header>

      <section className="controls" aria-label="Task filters">
        <div className="control-group" aria-label="Context">
          {CONTEXTS.map((context) => (
            <button
              className={
                context.id === selectedContextId
                  ? 'context-pill active'
                  : 'context-pill'
              }
              key={context.id}
              type="button"
            >
              <span aria-hidden="true">{context.icon}</span>
              {context.name}
            </button>
          ))}
        </div>

        <div className="quick-controls">
          <div className="select-card">
            <span>Effort</span>
            <strong>Small Bite</strong>
          </div>
          <div className="select-card">
            <span>Time</span>
            <strong>{selectedTimeWindow} minutes</strong>
          </div>
        </div>
      </section>

      <section className="workspace">
        <aside className="sidebar" aria-label="Projects">
          <div className="sidebar-heading">
            <span>{selectedContext?.name}</span>
            <button type="button">Add project</button>
          </div>

          <div className="project-list">
            {selectedProjects.map((project) => (
              <article className="project-row" key={project.id}>
                <span
                  className="project-swatch"
                  style={{ backgroundColor: project.color }}
                  aria-hidden="true"
                />
                <div>
                  <h2>{project.name}</h2>
                  <p>
                    {
                      tasks.filter((task) => task.projectId === project.id)
                        .length
                    }{' '}
                    tasks
                  </p>
                </div>
              </article>
            ))}
          </div>
        </aside>

        <section className="grid-panel" aria-label="Task grid">
          <div className="grid-heading">
            <div>
              <p className="eyebrow">Today</p>
              <h2>Small things that fit right now</h2>
            </div>
            <p>
              {selectedEffortSize === 'small'
                ? 'Easy entry points, no heroics required.'
                : 'Pick one that fits the moment.'}
            </p>
          </div>

          <div className="task-grid">
            {taskCards.map((task) => {
              const project = getProject(task)

              return (
                <article
                  className="task-card"
                  key={task.id}
                  style={{ borderTopColor: project?.color }}
                >
                  <div>
                    <p className="task-project">{project?.name}</p>
                    <h3>{task.title}</h3>
                  </div>
                  <footer>
                    <span>{task.durationMinutes} min</span>
                    <span>{task.effortSize} bite</span>
                  </footer>
                </article>
              )
            })}
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
