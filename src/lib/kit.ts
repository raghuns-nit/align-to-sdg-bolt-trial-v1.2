import type { SCR, RecommendationResult } from '../types/domain'

export interface KitContent { template_id: string; template_name: string; scr_id: string; scr_name: string; elements: KitElement[] }
export interface KitElement { element_id: string; element_name: string; content: string; is_required: boolean; is_complete: boolean }
export interface KitValidationReport { status: 'READY' | 'VALIDATION_FAILED' | 'NOT_APPLICABLE'; checks: { element_id: string; element_name: string; status: 'PASS' | 'FAIL'; message: string }[] }

export function resolveTemplate(scrId: string): { template_id: string; template_name: string; template_type: string; scr_id: string; output_elements: string[] } {
  return { template_id: 'TPL-DEFAULT-V1', template_name: 'Sustainability Curriculum Recommendation Kit', template_type: 'STANDARD', scr_id: scrId, output_elements: ['sustainability_principle','underlying_mechanism','recommendation_trigger','core_ideas','boundary_conditions','pedagogical_guidance','assessment_suggestion'] }
}

export function generateKitContent(result: RecommendationResult, scr: SCR | undefined, template: any, teachingContext?: any): KitContent {
  const elements: KitElement[] = template.output_elements.map((elemId: string) => {
    const content = getElementContent(elemId, scr, result, teachingContext)
    return { element_id: elemId, element_name: elemId.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), content, is_required: true, is_complete: content.trim().length > 0 && !content.includes('[PLACEHOLDER]') }
  })
  return { template_id: template.template_id, template_name: template.template_name, scr_id: scr?.scr_id || result.recommended_scr_id, scr_name: scr?.name || result.recommended_scr_name, elements }
}

function getElementContent(elementId: string, scr: SCR | undefined, _result: RecommendationResult, tc?: any): string {
  if (!scr) return ''
  switch (elementId) {
    case 'sustainability_principle': return scr.sustainability_principle || scr.definition || ''
    case 'underlying_mechanism': return scr.underlying_mechanism || ''
    case 'recommendation_trigger': return scr.recommendation_trigger || ''
    case 'core_ideas': return scr.core_ideas || ''
    case 'boundary_conditions': return scr.boundary_conditions || ''
    case 'pedagogical_guidance': return `This recommendation integrates "${scr.sustainability_principle || scr.name}" into the curriculum.${tc?.pedagogical_approach ? ` Recommended approach: ${tc.pedagogical_approach}.` : ''}${tc?.activity_format ? ` Suggested format: ${tc.activity_format}.` : ''}`
    case 'assessment_suggestion': return `Assess student understanding of "${scr.name}" through application-based tasks.${tc?.assessment_preference ? ` Preference: ${tc.assessment_preference}.` : ''}`
    default: return ''
  }
}

export function validateKit(kit: KitContent): KitValidationReport {
  const checks = kit.elements.map((elem) => {
    if (!elem.is_required) return { element_id: elem.element_id, element_name: elem.element_name, status: 'PASS' as const, message: 'Not required' }
    if (!elem.is_complete || elem.content.trim().length === 0) return { element_id: elem.element_id, element_name: elem.element_name, status: 'FAIL' as const, message: 'Required element is incomplete' }
    return { element_id: elem.element_id, element_name: elem.element_name, status: 'PASS' as const, message: 'Complete' }
  })
  return { status: checks.every((c) => c.status !== 'FAIL') ? 'READY' : 'VALIDATION_FAILED', checks }
}
