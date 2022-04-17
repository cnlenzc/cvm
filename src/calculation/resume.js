const fse = require('fs-extra')
const moment = require('moment')
const minhaCarteira = require('../config/carteiras-fundos/minhaCarteira')

function main() {
  try {
    console.log('processando fundos...')
    const cnpjs = new Set(minhaCarteira.map(fundo => fundo.cnpj).filter(c => c))
    let quant = 0
    cnpjs.forEach(cnpj => {
      ++quant % 10 === 0 && console.log(quant)
      processaFundo(cnpj)
    })
    console.log(`total: ${quant} fundos`)
  } catch (error) {
    console.error(error)
  }
}

function processaFundo(cnpj) {
  const historicoFilename = `data/fundos/historico/${cnpj}.json`
  const historico = fse.readJsonSync(historicoFilename, 'utf-8')

  const mensal = processaPeriodo({ historico, groupBy: dia => dia.substr(0, 6) })
  const anual = processaPeriodo({ historico, groupBy: dia => dia.substr(0, 4) })

  const filename = `data/fundos/indicadores/${cnpj}.json`
  fse.outputJsonSync(filename, {
    anual,
    mensal
  }, { spaces: 2 })
}

function processaPeriodo({ historico, groupBy }) {
  const agrupamento = {}
  let diaAnterior
  for (const dia in historico) {
    const periodo = groupBy(dia)
    const quota = historico[dia].quota
    const quotaAnterior = historico[diaAnterior || dia].quota
    const rentabilidade = 100 * quota / quotaAnterior - 100
    agrupamento[periodo] = agrupamento[periodo] || { quotas: [], rentabilidades: [] }
    agrupamento[periodo].quotas.push(quota)
    agrupamento[periodo].rentabilidades.push(rentabilidade)
    agrupamento[periodo].quota = quota
    agrupamento[periodo].quotaComparacao = agrupamento[periodo].quotaComparacao || quotaAnterior
    diaAnterior = dia
  }

  const resumoPeriodo = {}
  for (const periodo in agrupamento) {
    const { quota, quotaComparacao, rentabilidades } = agrupamento[periodo]
    const media = rentabilidades.reduce((acc, cur) => acc + cur, 0) / rentabilidades.length
    const varianca = rentabilidades.reduce((acc, cur) => acc + (cur - media) ** 2, 0)
    const desvioPadrao = Math.sqrt(varianca / rentabilidades.length)
    resumoPeriodo[periodo] = {
      rendimento: 100 * quota / quotaComparacao - 100,
      quotaComparacao,
      quota,
      rendimentoDiario: { media, desvioPadrao, amostras: rentabilidades.length }
    }
  }

  return resumoPeriodo
}

main()