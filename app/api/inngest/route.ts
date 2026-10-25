import { serve } from "inngest/next"

import { inngest } from "@/lib/inngest/client"
import { functions } from "@/lib/inngest/functions"

// Must stay public (no withAuth): Inngest calls this endpoint itself.
export const { GET, POST, PUT } = serve({ client: inngest, functions })