// This file has been taken from https://gitlab.com/jiri.hajek/markdown-table-ts/-/blob/master/src/index.ts
// The project is compiling against es2020 and that causes ?? operator tom break
/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable github/array-foreach */
// eslint-disable-next-line no-shadow
enum Align {
  Left = 'left',
  Right = 'right',
  Center = 'center',
  None = 'none'
}

type Column = string

type Row = Column[]

interface Table {
  body: Row[]
  head: Row
}

interface GetTableInput {
  table: Table

  alignColumns?: boolean
  alignment?: Align[]
}

interface GetRowInput {
  columnsAmount: number
  row: Row

  alignment?: Align[]
  columnLengths?: number[]
}

interface GetAlignmentInput {
  columnsAmount: number

  alignment?: Align[]
  columnLengths?: number[]
}

interface GetColumnLengthsInput {
  allRows: Row[]
  maxColumnsAmount: number
}

class MarkdownTableError extends Error {
  constructor(m: string) {
    super(m)
    Object.setPrototypeOf(this, MarkdownTableError.prototype)
  }
}

const validateTable = (table: Table): void => {
  if (!table) {
    throw new MarkdownTableError("Missing 'table' property.")
  }

  if (!(table.head instanceof Array)) {
    throw new MarkdownTableError(`Expected table.head to be Array<Column>, got ${typeof table.head}`)
  }

  if (table.head.length < 1) {
    throw new MarkdownTableError(`Expected table to have at least 1 header, got ${table.head.length}`)
  }

  if (!(table.body instanceof Array)) {
    throw new MarkdownTableError(`Expected table.body to be Array<Row>, got ${typeof table.body}`)
  }

  const allRows = [table.head, ...table.body]

  allRows.forEach((row, rowIndex) => {
    if (!(row instanceof Array)) {
      throw new MarkdownTableError(`Expected row ${rowIndex} to be Array<string>, got ${typeof row}.`)
    }

    row.forEach((column, columnIndex) => {
      if (typeof column !== 'string') {
        throw new MarkdownTableError(
          `Expected column ${columnIndex} on row ${rowIndex} to be string, got ${typeof column}.`
        )
      }
    })
  })
}

const validateAlignment = (alignment: Align[] | undefined): void => {
  if (!alignment) {
    return
  }

  if (!(alignment instanceof Array)) {
    throw new MarkdownTableError(`Expected alignment to be undefined or Array<Align>, got ${typeof alignment}.`)
  }

  alignment.forEach((a, index) => {
    if (!Object.values(Align).includes(a)) {
      throw new MarkdownTableError(`Invalid alignment for column ${index}.`)
    }
  })
}

const validateGetTableInput = (params: GetTableInput): void => {
  if (!params) {
    throw new MarkdownTableError('Missing input parameters.')
  }

  validateTable(params.table)

  validateAlignment(params.alignment)

  if (typeof params.alignColumns !== 'undefined' && typeof params.alignColumns !== 'boolean') {
    throw new MarkdownTableError(
      `'alignColumns' must be either undefined or boolean, got ${typeof params.alignColumns}.`
    )
  }
}

const getMarkdownRow = (params: GetRowInput): string => {
  const alignment = params.alignment ? params.alignment : []

  let markdownRow = '|'
  for (let i = 0; i < params.columnsAmount; i += 1) {
    const column = params.row[i] ? params.row[i] : ''

    const isRight = alignment[i] === Align.Right
    const isCenter = alignment[i] === Align.Center

    const targetLength = params.columnLengths ? params.columnLengths[i] : column.length

    if (isRight) {
      markdownRow += ` ${column.padStart(targetLength)} |`
    } else if (isCenter) {
      markdownRow += ` ${column.padStart((targetLength + column.length) / 2).padEnd(targetLength)} |`
    } else {
      markdownRow += ` ${column.padEnd(targetLength)} |`
    }
  }

  return markdownRow
}

const getMarkdownAlignment = (params: GetAlignmentInput): string => {
  const alignment = params.alignment ? params.alignment : []

  let markdownAlignment = '|'
  for (let i = 0; i < params.columnsAmount; i += 1) {
    const isLeft = alignment[i] === Align.Left
    const isRight = alignment[i] === Align.Right
    const isCenter = alignment[i] === Align.Center

    const isLeftOrCenter = isLeft || isCenter
    const isRightOrCenter = isRight || isCenter

    const targetLength = params.columnLengths ? params.columnLengths[i] - 2 : 1

    markdownAlignment += isLeftOrCenter ? ' :' : ' -'
    markdownAlignment += '-'.padEnd(targetLength, '-')
    markdownAlignment += isRightOrCenter ? ': |' : '- |'
  }

  return markdownAlignment
}

const getColumnLengths = (params: GetColumnLengthsInput): number[] => {
  const columnLengths = new Array<number>(params.maxColumnsAmount).fill(3)

  for (let row = 0; row < params.allRows.length; row += 1) {
    for (let column = 0; column < params.allRows[row].length; column += 1) {
      columnLengths[column] = Math.max(columnLengths[column], params.allRows[row][column].length)
    }
  }

  return columnLengths
}

const getMarkdownTable = (params: GetTableInput): string => {
  validateGetTableInput(params)

  const headerColumns = params.table.head.length
  const rowColumns = params.table.body.map(row => row.length)

  const maxColumnsAmount = Math.max(headerColumns, ...rowColumns)

  const alignColumns = params.alignColumns || true

  const columnLengths = alignColumns
    ? getColumnLengths({
        allRows: [params.table.head, ...params.table.body],
        maxColumnsAmount
      })
    : undefined

  const markdownTableHead = getMarkdownRow({
    alignment: params.alignment,
    row: params.table.head,
    columnsAmount: maxColumnsAmount,
    columnLengths
  })

  const markdownTableAlignment = getMarkdownAlignment({
    alignment: params.alignment,
    columnsAmount: maxColumnsAmount,
    columnLengths
  })

  let markdownTableBody = ''
  params.table.body.forEach(row => {
    const markdownRow = getMarkdownRow({
      alignment: params.alignment,
      row,
      columnsAmount: maxColumnsAmount,
      columnLengths
    })
    markdownTableBody += `${markdownRow}\n`
  })

  return `${markdownTableHead}\n${markdownTableAlignment}\n${markdownTableBody}`.trimEnd()
}

export {Align, Column, Row, Table, MarkdownTableError, GetTableInput, getMarkdownTable}
