export interface ProviderState {
  isFetching: boolean
  currentLanguage: any
}

export interface ContextApi extends ProviderState {
  setLanguage: (language: any) => void
  t: (key: string, data?: any) => string
}
