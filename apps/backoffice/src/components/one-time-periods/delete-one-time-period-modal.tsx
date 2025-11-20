import type { OneTimePeriodDataDto } from '@viastud/server/routers/one_time_period_router'
import { trpc } from '@viastud/ui/lib/trpc'
import { DeleteModal } from '@viastud/ui/shared/delete-modal'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import dayjs from 'dayjs'
import { useState } from 'react'

interface IDeleteOneTimePeriodModalProps extends BaseFormModalProps {
  period: OneTimePeriodDataDto
}

export const DeleteOneTimePeriodModal = ({ refresh, period }: IDeleteOneTimePeriodModalProps) => {
  const [open, setOpen] = useState(false)
  const { mutateAsync: deleteUserMutation } = trpc.oneTimePeriod.delete.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
    },
  })

  const onSubmit = async () => {
    await deleteUserMutation(period.id)
  }

  return (
    <DeleteModal
      open={open}
      setOpen={setOpen}
      title={`Êtes-vous sûr de vouloir supprimer la période s'étendant du ${dayjs(period.beginningOfPeriodDate).format('DD/MM/YYYY')} au ${dayjs(period.endOfPeriodDate).format('DD/MM/YYYY')} ? Toutes les souscriptions associées seront effacées.`}
      onSubmit={onSubmit}
    />
  )
}
