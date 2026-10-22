import { GET as getMe, PATCH as patchMe } from '../../me/route'


/** Local account — Zaoly does not proxy suite federation profiles. Spec: zaoly-user-management.md */
export async function GET() {
  return getMe()
}

export async function PATCH(request: Request) {
  return patchMe(request)
}
