import {generateReport} from './reporter'
import {ActionParams, OutputFormat} from './types'
;(async () => {
  try {
    const actionParams: ActionParams = {
      enterprise: 'droidpl',
      token: '{{token}}',
      format: OutputFormat.HTML
    }
    console.log(await generateReport(actionParams))
  } catch (error) {
    console.log(error)
  }
})()
