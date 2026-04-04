import { z } from 'zod'

export const createContractSchema = z.object({
  clientName: z.string().min(2).max(200).trim(),
  serviceType: z.string().min(2).max(200).trim(),
  value: z.number().positive().max(50000000),
  description: z.string().max(2000).trim(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  paymentTerms: z.string().max(500).trim().optional(),
})

export const createClientSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  email: z.string().email().optional().or(z.literal('')),
  document: z.string()
    .regex(/^\d{11}$|^\d{14}$/, 'CPF ou CNPJ inválido')
    .optional(),
  client_type: z.enum(['PF', 'PJ']),
  state: z.string().length(2).toUpperCase().optional(),
})

export const signContractSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  document: z.string().regex(/^\d{11}$/, 'CPF inválido'),
})

export const fiscalCalculateSchema = z.object({
  regime: z.enum([
    'MEI', 'Simples Nacional', 
    'Lucro Presumido', 'Autônomo/Carnê-Leão'
  ]),
  monthlyRevenue: z.number().positive().max(50000000),
  activityType: z.enum(['Serviços', 'Comércio', 'Indústria']),
})
