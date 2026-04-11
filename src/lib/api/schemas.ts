import { z } from 'zod'

export const createContractSchema = z.object({
  clientName: z.string().min(2).max(200).trim(),
  serviceType: z.string().min(2).max(200).trim(),
  value: z.number().positive().max(50000000),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  paymentTerms: z.string().max(500).trim().optional(),
  description: z.string().max(2000).trim(),
})

export const createClientSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  email: z.string().email().optional(),
  document: z.string()
    .regex(/^\d{11}$|^\d{14}$/, 'CPF ou CNPJ inválido')
    .optional(),
  phone: z.string().max(20).optional(),
  client_type: z.enum(['PF', 'PJ']),
  state: z.string().length(2).toUpperCase().optional(),
})

export const createProposalSchema = z.object({
  clientName: z.string().min(2).max(200).trim(),
  serviceType: z.string().min(2).max(200).trim(),
  value: z.number().positive().max(50000000),
  deliverables: z.string().max(2000).trim(),
  timeline: z.string().max(200).trim().optional(),
  paymentTerms: z.string().max(500).trim().optional(),
})

export const signContractSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  document: z.string()
    .regex(/^\d{11}$/, 'CPF inválido'),
})

export const fiscalCalculateSchema = z.object({
  regime: z.enum(['MEI', 'Simples Nacional', 
    'Lucro Presumido', 'Autônomo/Carnê-Leão']),
  monthlyRevenue: z.number().positive().max(50000000),
  annualRevenue: z.number().positive().max(600000000).optional(),
  activityType: z.enum(['Serviços', 'Comércio+Indústria']),
  state: z.string().length(2).optional(),
})
