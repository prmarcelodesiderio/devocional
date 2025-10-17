const OpenAI = require('openai');
const { envConfig } = require('../../config/env');
const { buildFreeSermonPrompt } = require('./promptFree');

let cachedClient;

function getOpenAIClient() {
  if (!envConfig.openaiApiKey || envConfig.openaiApiKey === 'replace_me') {
    return null;
  }

  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey: envConfig.openaiApiKey });
  }

  return cachedClient;
}

function buildFallbackSermon({ category, theme, depth }) {
  const baseReferences = [
    { reference: 'Mateus 5:14-16', note: 'Somos chamados a iluminar o mundo com boas obras.' },
    { reference: 'Romanos 12:2', note: 'Transformação pela renovação da mente para discernir a vontade de Deus.' },
    { reference: 'Salmos 37:5', note: 'Entregar os caminhos ao Senhor com confiança.' },
  ];

  return {
    thesis: `Em ${theme}, Deus nos chama a viver a fé com propósito ${category.toLowerCase()}.`,
    points: [
      {
        title: 'Dependência do Senhor',
        summary: 'Reconheça que somente na presença de Deus encontramos direção segura para cada passo.',
      },
      {
        title: 'Prática intencional da Palavra',
        summary: 'Aplique as Escrituras no cotidiano para que a fé seja percebida em atitudes concretas.',
      },
      {
        title: 'Impacto na comunidade',
        summary: 'Permita que a transformação pessoal alcance outras pessoas com esperança e serviço.',
      },
    ],
    illustration:
      'Imagine um lampião em uma noite escura: quando abastecido e aceso, torna-se referência para todos ao redor. Assim é a vida que se rende a Cristo.',
    references: baseReferences,
    callToAction:
      'Convide a igreja a comprometer-se com momentos diários de devoção, servindo uns aos outros com amor intencional.',
    metadata: {
      generator: 'fallback',
      depth,
    },
  };
}

async function generateFreeSermon({ category, theme, depth }) {
  const prompt = buildFreeSermonPrompt({ category, theme, depth });
  const client = getOpenAIClient();

  if (!client) {
    return { prompt, sermon: buildFallbackSermon({ category, theme, depth }) };
  }

  try {
    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content:
            'Você é um assistente pastoral que produz esboços bíblicos práticos e fiéis às Escrituras em português do Brasil.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'sermon_outline',
          schema: {
            type: 'object',
            required: ['thesis', 'points', 'illustration', 'references', 'callToAction'],
            properties: {
              thesis: { type: 'string' },
              points: {
                type: 'array',
                minItems: 2,
                maxItems: 3,
                items: {
                  type: 'object',
                  required: ['title', 'summary'],
                  properties: {
                    title: { type: 'string' },
                    summary: { type: 'string' },
                  },
                },
              },
              illustration: { type: 'string' },
              references: {
                type: 'array',
                minItems: 3,
                maxItems: 5,
                items: {
                  type: 'object',
                  required: ['reference', 'note'],
                  properties: {
                    reference: { type: 'string' },
                    note: { type: 'string' },
                  },
                },
              },
              callToAction: { type: 'string' },
            },
          },
        },
      },
    });

    const output = response.output?.[0]?.content?.[0]?.text;
    if (!output) {
      throw new Error('Resposta inesperada da API de IA.');
    }

    const parsed = JSON.parse(output);
    return { prompt, sermon: { ...parsed, metadata: { generator: 'openai', depth } } };
  } catch (error) {
    console.error('Erro ao gerar sermão com IA:', error.message);
    return { prompt, sermon: buildFallbackSermon({ category, theme, depth }) };
  }
}

module.exports = {
  generateFreeSermon,
};
