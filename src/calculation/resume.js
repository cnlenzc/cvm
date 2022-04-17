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

  const mensal = processaMensal(historico)
  const anual = processaAnual(historico)

  const filename = `data/fundos/indicadores/${cnpj}.json`
  fse.outputJsonSync(filename, {
    anual,
    mensal
  }, { spaces: 2 })
}

function processaMensal(historico) {
  const agrupamento = {}
  let diaAnterior
  for (const dia in historico) {
    const mes = dia.substr(0, 6)
    const quota = historico[dia].quota
    const quotaAnterior = historico[diaAnterior || dia].quota
    const rentabilidade = 100 * quota / quotaAnterior - 100
    agrupamento[mes] = agrupamento[mes] || { quotas: [], rentabilidades: [] }
    agrupamento[mes].quotas.push(quota)
    agrupamento[mes].rentabilidades.push(rentabilidade)
    agrupamento[mes].quota = quota
    agrupamento[mes].quotaComparacao = agrupamento[mes].quotaComparacao || quotaAnterior
    diaAnterior = dia
  }

  const resumoMensal = {}
  for (const mes in agrupamento) {
    const { quota, quotaComparacao, rentabilidades } = agrupamento[mes]
    const media = rentabilidades.reduce((acc, cur) => acc + cur, 0) / rentabilidades.length
    const varianca = rentabilidades.reduce((acc, cur) => acc + (cur - media) ** 2, 0)
    const desvioPadrao = Math.sqrt(varianca / rentabilidades.length)
    resumoMensal[mes] = {
      rendimento: 100 * quota / quotaComparacao - 100,
      quotaComparacao,
      quota,
      rendimentoDiario: { media, desvioPadrao, amostras: rentabilidades.length }
    }
  }

  return resumoMensal
}

function processaAnual(historico) {
  const agrupamento = {}
  let diaAnterior
  for (const dia in historico) {
    const ano = dia.substr(0, 4)
    const quota = historico[dia].quota
    const quotaAnterior = historico[diaAnterior || dia].quota
    const rentabilidade = 100 * quota / quotaAnterior - 100
    agrupamento[ano] = agrupamento[ano] || { quotas: [], rentabilidades: [] }
    agrupamento[ano].quotas.push(quota)
    agrupamento[ano].rentabilidades.push(rentabilidade)
    agrupamento[ano].quota = quota
    agrupamento[ano].quotaComparacao = agrupamento[ano].quotaComparacao || quotaAnterior
    diaAnterior = dia
  }

  const resumoAnual = {}
  for (const mes in agrupamento) {
    const { quota, quotaComparacao, rentabilidades } = agrupamento[mes]
    const media = rentabilidades.reduce((acc, cur) => acc + cur, 0) / rentabilidades.length
    const varianca = rentabilidades.reduce((acc, cur) => acc + (cur - media) ** 2, 0)
    const desvioPadrao = Math.sqrt(varianca / rentabilidades.length)
    resumoAnual[mes] = {
      rendimento: 100 * quota / quotaComparacao - 100,
      quotaComparacao,
      quota,
      rendimentoDiario: { media, desvioPadrao, amostras: rentabilidades.length }
    }
  }

  return resumoAnual
}

main()