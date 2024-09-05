import { AppBskyFeedPost, BskyAgent, ComAtprotoRepoStrongRef } from "@atproto/api";
import * as dotenv from 'dotenv'
import fs from 'fs'
import { CronJob } from 'cron';
dotenv.config({
  path: '.env'
})

const agent = new BskyAgent({
  service: 'https://bsky.social'
})
/**
 * Função que divide o copypasta em partes de 100 caracteres
 * @param copypasta
 * @returns Array<string>
 */
function sequenciarCopypasta(copypasta: string): Array<string> {
  return copypasta.match(/.{1,300}/g) || []
}

function selecionarCopyPasta(): {text: string, index: number} {
  const copypastas = fs.readFileSync('./copypastas.json', { encoding: 'utf-8' })
  const json = JSON.parse(copypastas)
  if (!json.length) throw new Error('Nenhum copypasta disponível')
  const randomIndex = Math.floor(Math.random() * json.length)
  return {text: json[randomIndex].text, index: randomIndex}
}

function removerCopypasta(index: number) {
  const copypastas = fs.readFileSync('./copypastas.json', { encoding: 'utf-8' })
  const json = JSON.parse(copypastas)
  json.splice(index, 1)
  fs.writeFileSync('./copypastas.json', JSON.stringify(json))
  console.log('Removendo copypasta já utilizada', index )
}

function adicionarCopypasta(agent: BskyAgent, copypasta: string, root: ComAtprotoRepoStrongRef.Main | null = null, parent: ComAtprotoRepoStrongRef.Main | null = null) {
  const ehResposta = !!root
  if (!ehResposta) {
    return agent.post({
      text: copypasta
    })
  }
  return agent.post({
    text: copypasta,
    reply: {
      root,
      parent: parent ?? root
    }
  })
}

async function main() {
  console.log('Iniciando postagem de copypasta')
  await agent.login({
    identifier: process.env.BSKY_USERNAME!,
    password: process.env.BSKY_PASSWORD!
  })
  const {text, index} = selecionarCopyPasta()
  sequenciarCopypasta(text).forEach(async (pedaco) => {
    setTimeout(async () => {
      const response = await adicionarCopypasta(agent, pedaco);
      console.log(response)
    }, 5000)
  })
  // const response = await agent.post({
  //   text: 'testando o retorno de um post',
  // }).then(async (response) => {
  //   const reply = await agent.post({
  //     text,
  //     reply: {
  //       root: response,
  //       parent: response
  //     }
  //   }).then(async (reply) => {
  //    await agent.post({
  //     text: 'Respondendo a minha copypasta',
  //     reply: {
  //       root: response,
  //       parent: reply
  //     }
  //    }) 
  //   })
  //   removerCopypasta(index)
  // })

}

main()

// // A cada 3 minutos.
// const scheduleExpression = '*/3 * * * *'

// const job = new CronJob(scheduleExpression, () => {
//   console.log('Iniciando job')
//   main().then(() => {
//     console.log('Job finalizado')
//   }).catch((e) => {
//     console.log('Erro ao executar job', e)
//   })
// })

// job.start()