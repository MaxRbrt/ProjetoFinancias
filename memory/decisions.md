# Decisões

Registre decisões importantes aqui.

## 2026-03-30 - Implementação do Sistema de Memória Persistente

**Decisão:** Implementar um sistema de memória persistente para o Claude Code no projeto, com arquivos organizados na pasta `/memory`.

**Raciocínio:** O usuário solicitou que eu mantenha registro das decisões tomadas durante o desenvolvimento para que eu esteja sempre ciente do contexto em futuras conversas. Isso melhora a continuidade e evita retrabalho.

**Resultado Esperado:** Sistema estruturado que permita ao Claude consultar o histórico de decisões e contexto do projeto em cada nova sessão.

**Data de Revisão:** 2026-04-29 (30 dias)

## 2026-03-30 - Refatoração do Fluxo de Login/Cadastro

**Decisão:** Separar as telas de Login e Cadastro em views distintas com transição suave, substituindo o sistema de tabs.

**Raciocínio:** O usuário relatou dois problemas:
1. As duas telas (login e cadastro) apareciam juntas via tabs, causando confusão
2. O modal de sucesso aparecia sobre a tela de cadastro, deixando a tela de fundo visível e sem uma experiência de "conta criada com sucesso"

**Mudanças implementadas:**
- Tela de login inicial única com link "Não tem conta? Criar uma"
- Tela de cadastro separada com botão "Voltar para o login"
- Animação de transição suave entre as telas (fade-slide)
- Modal de sucesso em tela cheia com overlay escuro e efeito visual de celebração
- Botão "Entrar no app" no modal de sucesso (o usuário controla quando prosseguir)

**Resultado Esperado:** Fluxo de autenticação mais claro e profissional, com separação clara entre login e cadastro, e feedback visual apropriado ao criar conta.

**Data de Revisão:** 2026-04-29 (30 dias)

## 2026-03-31 - Adição de "Esqueceu a senha?"

**Decisão:** Implementar funcionalidade de redefinição de senha via e-mail na tela de login.

**Raciocínio:** O usuário solicitou um link "Esqueceu a senha?" abaixo do "Não tem conta? Criar uma", seguindo o padrão de sites grandes. Ao clicar, abre um modal para digitar o e-mail e enviar link de redefinição via Firebase Auth.

**Mudanças implementadas:**
- Import de `sendPasswordResetEmail` do Firebase Auth
- Novos estados: `modalReset`, `resetEmail`, `resetErro`, `resetSucesso`, `resetCarregando`
- Funções: `abrirResetSenha()`, `enviarResetSenha()`, `fecharResetSenha()`
- Link "Esqueceu a senha?" na tela de login
- Modal com campo de e-mail e confirmação de envio
- Estilos CSS para o novo link e modal

**Resultado Esperado:** Usuário pode recuperar acesso à conta recebendo link de redefinição de senha por e-mail.

**Data de Revisão:** 2026-04-30 (30 dias)

## 2026-03-31 - Correção do Arquivo LoginView.vue

**Decisão:** Corrigir erro de sintaxe no arquivo LoginView.vue que estava com código duplicado/quebrado.

**Raciocínio:** Na conversa anterior, o arquivo ficou com código HTML duplicado e tags `</button>` faltando, provavelmente devido a uma interrupção durante a edição. O arquivo estava com:
- Tags `</button>` faltando em vários lugares
- Código HTML duplicado no final (linhas 368-374)
- Estrutura quebrada após edições com `sed`

**Mudanças implementadas:**
- Reescrita completa do arquivo LoginView.vue com estrutura correta
- Todas as tags `</button>` restauradas
- Código duplicado removido
- Funcionalidade de "Esqueceu a senha?" funcionando corretamente

