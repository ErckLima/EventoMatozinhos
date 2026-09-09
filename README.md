# Reinauguração do Sítio — Matozinhos 🎉

Página de confirmação de presença para a festa de reinauguração do sítio, em Matozinhos/MG, no dia **10/10/2026**. Site estático (HTML/CSS/JS puro) hospedado no GitHub Pages, com os dados guardados no Supabase.

## O que a página faz

- Qualquer pessoa pode se cadastrar informando **primeiro nome, último nome e telefone**.
- Lista pública de convidados (sem telefone visível) com selo **Pago / Pendente**.
- Barra de progresso animada: total de convidados = 100%, e o quanto já pagou.
- Contagem regressiva até o evento.
- Área do organizador (você) protegida por login — só você marca pagamento ou remove alguém.
- Lista atualiza sozinha em tempo real (Supabase Realtime).

## Passo 1 — Criar a tabela no seu Supabase existente

Você não precisa criar um projeto novo no Supabase — o script abaixo cria só **uma tabela nova** (`evento_matozinhos_convidados`) dentro do projeto que você já tem, sem mexer no que já existe.

1. Abra seu projeto no [supabase.com](https://supabase.com/dashboard).
2. Vá em **Authentication > Users > Add user** e crie o seu usuário admin (o e-mail/senha que você vai usar para logar como organizador no site).
3. Vá em **SQL Editor** e abra o arquivo [supabase/schema.sql](supabase/schema.sql) deste repositório.
4. Troque todas as ocorrências de `TROQUE_PARA_SEU_EMAIL@exemplo.com` pelo e-mail que você cadastrou no passo 2.
5. Cole o script no SQL Editor e rode (**Run**).

Isso cria:
- a tabela `evento_matozinhos_convidados` (nome, sobrenome, telefone, pago, data);
- uma view pública `evento_matozinhos_lista_publica` sem telefone, usada na lista pública do site;
- regras de segurança (RLS): qualquer pessoa pode se cadastrar, só o seu login de admin pode ver telefones, marcar pagamento ou excluir.

## Passo 2 — Preencher as credenciais no site

1. No painel do Supabase, vá em **Project Settings > API**.
2. Copie a **Project URL** e a **anon public key**.
3. Abra [js/config.js](js/config.js) e cole os dois valores em `SUPABASE_URL` e `SUPABASE_ANON_KEY`.

> A `anon key` é feita para ser pública no código do site — quem protege os dados são as regras de RLS do passo 1, não o segredo da chave. **Nunca** use a `service_role key` no front-end.

Aproveite e edite também, se quiser, `EVENT_DATE_ISO`, `EVENT_NAME` e `EVENT_LOCATION` no mesmo arquivo, e o texto no [index.html](index.html) (nome do sítio, endereço completo, etc).

## Passo 3 — Publicar no GitHub Pages

1. Suba este repositório para o GitHub (crie o repo em github.com e faça o push).
2. No repositório, vá em **Settings > Pages**.
3. Em "Build and deployment", escolha **Deploy from a branch**, selecione a branch `main` e a pasta `/ (root)`.
4. Aguarde alguns minutos — o link vai aparecer na própria tela de Pages (algo como `https://SEU-USUARIO.github.io/EventoMatozinhos/`).

Compartilhe esse link só com as pessoas convidadas — o cadastro é público para quem tiver o link.

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
