/// <reference types="node" />
import { Buffer } from 'node:buffer'
import fs from 'node:fs/promises'
import process from 'node:process'
import { fetch } from 'undici'

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
    const outputPath = `./output1/${fileName}`

    // 确保 output 目录存在
    await fs.mkdir('./output1', { recursive: true })

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
  const list = [
    { chinese: '龙珠里的孙悟空在麦当劳买汉堡', english: 'Goku in Dragon Ball buys hamburgers at McDonald\'s' },
    // { chinese: '龙珠里的贝吉塔在健身房做瑜伽', english: 'Vegeta in Dragon Ball does yoga in a gym' },
    // { chinese: '龙珠里的比克在城市公园里遛狗', english: 'Piccolo in Dragon Ball walks his dog in a city park' },
    // { chinese: '龙珠里的弗利萨在音乐会中指挥交响乐', english: 'Frieza in Dragon Ball conducts an orchestra at a concert' },
    // { chinese: '龙珠里的克林在咖啡店写日记', english: 'Krillin in Dragon Ball writes in a journal at a coffee shop' },
  ]

  for (const [index, { english }] of list.entries()) {
    const fileName = `${index}.jpeg`
    const outputPath = await query(`A colorful pencil sketch of ${english}`, fileName)
    console.log(`finish ${index + 1}/${list.length}. outputPath: ${outputPath}`)
  }
}

main()