**Arquivos alterados:**
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\views\LoginView.vue`

**Resultado Esperado:** Tela de login funcionando corretamente com:
- Login normal
- Link para cadastro
- Link "Esqueceu a senha?" com modal de redefinição
- Modal de sucesso após cadastro

**Data de Revisão:** 2026-04-30 (30 dias)

## 2026-03-31 - Separação CSS do LoginView (Refatoração)

**Decisão:** Separar estilos CSS do componente LoginView.vue para um arquivo dedicado, deixando o código mais organizado e profissional.

**Raciocínio:** O usuário solicitou separar a lógica do CSS para facilitar manutenção e visualização. Isso é uma prática recomendada em projetos maiores.

**Mudanças implementadas:**
- Criada pasta `src/styles/views/`
- Criado arquivo `src/styles/views/LoginView.css` com todos os estilos de autenticação
- Atualizado `LoginView.vue` para importar o CSS externo
- Removido bloco `<style scoped>` do componente
- CSS organizado em seções com comentários: Container, Logo, Formulário, Modais, Animações

**Arquivos alterados:**
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\views\LoginView.vue`
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\styles\views\LoginView.css` (novo)

**Resultado Esperado:** Código mais limpo e organizado, facilitando manutenção futura.

**Data de Revisão:** 2026-04-30 (30 dias)

## 2026-03-31 - Separação CSS de Todas as Views (Refatoração Completa)

**Decisão:** Separar estilos CSS de todas as views do projeto para arquivos dedicados na pasta `styles/views/`.

**Raciocínio:** O usuário solicitou que a organização feita no LoginView fosse aplicada às outras views para manter consistência e facilitar manutenção.

**Mudanças implementadas:**
- Criados arquivos CSS para cada view:
  - `src/styles/views/DashboardView.css` - Cards, gráficos, análises
  - `src/styles/views/MetasView.css` - Progresso, metas, modais
  - `src/styles/views/PerfilView.css` - Avatar, seções, botões
- Atualizadas as views para importar seus respectivos CSS
- Removidos blocos `<style scoped>` de todos os componentes
- CSS organizado em seções com comentários descritivos

**Arquivos alterados:**
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\views\DashboardView.vue`
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\views\MetasView.vue`
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\views\PerfilView.vue`
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\styles\views\DashboardView.css` (novo)
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\styles\views\MetasView.css` (novo)
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\styles\views\PerfilView.css` (novo)

**Resultado Esperado:** Estrutura do projeto mais organizada e profissional, com código mais limpo e fácil de manter.

**Data de Revisão:** 2026-04-30 (30 dias)

## 2026-03-31 - Melhorias na Tela de Perfil (Refatoração Completa)

**Decisão:** Refatorar completamente a tela de Perfil com novo design, upload de foto, edição de nome e estatísticas.

**Raciocínio:** O usuário relatou que o celular não estava sendo salvo e pediu melhorias visuais. O cadastro só criava o usuário no Auth mas não salvava os dados adicionais no Firestore.

**Mudanças implementadas:**

1. **Correção no Cadastro (LoginView.vue):**
   - Adicionado campo de "Nome completo" no cadastro
   - Importado `setDoc` e `doc` do Firestore
   - Ao criar conta, agora salva no Firestore: nome, email, celular, fotoURL e criadoEm

2. **Nova Tela de Perfil (PerfilView.vue):**
   - **Upload de foto de perfil:** Integração com Firebase Storage, preview em tempo real, overlay de camera ao passar o mouse, loading durante upload
   - **Edição de nome:** Campo editável com botão de salvar/cancelar
   - **Celular corrigido:** Agora exibe o celular salvo no cadastro com edição funcional
   - **Estatísticas:** Grid com cards mostrando total de transações, total de metas e data de membro
   - **Design moderno:** Cards organizados, gradientes, sombras, hover effects
   - **Badge verificado:** Indicação visual ao lado do email
   - **Avatar dinâmico:** Mostra foto ou iniciais do nome (fallback inteligente)

3. **Novo CSS (PerfilView.css):**
   - Layout em grid para estatísticas
   - Card principal com gradiente verde
   - Animações de hover e transições suaves
   - Design responsivo para mobile
   - Ícones coloridos nas estatísticas (verde, azul, roxo)

**Arquivos alterados:**
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\views\LoginView.vue`
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\views\PerfilView.vue`
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\styles\views\PerfilView.css`

**Resultado Esperado:**
- Novos usuários terão nome e celular salvos corretamente no Firestore
- Tela de perfil moderna e profissional com foto, estatísticas e informações editáveis
- Experiência de usuário melhorada com feedback visual e animações

**Data de Revisão:** 2026-04-30 (30 dias)

## 2026-03-31 - Correção de Erro "Client is Offline" no Firebase

**Decisão:** Corrigir erro de conectividade do Firestore e melhorar o fluxo de autenticação.

