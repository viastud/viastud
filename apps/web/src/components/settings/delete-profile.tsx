import { DeleteProfileModal } from './delete-profile-modal'

export function DeleteProfile({ id }: { id: string }) {
  return (
    <div className="mt-16 flex w-4/5 flex-col items-start gap-4 pb-32">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold text-gray-950">Supprimer mon compte</h1>
        <p className="text-gray-700">
          Supprimer votre compte et toutes les données qui s&apos;y rapportent.
        </p>
      </div>

      <DeleteProfileModal id={id} />
    </div>
  )
}
