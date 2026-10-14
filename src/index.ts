import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

type Todo = {
  id: number
  title: string
  completed: boolean
}

const todos: Todo[] = [
  {
    id: 1,
    title: 'Honoを勉強する',
    completed: false
  },
  {
    id: 2,
    title: 'TODO APIを作る',
    completed: false
  }
]

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/hello', (c) => {
  return c.text('Hello API!')
})

app.get('/todo', (c) => {
  return c.json({
    id: 1,
    title: 'Honoを勉強する',
    completed: false
  })
})

app.get('/todos', (c) => {
  return c.json(todos)
})

app.get('/todos/:id', (c) => {
  const id = Number(c.req.param('id'))

  const todo = todos.find((todo) => todo.id === id)

  if (!todo) {
    return c.json(
      {
        message: 'TODOが見つかりません'
      },
      404
    )
  }

  return c.json(todo)
})

app.post('/todos', async (c) => {
  const body = await c.req.json()

  if (typeof body.title !== 'string') {
    return c.json(
      {
        message: 'titleは文字列で送ってください'
      },
      400
    )
  }

  const newTodo: Todo = {
    id: todos.length + 1,
    title: body.title,
    completed: false
  }

  todos.push(newTodo)

  return c.json(newTodo, 201)
})

app.put('/todos/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()

  const todo = todos.find((todo) => todo.id === id)

  if (!todo) {
    return c.json(
      {
        message: 'TODOが見つかりません'
      },
      404
    )
  }

  todo.title = body.title
  todo.completed = body.completed

  return c.json(todo)
})

app.delete('/todos/:id', (c) => {
  const id = Number(c.req.param('id'))

  const index = todos.findIndex((todo) => todo.id === id)

  if (index === -1) {
    return c.json(
      {
        message: 'TODOが見つかりません'
      },
      404
    )
  }

  const deletedTodo = todos.splice(index, 1)[0]

  return c.json(deletedTodo)
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
