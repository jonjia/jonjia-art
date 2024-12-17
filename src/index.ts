/// <reference types="node" />
import { Buffer } from 'node:buffer'
import fs from 'node:fs/promises'
import process from 'node:process'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { fetch } from 'undici'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? '')

const schema = {
  description: 'List of objects',
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      english: {
        type: SchemaType.STRING,
        description: 'Who and What and of the object',
        nullable: false,
      },
      chinese: {
        type: SchemaType.STRING,
        description: '主体的中文描述',
        nullable: false,
      },
    },
    required: ['english', 'chinese'],
  },
}

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: schema,
  },
})

const prompt = `列举出10个最受女性欢迎的奢侈品牌
## 输出样例

[
  {
    "english": "Louis Vuitton",
    "chinese": "路易威登"
  }
]

## 输出格式
Item = {'english': string, 'chinese': string}
Return: Array<Item>
`

async function getObjectList(): Promise<Record<string, string>[]> {
  try {
    const result = await model.generateContent(prompt)
    const list = JSON.parse(result.response.text())
    return list
  }
  catch (error) {
    console.error(error)
    return []
  }
}

async function query(inputs: string, fileName: string): Promise<string> {
  try {
    const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY
    const response = await fetch(
      'https://api-inference.huggingface.co/models/Datou1111/shou_xin',
      {
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({ inputs }),
      },
    )
    const now = new Date()
    const dateStr = `${now.toISOString().split('T')[0]}_${now.getHours()}`
    const outputPath = `./output/${dateStr}/${fileName}`

    await fs.mkdir(`./output/${dateStr}`, { recursive: true })

    const result = await response.blob()
    const buffer = Buffer.from(await result.arrayBuffer())
    await fs.writeFile(outputPath, buffer)

    return outputPath
  }
  catch (error) {
    console.error(error)
    return ''
  }
}

async function main(): Promise<void> {
  const list = await getObjectList()
  console.log(`list: ${JSON.stringify(list, null, 2)}`)
  // for (const [index, { english }] of list.entries()) {
  //   const fileName = `${index}.jpeg`
  //   const outputPath = await query(`A pencil sketch of ${english}`, fileName)
  //   console.log(`finish ${index + 1}/${list.length}. outputPath: ${outputPath}`)
  // }
}

main()
