import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const feedbackSchema = z.object({
  suggestion: z.string().min(1, 'Sugestão é obrigatória'),
  context: z.string().optional(),
  impact: z.string().optional(),
  page: z.string().optional(),
  userEmail: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  if (!resend) {
    return NextResponse.json({ error: 'Serviço de email não configurado' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { suggestion, context, impact, page, userEmail } = feedbackSchema.parse(body)

    const feedbackEmail = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL || 'suporte@meusalario.com'

    const subject = `Feedback do MeuSalário${userEmail ? ` - ${userEmail}` : ''}`

    const emailBody = `
Olá, equipe!

Um usuário enviou feedback via formulário:

Sugestão:
${suggestion}

${context ? `Contexto: ${context}` : ''}

${page ? `Página/fluxo: ${page}` : ''}

${impact ? `Impacto: ${impact}` : ''}

${userEmail ? `Email do usuário: ${userEmail}` : ''}

Obrigado!
    `.trim()

    await resend.emails.send({
      from: 'feedback@meusalario.com', // Verificar domínio configurado no Resend
      to: feedbackEmail,
      subject,
      text: emailBody,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao enviar feedback:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}