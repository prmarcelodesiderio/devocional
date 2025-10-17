const PDFDocument = require('pdfkit');
const { composeHeader, formatPoints, formatReferences } = require('./templates');

function writeSectionTitle(doc, text) {
  doc.moveDown();
  doc.fontSize(16).font('Helvetica-Bold').text(text, { align: 'left' });
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(12);
}

function appendParagraph(doc, text) {
  doc.text(text, { align: 'justify' });
  doc.moveDown();
}

function createPdfStream(res, sermon, metadata = {}, filename) {
  const header = composeHeader(metadata);
  const points = formatPoints(sermon.points);
  const references = formatReferences(sermon.references);

  const doc = new PDFDocument({ margin: 50 });
  doc.info = {
    Title: header.title,
    Author: 'Logos AI',
    Subject: 'Esboço de sermão gerado pelo Logos AI',
  };

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

  doc.pipe(res);

  doc.fontSize(20).font('Helvetica-Bold').text(header.title, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).font('Helvetica').text(`Categoria: ${header.category}`);
  doc.text(`Profundidade: ${header.depth}`);

  writeSectionTitle(doc, 'Tese');
  appendParagraph(doc, sermon.thesis || '');

  writeSectionTitle(doc, 'Pontos principais');
  points.forEach((point) => {
    doc.font('Helvetica-Bold').text(`${point.index}. ${point.title}`);
    doc.font('Helvetica').text(point.summary, { indent: 12 });
    doc.moveDown(0.5);
  });

  writeSectionTitle(doc, 'Ilustração');
  appendParagraph(doc, sermon.illustration || '');

  writeSectionTitle(doc, 'Referências bíblicas');
  references.forEach((ref) => {
    doc.font('Helvetica-Bold').text(ref.reference);
    doc.font('Helvetica').text(ref.note, { indent: 12 });
    doc.moveDown(0.25);
  });

  writeSectionTitle(doc, 'Aplicação prática');
  appendParagraph(doc, sermon.callToAction || '');

  doc.end();
}

module.exports = {
  createPdfStream,
};
