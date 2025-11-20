interface Child {
  id: string
  firstName: string
  lastName: string
  isSubscribed: boolean
}

interface ChildrenSubscriptionManagerProps {
  subscribedChildren: Child[]
  notSubscribedChildren: Child[]
  isDirty: boolean
  isSubscriptionActive: boolean
  onMoveChildToSubscribed: (childIndex: number) => void
  onMoveChildToNotSubscribed: (childIndex: number) => void
}

export function ChildrenSubscriptionManager({
  subscribedChildren,
  notSubscribedChildren,
  onMoveChildToSubscribed,
  onMoveChildToNotSubscribed,
}: ChildrenSubscriptionManagerProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full gap-4">
        <div className="flex flex-1 flex-col gap-4 rounded-2xl">
          <p className="font-semibold text-gray-950">
            Enfants abonnés
            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {subscribedChildren.length}
            </span>
          </p>
          {subscribedChildren.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
              Aucun enfant abonné. Cliquez sur un enfant dans la colonne de droite pour
              l&apos;ajouter ici, puis cliquez sur « Enregistrer les modifications ».
            </div>
          ) : (
            subscribedChildren.map((child, index) => (
              <div
                key={child.id}
                className="flex cursor-pointer items-center justify-start gap-2 rounded-2xl bg-blue-50 p-4 transition-colors duration-300 hover:bg-blue-100"
                onClick={() => {
                  onMoveChildToNotSubscribed(index)
                }}
              >
                <p className="text-sm font-medium text-gray-700">{child.firstName}</p>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-1 flex-col gap-4 rounded-2xl">
          <p className="font-semibold text-gray-950">
            Enfants non abonnés
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
              {notSubscribedChildren.length}
            </span>
          </p>
          {notSubscribedChildren.map((child, index) => (
            <div
              key={child.id}
              className="flex cursor-pointer items-center justify-start gap-2 rounded-2xl bg-blue-50 p-4 transition-colors duration-300 hover:bg-blue-100"
              onClick={() => {
                onMoveChildToSubscribed(index)
              }}
            >
              <p className="text-sm font-medium text-gray-700">{child.firstName}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
