"use client"

import { useMemo } from "react"
import { usePersistHydrated } from "@/hooks/use-persist-hydrated"
import { useStorageSync } from "@/hooks/use-storage-sync"
import type { ISODate } from "../lib/time"
import { checkVoucher, type VoucherCheck } from "../lib/vouchers"
import { useVouchersStore } from "../store/vouchers-store"

/**
 * The guest's voucher code checked against vouchers bought on this device,
 * kept current when one is bought in another tab. Null until there's a code
 * and the store has loaded.
 */
export function useVoucherCheck(code: string | null, today: ISODate | null): VoucherCheck | null {
  const hydrated = usePersistHydrated(useVouchersStore.persist)
  useStorageSync(useVouchersStore.persist)
  const issued = useVouchersStore((state) => state.issued)
  const redemptions = useVouchersStore((state) => state.redemptions)
  return useMemo(
    () => (code && today && hydrated ? checkVoucher(code, issued, redemptions, today) : null),
    [code, today, hydrated, issued, redemptions],
  )
}
