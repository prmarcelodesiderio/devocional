const { Document, HeadingLevel, Packer, Paragraph, TextRun } = require('docx');
const { composeHeader, formatPoints, formatReferences } = require('./templates');

function createParagraph(text, options = {}) {
  return new Paragraph({ text, ...options });
}

async function buildDocxBuffer(sermon, metadata = {}) {
  const header = composeHeader(metadata);
  const points = formatPoints(sermon.points);
  const references = formatReferences(sermon.references);

  const children = [];

  children.push(
    new Paragraph({
      text: header.title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    })
  );

  children.push(createParagraph(`Categoria: ${header.category}`));
  children.push(createParagraph(`Profundidade: ${header.depth}`));
  children.push(new Paragraph(''));

  children.push(
    new Paragraph({ text: 'Tese', heading: HeadingLevel.HEADING_2, spacing: { after: 200 } })
  );
  children.push(createParagraph(sermon.thesis || ''));

  children.push(new Paragraph({ text: 'Pontos principais', heading: HeadingLevel.HEADING_2 }));
  points.forEach((point) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${point.index}. ${point.title}`, bold: true }),
          new TextRun({ text: ` — ${point.summary}` }),
        ],
        spacing: { after: 200 },
      })
    );
  });

  children.push(new Paragraph({ text: 'Ilustração', heading: HeadingLevel.HEADING_2 }));
  children.push(createParagraph(sermon.illustration || ''));

  children.push(new Paragraph({ text: 'Referências bíblicas', heading: HeadingLevel.HEADING_2 }));
  references.forEach((ref) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: ref.reference, bold: true }),
          new TextRun({ text: ` — ${ref.note}` }),
        ],
        spacing: { after: 100 },
      })
    );
  });

  children.push(new Paragraph({ text: 'Aplicação prática', heading: HeadingLevel.HEADING_2 }));
  children.push(createParagraph(sermon.callToAction || ''));

  const doc = new Document({
    creator: 'Logos AI',
    title: header.title,
    description: 'Esboço de sermão gerado pelo Logos AI',
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}

module.exports = {
  buildDocxBuffer,
};
