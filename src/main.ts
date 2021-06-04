import * as core from '@actions/core'
import {generateReport} from './reporter'
import {ActionParams, OutputFormat} from './types'

async function run(): Promise<void> {
  try {
    const token: string = core.getInput('token', {required: true})
    const enterprise: string = core.getInput('enterprise', {required: true})
    const formatString: string = core.getInput('format', {required: true})
    const format: OutputFormat = OutputFormat[formatString.toUpperCase() as keyof typeof OutputFormat]
    if (!format) {
      throw new Error(`Invalid format: ${formatString}`)
    }

    const params: ActionParams = {
      token,
      enterprise,
      format
    }
    const report = await generateReport(params)
    core.setOutput('data', report)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
