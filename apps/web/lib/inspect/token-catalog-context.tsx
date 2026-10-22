'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { INSPECT_TOKEN_CATALOG, type InspectTokenOption } from './token-catalog'

const TokenCatalogContext = createContext<InspectTokenOption[]>(INSPECT_TOKEN_CATALOG)

export function TokenCatalogProvider({
  catalog,
  children,
}: {
  catalog: InspectTokenOption[]
  children: ReactNode
}) {
  return <TokenCatalogContext.Provider value={catalog}>{children}</TokenCatalogContext.Provider>
}

export function useInspectTokenCatalog(): InspectTokenOption[] {
  return useContext(TokenCatalogContext)
}
