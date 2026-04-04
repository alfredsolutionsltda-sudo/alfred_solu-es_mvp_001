# Processo de Deploy do Alfred

## Deploy normal
git add .
git commit -m "feat/fix: descrição"
git push origin main
→ Vercel faz deploy automático

## Verificar após deploy
1. Acessar /api/health → deve retornar {"status":"ok"}
2. Fazer login com conta de teste
3. Criar um contrato de teste
4. Verificar que o e-mail chegou

## Rollback de emergência
### Via Vercel Dashboard (mais fácil):
vercel.com → Deployments → deploy anterior → Promote

### Via CLI:
vercel rollback

### Via Git:
git revert HEAD
git push origin main

## Versões estáveis
- v1.0.0-mvp: Estado pré-testers (03/04/2026)
