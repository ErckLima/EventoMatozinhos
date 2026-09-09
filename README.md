# Reinauguração do Sítio — Matozinhos 🎉

Página de confirmação de presença para a festa de reinauguração do sítio, em Matozinhos/MG, no dia **10/10/2026**. Site estático (HTML/CSS/JS puro) hospedado no GitHub Pages, com os dados guardados no Supabase.

## O que a página faz

- Qualquer pessoa pode se cadastrar informando **primeiro nome, último nome e telefone**.
- Lista pública de convidados (sem telefone visível) com selo **Pago / Pendente**.
- Barra de progresso animada: total de convidados = 100%, e o quanto já pagou.
- Contagem regressiva até o evento.
- Área do organizador (você) protegida por login — só você marca pagamento ou remove alguém.
- Lista atualiza sozinha em tempo real (Supabase Realtime).

## Status atual

- ✅ Repositório publicado: https://github.com/ErckLima/EventoMatozinhos
- ✅ GitHub Pages ativado: **https://ercklima.github.io/EventoMatozinhos/**
- ✅ `js/config.js` já com a URL do projeto Supabase (`fsahjrulfwyhttnykjvb`)
- ✅ `supabase/schema.sql` já com o e-mail do organizador preenchido (`erickfalubay@gmail.com`)
- ⬜ Faltam só os 2 passos abaixo, feitos direto no painel do Supabase (não automatizáveis por segurança — exigiriam expor chaves de acesso total à sua conta)

## Passo 1 — Criar o usuário admin

1. Abra [supabase.com/dashboard](https://supabase.com/dashboard) → seu projeto.
2. Vá em **Authentication > Users > Add user**.
3. Use o e-mail `erickfalubay@gmail.com` e a senha que você quer usar para logar como organizador no site.

## Passo 2 — Rodar o schema SQL

1. Vá em **SQL Editor** no painel do Supabase.
2. Cole o conteúdo de [supabase/schema.sql](supabase/schema.sql) (já vem com seu e-mail preenchido nas políticas de segurança).
3. Rode (**Run**).

Isso cria:
- a tabela `evento_matozinhos_convidados` (nome, sobrenome, telefone, pago, data);
- uma view pública `evento_matozinhos_lista_publica` sem telefone, usada na lista pública do site;
- regras de segurança (RLS): qualquer pessoa pode se cadastrar, só o seu login de admin pode ver telefones, marcar pagamento ou excluir.

## Passo 3 — Colar a anon key no site

1. No painel do Supabase, vá em **Project Settings > API**.
2. Copie a **anon public key**.
3. Abra [js/config.js](js/config.js) e cole no lugar de `SUA_ANON_KEY_AQUI`.
4. Suba a alteração para o GitHub (`git add js/config.js && git commit -m "adiciona anon key" && git push`).

> A `anon key` é feita para ser pública no código do site — quem protege os dados são as regras de RLS do passo 2, não o segredo da chave. **Nunca** use a `service_role key` no front-end nem a compartilhe.

Aproveite e edite também, se quiser, `EVENT_DATE_ISO`, `EVENT_NAME` e `EVENT_LOCATION` em `js/config.js`, e o texto no [index.html](index.html) (nome do sítio, endereço completo, etc). Compartilhe o link do site só com as pessoas convidadas — o cadastro é público para quem tiver o link.

## Como usar no dia a dia

- **Convidado**: abre o link, preenche nome/sobrenome/telefone, confirma.
- **Você (organizador)**: clica no cadeado 🔒 no canto inferior direito, entra com o e-mail/senha criados no Passo 1. Com isso, cada card da lista ganha os botões **Marcar pago** e **Remover**, e você passa a ver o telefone de cada convidado.

## Estrutura do projeto

```
index.html          página principal
css/style.css        estilos
js/config.js          credenciais e textos editáveis
js/app.js             lógica (cadastro, lista, progresso, login admin, tempo real)
supabase/schema.sql   script SQL para criar a tabela e as regras de segurança
```
