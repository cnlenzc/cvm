const fse = require('fs-extra')
const moment = require('moment')
const carteira = require('../config/carteiras-fundos/carteira')

function main() {
  try {
    console.log('processando relatório...')
    const comparacaoFundos = []
    for (const fundo of carteira) {
      comparacaoFundos.push(processaFundo(fundo))
    }
    console.table(comparacaoFundos)
  } catch (error) {
    console.error(error)
  }
}

function processaFundo(fundo) {
  const filename = `data/fundos/indicadores/${fundo.cnpj}.json`
  const resumoFundo = fse.readJsonSync(filename, 'utf-8')

  const padrao = { periodo: '', rendimento: 0 }
  const dozeMeses = resumoFundo.dozeMeses[0]
  const anoAtual = resumoFundo.anual[0]
  const anoAnterior = resumoFundo.anual[1] || padrao
  const mes1 = resumoFundo.mensal[0]
  const mes2 = resumoFundo.mensal[1] || padrao
  const mes3 = resumoFundo.mensal[2] || padrao
  const mes4 = resumoFundo.mensal[3] || padrao

  return {
    "cnpj": fundo.cnpj,
    "nome": fundo.apelido,
    "12meses": Number(dozeMeses.rendimento.toFixed(2)),
    [" " + anoAtual.periodo]: Number(anoAtual.rendimento.toFixed(2)),
    [" " + anoAnterior.periodo]: Number(anoAnterior.rendimento.toFixed(2)),
    [" " + mes1.periodo.substr(4, 2)]: Number(mes1.rendimento.toFixed(2)),
    [" " + mes2.periodo.substr(4, 2)]: Number(mes2.rendimento.toFixed(2)),
    [" " + mes3.periodo.substr(4, 2)]: Number(mes3.rendimento.toFixed(2)),
    [" " + mes4.periodo.substr(4, 2)]: Number(mes4.rendimento.toFixed(2)),
    'risco': Number((dozeMeses.rendimentoDiario.desvioPadrao * 100).toFixed(0)),
    'patr': Number((dozeMeses.patrimonio / 1000000).toFixed(0)),
    'patrAnt': Number((dozeMeses.dadosParaComparacao.patrimonio / 1000000).toFixed(0)),
    'varQuotas': Number((dozeMeses.variacaoQuotas).toFixed(2)),
  }
}

main()