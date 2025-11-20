import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@viastud/ui/form'
import { Input } from '@viastud/ui/input'
import { useEffect, useRef, useState } from 'react'
import type { Control, UseFormSetValue } from 'react-hook-form'

import type { CheckoutFormData } from '@/presenters/validation/checkout.schema'

interface AddressSuggestion {
  properties: {
    name: string
    postcode: string
    city: string
    context: string
  }
}

interface AddressApiResponse {
  features: AddressSuggestion[]
}

interface AddressFieldProps {
  control: Control<CheckoutFormData>
  setValue: UseFormSetValue<CheckoutFormData>
}

export function AddressField({ control, setValue }: AddressFieldProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSelectingSuggestion, setIsSelectingSuggestion] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Recherche d'adresses avec l'API Adresse.data.gouv.fr
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    try {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`
      )
      const data = (await response.json()) as AddressApiResponse
      setSuggestions(data.features ?? [])
    } catch {
      // Silently handle error and set empty suggestions
      setSuggestions([])
    }
  }

  // Gérer la saisie dans le champ rue
  const handleStreetChange = (value: string, onChange: (value: string) => void) => {
    if (!isSelectingSuggestion) {
      setSearchTerm(value)
      onChange(value)

      if (value.length >= 3) {
        void searchAddresses(value)
        setShowSuggestions(true)
      } else {
        setShowSuggestions(false)
      }
    }
  }

  // Sélectionner une suggestion
  const selectSuggestion = (suggestion: AddressSuggestion) => {
    const address = suggestion.properties

    setIsSelectingSuggestion(true)

    // Extraire le numéro et le nom de rue de l'adresse complète
    const addressParts = /^(\d+)\s+(.+)$/.exec(address.name)
    const extractedStreetNumber = addressParts ? addressParts[1] : undefined
    const streetName = addressParts ? addressParts[2] : address.name

    // Remplir les champs avec les données de la suggestion
    // Ne PAS écraser le numéro si non présent dans la suggestion
    if (extractedStreetNumber) {
      setValue('address.streetNumber', extractedStreetNumber)
    }
    setValue('address.street', streetName)
    setValue('address.postalCode', address.postcode)
    setValue('address.city', address.city)

    // Mettre à jour l'affichage du champ rue
    setSearchTerm(streetName)
    setShowSuggestions(false)

    // Réinitialiser le flag après un court délai
    setTimeout(() => {
      setIsSelectingSuggestion(false)
    }, 100)
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <h3 className="text-sm font-medium text-gray-700">Adresse postale*</h3>

      <div className="flex gap-4">
        <FormField
          control={control}
          name="address.streetNumber"
          render={({ field }) => (
            <FormItem className="flex flex-1 flex-col">
              <FormLabel className="text-sm font-medium text-gray-700">Numéro</FormLabel>
              <FormControl>
                <Input
                  className="shadow-custom w-full"
                  placeholder="123"
                  onChange={field.onChange}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="address.street"
          render={({ field }) => (
            <FormItem className="flex-2 relative flex flex-col">
              <FormLabel className="text-sm font-medium text-gray-700">Rue</FormLabel>
              <FormControl>
                <Input
                  className="shadow-custom w-full"
                  placeholder="Rue de la Paix"
                  onChange={(e) => {
                    handleStreetChange(e.target.value, field.onChange)
                  }}
                  value={searchTerm || field.value}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true)
                  }}
                />
              </FormControl>
              <FormMessage />

              {/* Suggestions d'adresses */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute left-0 right-0 top-full z-50 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full border-b border-gray-100 px-4 py-2 text-left last:border-b-0 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      onClick={() => {
                        selectSuggestion(suggestion)
                      }}
                    >
                      <div className="font-medium text-gray-900">{suggestion.properties.name}</div>
                      <div className="text-sm text-gray-600">
                        {suggestion.properties.postcode} {suggestion.properties.city}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </FormItem>
          )}
        />
      </div>

      <div className="flex gap-4">
        <FormField
          control={control}
          name="address.postalCode"
          render={({ field }) => (
            <FormItem className="flex flex-1 flex-col">
              <FormLabel className="text-sm font-medium text-gray-700">Code postal</FormLabel>
              <FormControl>
                <Input
                  className="shadow-custom w-full"
                  placeholder="75001"
                  onChange={field.onChange}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="address.city"
          render={({ field }) => (
            <FormItem className="flex-2 flex flex-col">
              <FormLabel className="text-sm font-medium text-gray-700">Commune</FormLabel>
              <FormControl>
                <Input
                  className="shadow-custom w-full"
                  placeholder="Paris"
                  onChange={field.onChange}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="address.country"
        render={({ field }) => (
          <FormItem className="flex w-full flex-col">
            <FormLabel className="text-sm font-medium text-gray-700">Pays</FormLabel>
            <FormControl>
              <Input
                className="shadow-custom w-full"
                placeholder="France"
                onChange={field.onChange}
                value={field.value}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
