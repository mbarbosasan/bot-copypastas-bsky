import { BskyAgent } from "@atproto/api";
import * as dotenv from 'dotenv'
import fs from 'fs'
import { CronJob } from 'cron';
dotenv.config({
  path: '.env'
})

const agent = new BskyAgent({
  service: 'https://bsky.social'
})

function selecionarCopyPasta(): {text: string, index: number} {
  const copypastas = fs.readFileSync('./copypastas.json', { encoding: 'utf-8' })
  const json = JSON.parse(copypastas)
  if (!json.length) throw new Error('Nenhum copypasta disponível')
  const randomIndex = Math.floor(Math.random() * json.length)
  const text = json[randomIndex].text.length > 300 ? json[randomIndex].text.substring(0, 255) : json[randomIndex].text
  return {text, index: randomIndex}
}

function removerCopypasta(index: number) {
  const copypastas = fs.readFileSync('./copypastas.json', { encoding: 'utf-8' })
  const json = JSON.parse(copypastas)
  json.splice(index, 1)
  fs.writeFileSync('./copypastas.json', JSON.stringify(json))
  console.log('Removendo copypasta já utilizada', index )
}

async function main() {
  console.log('Iniciando postagem de copypasta')
  await agent.login({
    identifier: process.env.BSKY_USERNAME!,
    password: process.env.BSKY_PASSWORD!
  })
  const {text, index} = selecionarCopyPasta()
  console.log(text)
  const response = await agent.post({
    text: text,
    // 01 de setembro de 1999
    date: new Date(1999, 8, 1)
  }).then(() => {
    removerCopypasta(index)
  })

  console.log(response)
}

main()

// A cada 3 minutos.
const scheduleExpression = '*/3 * * * *'

const job = new CronJob(scheduleExpression, () => {
  console.log('Iniciando job')
  main().then(() => {
    console.log('Job finalizado')
  }).catch((e) => {
    console.log('Erro ao executar job', e)
  })
})

job.start()