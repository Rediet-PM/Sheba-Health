const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export const formatCurrency = (value: number, options?: Intl.NumberFormatOptions) => {
  const formatter =
    options && Object.keys(options).length > 0
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', ...options })
      : CURRENCY_FORMATTER
  return formatter.format(value)
}

export const formatPercent = (value: number, digits = 1) =>
  `${value >= 0 ? '+' : ''}${(value * 100).toFixed(digits)}%`

export const formatDate = (value: string) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
