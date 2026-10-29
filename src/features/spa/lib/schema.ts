import { isValidPhone } from "@/lib/phone"
import { z } from "zod"
import { spaMessages, type SpaMessages } from "../i18n/messages"

export { isValidPhone }

export function createGuestDetailsSchema(messages: SpaMessages["validation"]) {
  return z.object({
    name: z.string().trim().min(2, messages.nameMin).max(80, messages.nameMax),
    email: z.string().trim().pipe(z.email(messages.email)),
    phone: z.string().trim().refine(isValidPhone, messages.phone),
    notes: z.string().trim().max(500, messages.notes).optional().or(z.literal("")),
    acceptPolicy: z.boolean().refine((value) => value, messages.policy),
  })
}

/** English messages; used wherever only validity matters. */
export const guestDetailsSchema = createGuestDetailsSchema(spaMessages.en.validation)

export type GuestDetails = z.infer<typeof guestDetailsSchema>
