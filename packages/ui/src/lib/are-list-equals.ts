export function areListEquals(list1?: unknown[], list2?: unknown[]) {
  if (!list1 || !list2 || list1.length !== list2.length) return false

  const sortedList1 = list1.sort()
  const sortedList2 = list2.sort()

  return sortedList1.every((item, index) => item === sortedList2[index])
}
