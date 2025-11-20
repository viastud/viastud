export interface Heading {
  value: string
  id: string
  depth: number
}

export interface OrganizedSection {
  main: Heading
  children: Heading[]
}
