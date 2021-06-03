import {generateReport} from './reporter'
import {ActionParams} from './types'
;(async () => {
  try {
    const actionParams: ActionParams = {
      enterprise: 'droidpl',
      token: '{{token}}',
      emails: 'test@gmail.com',
      sender: 'droidpl@github.com',
      subject: 'Test',
      smtp_host: 'smtp.gmail.com',
      smtp_port: 25
    }
    await generateReport(actionParams)
  } catch (error) {
    console.log(error)
  }
})()
