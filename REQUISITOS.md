### Documento de Requisitos: Aplicação de Gerenciamento de Finanças Pessoais (Vault)


### 1. Requisitos Funcionais (RF)
*O que o sistema faz. Cada funcionalidade é descrita com suas implicações de segurança.*

#### Módulo de Gestão de Dados Financeiros

- **RF05 - Inserção, Edição e Remoção Manual de Transações:**
    - O usuário pode registrar transações com valor, data, categoria e notas.
    - **Segurança:** Implementar validação e sanitização rigorosa de todos os inputs (server-side) para prevenir Cross-Site Scripting (XSS) e injeção de SQL (usando consultas parametrizadas). A integridade dos dados é crítica; transações financeiras editadas ou removidas devem ter um histórico de auditoria imutável (event sourcing) que registra `usuário_id`, `timestamp`, `ação` e os `dados_antes/depois`, que não pode ser apagado pelo usuário.

- **RF06 - Criação e Gestão de Orçamentos:**
    - O usuário pode definir limites de gastos por categoria e período.
    - **Segurança:** A lógica de notificação de estouro de orçamento deve executar no backend para evitar manipulação no frontend. Dados de orçamento são informação sensível e seguem o mesmo rigor de isolamento e criptografia dos demais dados financeiros.

#### Módulo de Dados e Privacidade
- **RF07 - Exportação de Dados:**
    - O usuário pode solicitar a exportação de todos os seus dados em formato estruturado (CSV, JSON).
    - **Segurança:** O processo de exportação deve ser assíncrono. O arquivo gerado deve ser criptografado com uma chave simétrica de uso único (Data Encryption Key - DEK). O link de download, enviado por e-mail, deve ser de uso único e ter expiração curta (ex: 1 hora), exigindo uma nova autenticação para acessá-lo. Um registro de auditoria deve ser criado.

- **RF08 - Exclusão Definitiva de Conta:**
    - O usuário pode excluir permanentemente sua conta e todos os dados associados.
    - **Segurança:** O processo deve exigir confirmação em duas etapas (senha + MFA) e implementar um período de carência (soft delete) de 30 dias, onde a conta é desativada mas os dados podem ser recuperados mediante processo de verificação rigoroso. Após o período, um job de "destruição criptográfica" deve ser executado: em vez de um `DELETE FROM`, a chave mestra que criptografa os dados do usuário no banco é excluída permanentemente, tornando os dados ilegíveis e irrecuperáveis.

---

### 2. Requisitos Não Funcionais (RNF)
*Como o sistema é. A segurança é a espinha dorsal que sustenta a qualidade.*

#### Segurança da Informação (Eixo Central)
- **RNF01 - Criptografia em Repouso (Dados no Banco):**
    - **Dados Sensíveis:** Dados financeiros, tokens de acesso a bancos e Informações Pessoalmente Identificáveis (PII) devem ser criptografados em nível de aplicação usando AES-256-GCM, com chaves de dados únicas por usuário (DEK), que por sua vez são criptografadas por uma Chave Mestra (KEK) armazenada em um Hardware Security Module (HSM) baseado em nuvem (ex: AWS KMS). Isso garante que, mesmo que o banco de dados vaze, os dados são inúteis sem acesso ao HSM.

- **RNF02 - Criptografia em Trânsito:**
    - Toda a comunicação entre cliente-servidor e servidor-servidor deve ser exclusivamente sobre TLS 1.3, com cifras fortes e HSTS (HTTP Strict Transport Security) habilitado no frontend. Certificados devem ser gerenciados automaticamente com renovação e revogação.

- **RNF03 - Proteção contra Ameaças Comuns:**
    - A aplicação deve ser inerentemente resiliente ao OWASP Top 10. Isso implica em:
        - **Prevenção contra CSRF:** Tokens síncronos (Double Submit Cookie Pattern) para mutações de estado.
        - **Cabeçalhos de Segurança:** `Content-Security-Policy` (CSP) restritiva, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
        - **Rate Limiting:** Rigoroso em endpoints de autenticação, recuperação de senha e MFA.
- **RNF04 - Logs e Auditoria de Segurança:**
    - Todos os eventos de segurança (logins, falhas, mudanças de permissão, acesso a dados sensíveis) devem ser logados de forma estruturada e à prova de adulteração, enviados para um sistema de Security Information and Event Management (SIEM) segregado. **Nenhum dado financeiro ou PII pode ser escrito em logs.**
- **RNF05 - Gestão de Dependências:**
    - Implementar um processo de SCA (Software Composition Analysis) automatizado no CI/CD para identificar e corrigir vulnerabilidades em bibliotecas de terceiros em tempo hábil (ex: usando Dependabot e OWASP Dependency-Check com política de falha de build para níveis crítico/alto).

#### Performance e Infraestrutura
- **RNF06 - Isolamento de Dados (Multi-tenancy):**
    - A arquitetura de banco de dados deve ser `schema-per-tenant` ou usar Row-Level Security (RLS) robusta, garantindo que um usuário sob hipótese alguma acesse dados de outro, prevenindo vazamento acidental por bug de IDOR (Insecure Direct Object Reference). Cada query deve ter uma política de visibilidade validada pelo contexto da sessão autenticada, e não apenas pelo ID do registro.

- **RNF07 - Alta Disponibilidade e Disaster Recovery:**
    - A infraestrutura deve ser projetada para ser multi-AZ (Zona de Disponibilidade). Os dados do banco de dados e do HSM devem ter backups criptografados automatizados, com testes regulares de restauração. O RPO (Recovery Point Objective) deve ser < 1 hora e o RTO (Recovery Time Objective) < 4 horas.

#### Usabilidade e Confiabilidade
- **RNF08 - Transparência e Consentimento:**
    - As permissões de acesso a dados (especialmente no contexto de Open Finance) devem ser apresentadas ao usuário em linguagem clara, no momento do uso, com a possibilidade de revogação a qualquer momento. Um painel deve mostrar todas as permissões ativas e os dispositivos/sessões autenticados, com opção de encerrá-los remotamente.

- **RNF09 - Prontidão para Conformidade (Privacy by Design):**
    - A arquitetura deve ser construída para facilitar a conformidade com regulações como a LGPD. Isso significa que os princípios de minimização de dados, limitação de finalidade e direitos do titular (acesso, correção, exportação, exclusão - ver RF07 e RF08) são fundamentos arquiteturais, não funcionalidades adicionais.
