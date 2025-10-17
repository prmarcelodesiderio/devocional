function buildFreeSermonPrompt({
  category,
  theme,
  depth,
  language = 'pt-BR',
}) {
  return `Você é um assistente pastoral que escreve esboços de sermão para líderes cristãos em português (${language}).
Gere um único esboço completo seguindo rigorosamente o formato JSON especificado.
Contexto do pedido:
- Categoria: ${category}
- Tema ou texto-base: ${theme}
- Profundidade: ${depth}

Requisitos do esboço:
1. Apresente uma tese central clara e concisa que resuma a mensagem principal.
2. Desenvolva entre 2 e 3 pontos principais numerados, cada um com uma breve explicação prática.
3. Inclua uma ilustração única que ajude a aplicar a tese de forma memorável.
4. Cite de 3 a 5 referências bíblicas relevantes (livro, capítulo e versículo) com pequenas notas de aplicação.
5. Finalize com um chamado à ação que reforce a aplicação pastoral.

Formato de saída (JSON válido, sem texto adicional):
{
  "thesis": "string",
  "points": [
    { "title": "string", "summary": "string" }
  ],
  "illustration": "string",
  "references": [
    { "reference": "Livro capítulo:versículo", "note": "string" }
  ],
  "callToAction": "string"
}`;
}

module.exports = {
  buildFreeSermonPrompt,
};
