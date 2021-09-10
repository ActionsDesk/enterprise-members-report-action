import {ActionParams, OutputFormat} from './types'
import {generateReport} from './reporter'
;(async () => {
  try {
    process.env['GITHUB_TOKEN'] = '{{token}}'
    process.env['GITHUB_ACTION'] = 'test'
    const actionParams: ActionParams = {
      enterprise: 'droidpl',
      format: OutputFormat.MARKDOWN,
      licenseUsage: process.env.LICENSE_USAGE,
      licenseUsageChanged: process.env.LICENSE_USAGE_CHANGED
    }

    const output = await generateReport(actionParams)
    console.log(output)
  } catch (error) {
    console.log(error)
  }
})()