**Raciocínio:** Usuário reportou erro "Failed to get document because the client is offline" ao tentar criar conta e acessar o perfil.

**Mudanças implementadas:**

1. **LoginView.vue:**
   - Importado `useAuthStore` para atualizar o estado após cadastro
   - Após criar conta, o `authStore.setUser(cred.user)` é chamado para manter o estado sincronizado

2. **PerfilView.vue:**
   - Adicionada verificação de `authStore.user?.uid` antes de carregar dados
   - Melhor tratamento de erros nas subcoleções (transações/metas)
   - Redirecionamento para login se usuário não estiver autenticado
   - Criação de dados fallback se documento não existir

3. **firebase/config.js:**
   - Habilitada persistência offline do Firestore com `enableIndexedDbPersistence`
   - Tratamento de erros para múltiplas abas ou navegador não suportado

**Arquivos alterados:**
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\views\LoginView.vue`
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\views\PerfilView.vue`
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\firebase\config.js`

**Nota:** Se o erro persistir, verificar se:
1. O Firestore está habilitado no console do Firebase
2. As regras de segurança permitem leitura/escrita
3. Não há bloqueio de rede/firewall

**Data de Revisão:** 2026-04-30 (30 dias)

## 2026-03-31 - Correções Completas na Tela de Perfil

**Decisão:** Corrigir múltiplos problemas na tela de perfil relatados pelo usuário.

**Problemas identificados e corrigidos:**
1. Dados do cadastro demoravam para aparecer no perfil (modal mostrava antes de salvar no Firestore)
2. Foto de perfil não estava sendo alterada (corrigido fluxo de upload)
3. Sem modal de confirmação após alterações (adicionado modal de sucesso)
4. Botões de salvar nome/celular não estavam salvando (adicionado loading states e melhor tratamento de erros)

**Mudanças implementadas:**

1. **LoginView.vue:**
   - Corrigido fluxo de cadastro: agora salva no Firestore ANTES de mostrar o modal de sucesso
   - Usuário só vê "Conta criada" após os dados estarem salvos

2. **PerfilView.vue (reescrito):**
   - Adicionado loading state inicial (`carregando`)
   - Adicionados estados de salvamento (`salvandoNome`, `salvandoCelular`, `salvandoSenha`)
   - Melhor tratamento de erros com mensagens específicas
   - Adicionado modal de sucesso após cada alteração
   - Logs de console para debug
   - Upload de foto com caminho único por usuário

3. **PerfilView.css:**
   - Adicionados estilos para loading state
   - Adicionados estilos para modal de sucesso

**Arquivos alterados:**
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\views\LoginView.vue`
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\views\PerfilView.vue`
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\styles\views\PerfilView.css`

**Resultado Esperado:**
- Dados do cadastro aparecem imediatamente no perfil
- Foto de perfil é atualizada corretamente
- Modal de confirmação aparece após salvar nome, celular ou senha
- Botões de salvar funcionam com feedback visual de loading

**Data de Revisão:** 2026-04-30 (30 dias)

## 2026-04-03 - Refatoração Completa da Tela de Perfil

**Decisão:** Refatorar completamente a tela de perfil corrigindo múltiplos problemas de design e implementando funcionalidades faltantes.

**Problemas identificados e corrigidos:**
1. CSS com classe `.error-text` mas template usava `.error-msg` — mensagens de erro não estilizadas
2. Layout quebrado em dispositivos móveis
3. Avatar sem funcionalidade de upload de foto
4. Estatísticas não funcionais (apenas layout, sem dados reais)
5. Design inconsistente com o padrão do projeto
6. Cards desalinhados e espaçamento irregular

**Mudanças implementadas:**

1. **PerfilView.vue (reescrito):**
   - Upload de foto funcional com Firebase Storage
   - Validação de tamanho de imagem (máx. 2MB)
   - Estatísticas dinâmicas buscando dados do Firestore (transações, metas)
   - Loading state durante carregamento dos dados
   - Salvamento de nome e celular no Firestore (não apenas localStorage)
   - Feedback visual durante salvamentos (estados de loading)
   - Tratamento de erros mais robusto

