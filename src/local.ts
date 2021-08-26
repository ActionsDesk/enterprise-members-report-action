import {ActionParams, OutputFormat} from './types'
import {generateReport} from './reporter'
;(async () => {
  try {
    const actionParams: ActionParams = {
      enterprise: 'droidpl',
      token: '{{token}}',
      format: OutputFormat.MARKDOWN
    }
    const output = await generateReport(actionParams)
    console.log(output)
  } catch (error) {
    console.log(error)
  }
})()
