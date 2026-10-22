import { NextResponse } from 'next/server'
import { SITE_KIT_CATALOG } from '../../../../lib/site-kit/write'


/** Spec `specs/api/site-kit-write.md` */
export async function GET() {
  return NextResponse.json({ components: SITE_KIT_CATALOG })
}
