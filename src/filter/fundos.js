const fs = require('fs')
const fse = require('fs-extra')
const moment = require('moment')
const carteira = require('../config/carteiras-fundos/carteira')

async function main() {
  try {
    console.log('reading files...')
    const cnpjs = new Set(carteira.map(fundo => fundo.cnpj).filter(c => c))
    const fundos = {}
    for (let month = moment('2017-01-01'); month < moment(); month = month.add(1, 'M')) {
      console.log(` ${month.format('YYYYMM')}.csv`)
      const filename = `data/cvm/inf_diario_fi_${month.format('YYYYMM')}.csv`
      fse.ensureFileSync(filename)
      const allFileContents = fs.readFileSync(filename, 'utf-8')
      allFileContents.split(/\r?\n/).forEach(line => {
        const [
          TP_FUNDO,
          CNPJ_FUNDO,
          DT_COMPTC,
          VL_TOTAL,
          VL_QUOTA,
          VL_PATRIM_LIQ,
          CAPTC_DIA,
          RESG_DIA,
          NR_COTST
        ] = line.split(';')
        const cnpj = (CNPJ_FUNDO || '').replace(/\D/g, '')
        if (cnpjs.has(cnpj)) {
          fundos[cnpj] = fundos[cnpj] || []
          fundos[cnpj].push({
            dia: DT_COMPTC.replace(/\D/g, ''),
            quota: Number(VL_QUOTA),
            total: Number(VL_TOTAL),
            patrimonio: Number(VL_PATRIM_LIQ),
            capitacao: Number(CAPTC_DIA),
            resgate: Number(RESG_DIA)
          })
        }
      })
    }

    console.log('processando fundos...')
    let quant = 0
    for (cnpj in fundos) {
      ++quant % 10 === 0 && console.log(quant)
      const filename = `data/fundos/historico/${cnpj}.json`
      fse.outputJsonSync(filename, fundos[cnpj])
    }
    console.log(`total: ${quant} fundos`)

    console.log('the end')
  } catch (error) {
    console.error(error)
  }
}

main()