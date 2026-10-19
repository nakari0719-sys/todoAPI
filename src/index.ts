import { serve } from '@hono/node-server'
import { Hono, type Context } from 'hono'
import { db } from './firebase.js'

const app = new Hono()

type Todo = {
  id: string
  title: string
  completed: boolean
}
type TodoData = {
  title: string
  completed: boolean
}

function isValidTodoData(data: unknown): data is TodoData {
  if (
    data === null ||
    typeof data !== 'object' ||
    Array.isArray(data)
  ) {
    return false
  }

  if (!('title' in data) || typeof data.title !== 'string') {
    return false
  }

  if (data.title.trim() === '') {
    return false
  }

  if (!('completed' in data) || typeof data.completed !== 'boolean') {
    return false
  }

  return true
}

async function parseJsonBody(c: Context) {
  try {
    const body = await c.req.json()

    return {
      success: true,
      data: body
    }
  } catch {
    return {
      success: false,
      data: null
    }
  }
}

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/todos', async (c) => {
  const snapshot = await db.collection('todos').get()

  const todos: Todo[] = snapshot.docs.map((doc) => {
  const data = doc.data()

  return {
    id: doc.id,
    title: data.title,
    completed: data.completed
  }
})

  return c.json(todos)
})

app.get('/todos/:id', async (c) => {
  const id = c.req.param('id')

  const doc = await db.collection('todos').doc(id).get()

  if (!doc.exists) {
    return c.json(
      {
        message: 'TODOが見つかりません'
      },
      404
    )
  }

  return c.json({
    ...doc.data(),
    id: doc.id
  })
})

app.post('/todos', async (c) => {
  const result = await parseJsonBody(c)

  if (!result.success) {
    return c.json(
      {
        message: '正しいJSON形式で送ってください'
      },
      400
    )
  }

  const body = result.data
  // JSONがオブジェクトか確認
  if (
    body === null ||
    typeof body !== 'object' ||
    Array.isArray(body)
  ) {
    return c.json(
      {
        message: 'JSONオブジェクトを送ってください'
      },
      400
    )
  }

  // titleが文字列かチェック
  if (typeof body.title !== 'string') {
    return c.json(
      {
        message: 'titleは文字列で送ってください'
      },
      400
    )
  }

  // titleが空文字でないかチェック
  if (body.title.trim() === '') {
    return c.json(
      {
        message: 'titleを入力してください'
      },
      400
    )
  }

  // 新しいTODOを作成
  const newTodo: TodoData = {
    title: body.title,
    completed: false
  }

  // Firestoreに保存
  const docRef = await db.collection('todos').add(newTodo)

  // 保存したTODOを返す
  return c.json({
    id: docRef.id,
    ...newTodo
  }, 201)
})

app.put('/todos/:id', async (c) => {
  const id = c.req.param('id')

  const result = await parseJsonBody(c)

  if (!result.success) {
    return c.json(
      {
        message: '正しいJSON形式で送ってください'
      },
      400
    )
  }

  const body = result.data

  // JSONがオブジェクトか確認
  if (
    body === null ||
    typeof body !== 'object' ||
    Array.isArray(body)
  ) {
    return c.json(
      {
        message: 'JSONオブジェクトを送ってください'
      },
      400
    )
  }

  const docRef = db.collection('todos').doc(id)

  const doc = await docRef.get()

  if (!doc.exists) {
    return c.json(
      {
        message: 'TODOが見つかりません'
      },
      404
    )
  }

if (!isValidTodoData(body)) {
  return c.json(
    {
      message: 'TODOのデータが正しくありません'
    },
    400
  )
}

  const updatedTodo: TodoData = {
    title: body.title,
    completed: body.completed
  }

  await docRef.update(updatedTodo)

  return c.json({
    id: docRef.id,
    ...updatedTodo
  })
})

app.delete('/todos/:id', async (c) => {
  const id = c.req.param('id')

  const docRef = db.collection('todos').doc(id)

  const doc = await docRef.get()

  if (!doc.exists) {
    return c.json(
      {
        message: 'TODOが見つかりません'
      },
      404
    )
  }

  await docRef.delete()

  return c.json({
    message: 'TODOを削除しました',
    id: id
  })
})

serve(
  {
    fetch: app.fetch,
    port: 3000
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)