export const RESERVED_GOTO_TARGETS = ['_close', '_back'] as const
export type ReservedGotoTarget = (typeof RESERVED_GOTO_TARGETS)[number]
export type GotoTarget = string
