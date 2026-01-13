// Funções de saudação personalizadas

export function getGreeting(): string {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) {
    return 'Bom dia'
  } else if (hour >= 12 && hour < 18) {
    return 'Boa tarde'
  } else {
    return 'Boa noite'
  }
}

export function getDisplayName(profile: { name?: string | null; email?: string | null }): string {
  if (profile.name) {
    return profile.name
  }
  
  // Fallback para email (pega a parte antes do @)
  if (profile.email) {
    return profile.email.split('@')[0]
  }
  
  return 'Usuário'
}
