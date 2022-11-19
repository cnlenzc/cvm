const axios = require('axios')
const fse = require('fs-extra')
const moment = require('moment')

async function main() {
  try {
    console.log('downloading files...')
    for (let month = moment('2022-03-01'); month < moment(); month = month.add(1, 'M')) {
      console.log(month.format('YYYYMM'))
      const response = await axios.get(`http://dados.cvm.gov.br/dados/FI/DOC/INF_DIARIO/DADOS/inf_diario_fi_${month.format('YYYYMM')}.zip`)
      const filename = `data/cvm/inf_diario_fi_${month.format('YYYYMM')}.zip`
      fse.outputFileSync(filename, response.data)
    }
    console.log('the end')
  } catch (error) {
    console.error(error)
  }
}

main()