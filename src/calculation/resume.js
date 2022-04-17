const fse = require('fs-extra')
const moment = require('moment')
const carteira = require('../config/carteiras-fundos/carteira')

function main() {
  try {
    console.log('processando fundos...')
    const cnpjs = new Set(carteira.map(fundo => fundo.cnpj).filter(c => c))
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
  const dozeMeses = processaPeriodo({
    historico,
    groupBy: dia => moment().diff(dia, 'days') < 367 ? '12meses' : null
  })

  const filename = `data/fundos/indicadores/${cnpj}.json`
  fse.outputJsonSync(filename, {
    dozeMeses,
    anual,
    mensal
  }, { spaces: 2 })
}

function processaPeriodo({ historico, groupBy }) {
  const agrupamento = []
  let histAnterior, agrup
  for (const hist of historico) {
    const periodo = groupBy(hist.dia)
    if (!periodo) {
      continue
    }
    const quotaAnterior = histAnterior?.quota || hist.quota
    const rentabilidade = 100 * hist.quota / quotaAnterior - 100
    if (periodo !== agrup?.resumo.periodo) {
      agrup = {
        resumo: {
          periodo
        },
        dadosParaComparacao: {
          dia: histAnterior?.dia || hist.dia,
          quota: quotaAnterior,
          patrimonio: histAnterior?.patrimonio || hist.patrimonio
        },
        rentabilidades: []
      }
      agrupamento.push(agrup)
    }
    agrup.rentabilidades.push(rentabilidade)
    agrup.resumo.patrimonio = hist.patrimonio
    agrup.resumo.quota = hist.quota
    agrup.resumo.capitacao = (agrup.resumo.capitacao || 0) + hist.capitacao
    agrup.resumo.resgate = (agrup.resumo.resgate || 0) + hist.resgate
    agrup.resumo.diaFinal = hist.dia
    histAnterior = hist
  }

  const resumoPeriodo = []
  for (const agrup of agrupamento) {
    const { resumo, rentabilidades, dadosParaComparacao } = agrup
    const { quota, patrimonio } = resumo
    const media = rentabilidades.reduce((acc, cur) => acc + cur, 0) / rentabilidades.length
    const variancia = rentabilidades.reduce((acc, cur) => acc + (cur - media) ** 2, 0)
    const desvioPadrao = Math.sqrt(variancia / rentabilidades.length)
    resumoPeriodo.push({
      ...resumo,
      dadosParaComparacao,
      rendimento: 100 * quota / dadosParaComparacao.quota - 100,
      variacaoPatrimonio: 100 * patrimonio / dadosParaComparacao.patrimonio - 100,
      variacaoQuotas: 100 * (patrimonio / quota) / (dadosParaComparacao.patrimonio / dadosParaComparacao.quota) - 100,
      rendimentoDiario: {
        media,
        desvioPadrao,
        amostras: rentabilidades.length
      }
    })
  }

  return resumoPeriodo.sort((a, b) => -a.periodo.localeCompare(b.periodo))
}

main()