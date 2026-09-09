// Configurações do site — edite os valores abaixo.
//
// IMPORTANTE sobre segurança: a "anon key" do Supabase é feita para ficar
// pública no código do front-end (é assim que o Supabase funciona em sites
// estáticos). Quem protege os dados de verdade são as regras de RLS
// (Row Level Security) criadas em supabase/schema.sql — não a URL/chave
// estarem "escondidas". NUNCA coloque aqui a "service_role key".

window.APP_CONFIG = {
  // Painel do Supabase > Project Settings > API
  SUPABASE_URL: "https://fsahjrulfwyhttnykjvb.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzYWhqcnVsZnd5aHR0bnlranZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMTIwODcsImV4cCI6MjA5ODY4ODA4N30.vQ1xbEz-i7z0fAW4AEOIrcpQewABhb7NKU0cFZOPg6s",

  // Nomes usados no banco (ver supabase/schema.sql)
  TABLE_NAME: "evento_matozinhos_convidados",
  PUBLIC_VIEW_NAME: "evento_matozinhos_lista_publica",

  // Data/hora do evento (ISO, com fuso de Brasília -03:00)
  EVENT_DATE_ISO: "2026-10-10T18:00:00-03:00",

  // Textos livres, edite à vontade
  EVENT_NAME: "Reinauguração do Sítio",
  EVENT_LOCATION: "Sítio da família · Matozinhos, MG",
};
