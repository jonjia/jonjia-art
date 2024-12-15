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

const prompt = `列举出一类世界上特别有名的美国实体，可以是人物或者物体。比如有代表性的，近3届美国总统
## 具体要求
1. 列举出至少5实体
2. 每个实体需要有一句话的描述，每个实体出现2次，描述不一样
3. 每个人物/角色实体的描述需要包含一个动作，动作最好有混搭和反差

## 输出样例

[
  {
    "english": "Goku in Dragon Ball buys hamburgers at McDonald's",
    "chinese": "龙珠中的悟空在麦当劳买汉堡"
  },
  {
    "english": "Goku in Dragon Ball cooks a Michelin-starred meal",
    "chinese": "龙珠中的悟空正在烹饪一顿米其林级别的大餐"
  },
  {
    "english": "Vegeta from Dragon Ball practices ballet in a tutu",
    "chinese": "龙珠中的贝吉塔穿着芭蕾舞裙练习芭蕾"
  },
  {
    "english": "Vegeta from Dragon Ball hosts a cooking show on TV",
    "chinese": "龙珠中的贝吉塔在电视上主持烹饪节目"
  },
  {
    "english": "Piccolo from Dragon Ball teaches kindergarten class",
    "chinese": "龙珠中的比克在幼儿园当老师"
  },
  {
    "english": "Piccolo from Dragon Ball performs stand-up comedy",
    "chinese": "龙珠中的比克在表演单口相声"
  },
  {
    "english": "Master Roshi from Dragon Ball gives a TED talk",
    "chinese": "龙珠中的龟仙人在做TED演讲"
  },
  {
    "english": "Master Roshi from Dragon Ball leads a yoga class",
    "chinese": "龙珠中的龟仙人在教瑜伽课"
  },
  {
    "english": "Bulma from Dragon Ball competes in a wrestling match",
    "chinese": "龙珠中的布尔玛在参加摔跤比赛"
  },
  {
    "english": "Bulma from Dragon Ball conducts a symphony orchestra",
    "chinese": "龙珠中的布尔玛在指挥交响乐团"
  }
]

## 输出要求
1. 使用英文输出内容
2. 可以根据输出的内容画出一个简单的图画
3. 输出的内容必须是一类实体，比如动漫角色，或者电影人物，或者动物，或者食物等等
4. 每个实体的描述都需要有一个动作，动作最好有混搭和反差
5. 不要再用美国总统这个例子了，换一个新的例子
6. 一共包括 10 个元素

## 输出格式
Item = {'english': string}
Return: Array<Recipe>
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
  for (const [index, { english }] of list.entries()) {
    const fileName = `${index}.jpeg`
    const outputPath = await query(`A pencil sketch of ${english}`, fileName)
    console.log(`finish ${index + 1}/${list.length}. outputPath: ${outputPath}`)
  }
}

main()
