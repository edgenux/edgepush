export const ENDPOINT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const

export type EndpointStatus = typeof ENDPOINT_STATUS[keyof typeof ENDPOINT_STATUS]

export const STATUS_LABELS: Record<EndpointStatus, string> = {
  [ENDPOINT_STATUS.ACTIVE]: "正常",
  [ENDPOINT_STATUS.INACTIVE]: "禁用",
}

export const STATUS_COLORS: Record<EndpointStatus, string> = {
  [ENDPOINT_STATUS.ACTIVE]: "bg-secondary text-foreground",
  [ENDPOINT_STATUS.INACTIVE]: "bg-muted text-muted-foreground",
} 