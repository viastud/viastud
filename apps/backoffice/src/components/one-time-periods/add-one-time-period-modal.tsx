import { zodResolver } from '@hookform/resolvers/zod'
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
import { type AddOneTimePeriodSchema, addOneTimePeriodSchema } from '@viastud/utils'
import dayjs from 'dayjs'
import { CalendarIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

export const AddOneTimePeriodModal = ({ refresh }: BaseFormModalProps) => {
  const addOneTimePeriodForm = useForm<AddOneTimePeriodSchema>({
    resolver: async (data, context, options) => {
      return zodResolver(addOneTimePeriodSchema)(data, context, options)
    },
    defaultValues: {
      beginningOfRegistrationDate: '',
      beginningOfPeriodDate: '',
      endOfPeriodDate: '',
      isActive: false,
    },
  })

  const [open, setOpen] = useState(false)

  const { mutateAsync: addOneTimePeriodMutation } = trpc.oneTimePeriod.create.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
      addOneTimePeriodForm.reset()
    },
  })

  const onSubmit = async (data: AddOneTimePeriodSchema) => {
    await addOneTimePeriodMutation(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-9 min-w-9 rounded-full p-0">
          <PlusIcon className="size-4" color="#1D2CB6" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...addOneTimePeriodForm}>
          <form onSubmit={addOneTimePeriodForm.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-950">
                Ajouter une période one-time
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-start gap-4 self-stretch py-4">
              <FormField
                control={addOneTimePeriodForm.control}
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
                control={addOneTimePeriodForm.control}
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
                control={addOneTimePeriodForm.control}
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
                    control={addOneTimePeriodForm.control}
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
                Ajouter
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
