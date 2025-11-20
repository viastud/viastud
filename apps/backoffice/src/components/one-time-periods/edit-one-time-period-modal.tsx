import { zodResolver } from '@hookform/resolvers/zod'
import type { OneTimePeriodDataDto } from '@viastud/server/routers/one_time_period_router'
import { Button } from '@viastud/ui/button'
import { Calendar } from '@viastud/ui/calendar'
import { Checkbox } from '@viastud/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@viastud/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@viastud/ui/form'
import { trpc } from '@viastud/ui/lib/trpc'
import { cn } from '@viastud/ui/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@viastud/ui/popover'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import { type EditOneTimePeriodSchema, editOneTimePeriodSchema } from '@viastud/utils'
import dayjs from 'dayjs'
import { CalendarIcon, Edit2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface IEditOneTimePeriodModalProps extends BaseFormModalProps {
  period: OneTimePeriodDataDto
}

export const EditOneTimePeriodModal = ({ period, refresh }: IEditOneTimePeriodModalProps) => {
  const editOneTimePeriodForm = useForm<EditOneTimePeriodSchema>({
    resolver: async (data, context, options) => {
      return zodResolver(editOneTimePeriodSchema)(data, context, options)
    },
    defaultValues: {
      id: period.id,
      beginningOfRegistrationDate: dayjs(period.beginningOfRegistrationDate).format('YYYY-MM-DD'),
      beginningOfPeriodDate: dayjs(period.beginningOfPeriodDate).format('YYYY-MM-DD'),
      endOfPeriodDate: dayjs(period.endOfPeriodDate).format('YYYY-MM-DD'),
      isActive: period.isActive,
    },
  })

  const [open, setOpen] = useState(false)

  const { mutateAsync: editOneTimePeriodMutation } = trpc.oneTimePeriod.edit.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
      editOneTimePeriodForm.reset()
    },
  })

  const onSubmit = async (data: EditOneTimePeriodSchema) => {
    await editOneTimePeriodMutation(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="none" size="icon">
          <Edit2 className="size-4" color="#3347FF" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...editOneTimePeriodForm}>
          <form onSubmit={editOneTimePeriodForm.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-950">
                Éditer une période one-time
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-start gap-4 self-stretch py-4">
              <FormField
                control={editOneTimePeriodForm.control}
                name="beginningOfRegistrationDate"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Date de début des inscriptions
                    </FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start gap-2 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon />
                            {field.value ? (
                              dayjs(field.value).format('DD/MM/YYYY')
                            ) : (
                              <span>Choisissez une date de début des inscriptions</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const localDateString = dayjs(date).format('YYYY-MM-DD')
                                field.onChange(localDateString)
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editOneTimePeriodForm.control}
                name="beginningOfPeriodDate"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Date de début
                    </FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start gap-2 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon />
                            {field.value ? (
                              dayjs(field.value).format('DD/MM/YYYY')
                            ) : (
                              <span>Choisissez une date de début</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const localDateString = dayjs(date).format('YYYY-MM-DD')
                                field.onChange(localDateString)
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editOneTimePeriodForm.control}
                name="endOfPeriodDate"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel className="text-sm font-medium text-gray-700">Date de fin</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start gap-2 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon />
                            {field.value ? (
                              dayjs(field.value).format('DD/MM/YYYY')
                            ) : (
                              <span>Choisissez une date de fin</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const localDateString = dayjs(date).format('YYYY-MM-DD')
                                field.onChange(localDateString)
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex w-full flex-col space-y-2">
                <p className="text-sm font-medium text-gray-700">Active</p>
                <div className="ransition-colors flex h-9 w-full items-center justify-between rounded-3xl border border-neutral-200 bg-transparent px-3 py-1">
                  <p className="text-sm">La période est la période one shot active</p>
                  <FormField
                    control={editOneTimePeriodForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-4">
              <DialogClose asChild className="flex grow">
                <Button variant="outline" className="text-sm font-semibold text-blue-800">
                  Annuler
                </Button>
              </DialogClose>
              <Button variant="default" className="flex grow text-sm font-semibold" type="submit">
                Éditer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
