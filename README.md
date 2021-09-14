# Enterprise members report action

Action to generate a report as markdown, html, csv or json with the members, outside collaborators and pending invites.

## Description

This action generates a report for an enterprise with the following elements:
- **Members**: a report of all users that are members of at least one org in the enterprise
- **Outside collaborators**: a compilation of all outside collaborators in all the orgs
- **Pending invites**: the list of all pending invites in all the orgs

## How to

This actions has the following inputs:

| Parameter           | Description                                                                                           | Default | Is Required |
|---------------------|-------------------------------------------------------------------------------------------------------|---------|-------------|
| token               | A personal access token with permissions on all the orgs of the enterprise                            | None    | ✅           |
| enterprise          | The enterprise where we want to generate the report                                                   | None    | ✅           |
| format              | Determines how the output parameter will be formatted. Supports: `json`, `markdown`, `csv` and `html` | None    | ✅           |
| licenseUsage        | Enterprise License consumption CSV contents                                                           | None    | ❎           |
| licenseUsageChanged | Enterprise License consumption CSV last changed date/time                                             | None    | ❎           |

This action has the following outputs:

| Parameter | Description                                                                                                    |
|-----------|----------------------------------------------------------------------------------------------------------------|
| data      | The data extracted from the license API calls in the format specified. The type of the output is always string |

Here you can see a workflow example using this action:

```yml
name: Report workflow
on: 
  schedule:
    # every Tuesday at 07:00 UTC
    - cron: '0 7 * * 3'

jobs:
  sendReport:
    runs-on: 'ubuntu-latest'
    steps:
    - name: Generate report
      id: report
      uses: ActionsDesk/enterprise-members-report-action@latest
      env:
        // The default GITHUB_TOKEN from actions doesn't work here as it does not have enough permissions
        GITHUB_TOKEN: ${{ secrets.YOUR_SECRET_TOKEN }}
      with:
        enterprise: avocado-corp
        format: 'html'
    # Then use ${{ steps.report.outputs.data }} to store/send the report somewhere
    - run: echo '${{ steps.report.outputs.data }}'
```

## License Consumption Merging

At present it is not possible to use the GitHub API to obtain the type of license a user is consuming. 
You can download the `consumed_licenses.csv` file from the enterprise portal, https://docs.github.com/en/billing/managing-your-license-for-github-enterprise/viewing-license-usage-for-github-enterprise, 
and the action can merge this information into the report. You will need to commit the `consumed_licenses.csv` to your repository, and update it when you need an up to date report.  

You will also need to ensure that the action has the content available for it, add the following step before you generate any reports:

```yml
      - name: Export license usage data
        run: | 
          if [[ -f consumed_licenses.csv ]]; then
            echo "LICENSEUSAGE_CSV<<EOF" >> $GITHUB_ENV
            cat consumed_licenses.csv >> $GITHUB_ENV
            echo "EOF" >> $GITHUB_ENV
            echo "LICENSEUSAGE_CSV_CHANGED=$(stat -c'%Y' consumed_licenses.csv | date -Iseconds)" >> $GITHUB_ENV
          fi
```

Then you can update the report generator with the extra settings:

```yml
      - name: Generate CSV report
        id: report_csv
        uses: ActionsDesk/enterprise-members-report-action@latest
        env:
          GITHUB_TOKEN: ${{ secrets.YOUR_SECRET_TOKEN }}
        with:
          enterprise: avocado-corp
          format: 'csv'
          licenseUsage: ${{ env.LICENSEUSAGE_CSV }}
          licenseUsageChanged: ${{ env.LICENSEUSAGE_CSV_CHANGED }}
```

A new column will be added to the generated report with type of licensed consumed by the user:

| Login         | Emails             | Orgs                         | Membership           | Created At           | License (2021-09-10T16:54:27+01:00) |
| ------------- | ------------------ | ---------------------------- | -------------------- | -------------------- | ----------------------------------- |
| gwenavocado   | gwen@avocado.com   | avocado-haas                 | member               | 2020-09-29T14:07:38Z | Visual Studio subscription          |
| fuerteavocado | fuerte@avocado.com | avocado-haas,avocado-zutano  | member               | 2020-10-14T21:25:58Z | Enterprise                          |
| toast         | fresh@toast.com    | avocado-zutano               | outside collaborator | 2020-10-14T21:25:58Z | Enterprise                          |

The variable `licenseUsageChanged` is optional and if supplied with be included in the `License` column header as a reference for when the `consumed_licenses.csv` file was last modified.

## Token permissions

The required scopes for this action to run are:
- `admin:enterprise`
- `admin:org`
- `read:user`
- `user:email`