2. **PerfilView.css (reescrito):**
   - Corrigida classe `.error-msg` (antes `.error-text`)
   - Adicionada animação `slideIn` para mensagens
   - Layout responsivo completo para mobile (breakpoints 700px e 480px)
   - Avatar com overlay de câmera ao hover
   - Melhor espaçamento e alinhamento dos cards
   - Design consistente com o tema verde fintech do FinanceApp
   - Estados de hover e transições suaves
   - Grid de estatísticas responsivo (3 colunas → 1 coluna em mobile)

**Arquivos alterados:**
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\views\PerfilView.vue`
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\styles\views\PerfilView.css`

**Resultado Esperado:**
- Tela de perfil com design profissional e responsivo
- Upload de foto funcional com preview e loading
- Estatísticas reais de transações e metas
- Layout adaptado para desktop e mobile
- Mensagens de erro/sucesso estilizadas corretamente
- Experiência de edição fluida com feedback visual

**Data de Revisão:** 2026-05-03 (30 dias)

## 2026-04-03 - Reversão para localStorage no Perfil (Performance)

**Decisão:** Remover chamadas ao Firestore na tela de perfil e usar apenas Auth + localStorage para carregamento instantâneo.

**Motivo:** O Firestore na versão gratuita do Firebase é muito lento, causando delays significativos ao carregar dados do perfil. localStorage é instantâneo.

**Mudanças implementadas:**

1. **Removido do código:**
   - Importações de `getDoc`, `setDoc`, `collection`, `getDocs` do Firestore
   - Funções assíncronas de busca no Firestore
   - Loading state (`carregando`) que não era mais necessário

2. **Abordagem atual (rápida):**
   - **Nome e foto:** vêm do `authStore.user` (Auth - instantâneo)
   - **Celular:** salvo/lido do `localStorage` (instantâneo)
   - **Data de membro:** salva no `localStorage` no cadastro
   - **Contagem de transações/metas:** armazenada no `localStorage`

3. **Mantido:**
   - Upload de foto com Firebase Storage (funciona bem)
   - Alteração de senha com Firebase Auth (funciona bem)
   - Todos os estilos CSS corrigidos anteriormente

**Arquivos alterados:**
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\views\PerfilView.vue`

**Resultado Esperado:**
- Perfil carrega instantaneamente sem delay
- Dados persistem corretamente entre sessões
- Mesma experiência que tinha antes da refatoração com Firestore

**Data de Revisão:** 2026-05-03 (30 dias)

## 2026-04-03 - Migração de Transações e Metas para localStorage

**Decisão:** Migrar TransaçõesView e MetasView de Firestore para localStorage para evitar lentidão na versão gratuita do Firebase.

**Motivo:** O Firestore na versão gratuita tem latência alta, causando experiência ruim para o usuário. localStorage é instantâneo e gratuito.

**Mudanças implementadas:**

1. **TransacoesView.vue (reescrito):**
   - Removidas importações do Firestore (`onSnapshot`, `addDoc`, `updateDoc`, `deleteDoc`, etc.)
   - Adicionado sistema de armazenamento com localStorage
   - Funções `carregarDados()`, `salvarTransacoes()`, `salvarCategorias()`
   - IDs gerados localmente com `Date.now().toString(36) + Math.random().toString(36).substr(2)`
   - Atualização automática da contagem de transações para o perfil
   - `watch()` para recarregar dados quando o usuário muda

2. **MetasView.vue (reescrito):**
   - Removidas importações do Firestore
   - Adicionado sistema de armazenamento com localStorage
   - Funções `carregarDados()`, `salvarMetas()`
   - IDs gerados localmente
   - Atualização automática da contagem de metas para o perfil
   - `watch()` para recarregar dados quando o usuário muda

3. **Estrutura do localStorage:**
   - `user_{uid}_transacoes` — Array de transações
   - `user_{uid}_categorias` — Array de categorias
   - `user_{uid}_metas` — Array de metas
   - `user_{uid}_transacoes_count` — Contagem para o perfil
   - `user_{uid}_metas_count` — Contagem para o perfil

**Arquivos alterados:**
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\views\TransacoesView.vue`
- `C:\Users\Marcos\Documents\ProjetosVScode\ProjetoFinancias-main\FinanceApp\src\views\MetasView.vue`

**Resultado Esperado:**
- Carregamento instantâneo em todas as telas
- Sem limite de leituras do Firebase
- Dados persistentes no navegador
- Experiência fluida mesmo na versão gratuita do Firebase

**Data de Revisão:** 2026-05-03 (30 dias)
