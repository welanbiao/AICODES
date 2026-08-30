import type { DrawTemplate } from '../types'
import { alphabetTemplates } from './alphabet'
import { shapeTemplates } from './shapeTemplates'

export const drawTemplates: DrawTemplate[] = [...shapeTemplates, ...alphabetTemplates]

export function templatesByCategory(category: string) {
  return drawTemplates.filter((t) => t.category === category)
}

export function getTemplate(id: string) {
  return drawTemplates.find((t) => t.id === id)
}
