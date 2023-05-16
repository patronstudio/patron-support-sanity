# Patron Support plugin for Sanity

## Serverless functions

Add /api/patron-support-details.ts to web app api directory:

```javascript
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function patronSupportDetails(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (
    !process.env.CLICKUP_CLIENT_LIST_ID &&
    !process.env.CLICKUP_ACCESS_TOKEN
  ) {
    return res.status(401).json({ error: 'Invalid list id and access token' })
  }

  const { CLICKUP_CLIENT_LIST_ID, CLICKUP_ACCESS_TOKEN } = process.env
  const options = {
    method: 'GET',
    headers: {
      Authorization: CLICKUP_ACCESS_TOKEN
    }
  }

  try {
    const resp = Promise.all([
      fetch(
        `https://api.clickup.com/api/v2/list/${CLICKUP_CLIENT_LIST_ID}/task`,
        options
      ),
      fetch(
        `https://api.clickup.com/api/v2/list/${CLICKUP_CLIENT_LIST_ID}/field`,
        options
      )
    ])

    if (!resp) {
      return res.status(500).json({ error: 'Error fetching data' })
    }

    const data: Array<
      {
        tasks: Array<any>
      } & {
        fields: Array<any>
      }
    > = await resp.then((res) => Promise.all(res.map((r) => r.json())))

    if (!data || data?.length < 1) {
      return res.status(500).json({ error: 'Error fetching data' })
    }

    const { tasks } = data[0]
    const { fields } = data[1]

    return res.status(200).json({
      tickets:
        tasks?.length > 0
          ? {
              open: tasks.filter((task) => task.status.status === 'Open')
                .length,
              inProgress: tasks.filter(
                (task) => task.status.status === 'in progress'
              ).length,
              blocked: tasks.filter((task) => task.status.status === 'blocked')
                .length,
              complete: tasks.filter(
                (task) => task.status.status === 'complete'
              ).length
            }
          : {},
      issueTypes:
        fields?.length > 0
          ? fields.find((item) => item?.name === 'Issue Type')?.type_config
              ?.options
          : []
    })
  } catch (error) {
    console.log('Error: ', error)
    res.statusMessage = error.message
    return res.status(500).end()
  }
}
```

Add /api/patron-support-form.ts to web app api directory:

```javascript
import type { NextApiRequest, NextApiResponse } from 'next'

interface FormData {
  issue_type: string
  name: string
  description: string
  screenshot: string
  user_name: string
  from_email: string
  telephone: string
}

export default async function patronSupportForm(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (
    !process.env.CLICKUP_CLIENT_LIST_ID &&
    !process.env.CLICKUP_ACCESS_TOKEN
  ) {
    return res.status(401).json({ error: 'Invalid list id and access token' })
  }

  if (!req.body) {
    return res.status(401).json({ error: 'Form data invalid or required' })
  }

  const formData: FormData = JSON.parse(req.body)
  const {
    issue_type,
    name,
    description,
    screenshot,
    user_name,
    from_email,
    telephone
  } = formData

  const { CLICKUP_CLIENT_LIST_ID, CLICKUP_ACCESS_TOKEN } = process.env

  try {
    const resp = await fetch(
      `https://api.clickup.com/api/v2/list/${CLICKUP_CLIENT_LIST_ID}/task`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: CLICKUP_ACCESS_TOKEN
        },
        body: JSON.stringify({
          name,
          description,
          status: 'Open',
          check_required_custom_fields: true,
          custom_fields: [
            {
              id: 'd399552f-ffda-41f3-93ba-bbcb1187bddd',
              value: issue_type
            },
            {
              id: '5f6705f4-502b-474d-9e7e-64f0c88608f0',
              value: user_name
            },
            {
              id: 'c3a758cb-6cf3-4895-83c1-448846803b75',
              value: from_email
            },
            {
              id: '3be2e8c1-c4f4-41fc-b541-503eff83e698',
              value: telephone
            },
            {
              id: '1bba6e8b-0ce1-44e3-8ad2-5327b9045b0e',
              value: screenshot
            }
          ]
        })
      }
    )

    if (!resp.ok) {
      throw new Error(resp.statusText)
    }

    const data = await resp.json()

    if (!data) {
      throw new Error('No Ticket ID returned')
    }

    const ticketId = data.id

    return res.status(200).json({ ticketId })
  } catch (error) {
    console.log('Error: ', error)
    res.statusMessage = error.message
    return res.status(500).end()
  }
}
```

Allow CORS to api routes. This can be added to web app next.config

```javascript
  async headers() {
    return [
      ...['details', 'form'].map((path) => ({
        source: `/api/patron-support-${path}`,
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS, PATCH, DELETE, POST, PUT'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
          }
        ]
      }))
    ]
  }
```
