import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

export async function generateDocx(
  title: string,
  date: string,
  sections: Record<string, boolean>,
  posts: any[]
) {
  const docSections: any[] = [];

  // Title Page
  docSections.push({
    properties: {},
    children: [
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        text: `Generated on: ${date}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 },
      }),
    ],
  });

  // Executive Summary
  if (sections.executiveSummary) {
    docSections[0].children.push(
      new Paragraph({ text: 'Executive Summary', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),
      new Paragraph({
        text: `This report analyzes ${posts.length} top-performing posts across various platforms. The insights gathered provide a comprehensive view of market trends, audience sentiment, and creative strategies.`,
      })
    );
  }

  // Post Analysis
  if (sections.postAnalysis) {
    docSections[0].children.push(
      new Paragraph({ text: 'Post Analysis', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } })
    );

    posts.forEach((post, index) => {
      docSections[0].children.push(
        new Paragraph({ text: `Post ${index + 1}: ${post.account_handle} (${post.platform})`, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: 'URL: ', bold: true }), new TextRun(post.post_url || 'N/A')] }),
        new Paragraph({ children: [new TextRun({ text: 'Virality Score: ', bold: true }), new TextRun(String(post.virality_score || 'N/A'))] }),
        new Paragraph({ children: [new TextRun({ text: 'Key Insight: ', bold: true }), new TextRun(post.key_insight || 'N/A')] }),
        new Paragraph({ children: [new TextRun({ text: 'Hook Analysis: ', bold: true }), new TextRun(post.hook_analysis || 'N/A')] })
      );
    });
  }

  // Audience Voice (Comments)
  if (sections.audienceVoice) {
    docSections[0].children.push(
      new Paragraph({ text: 'Audience Voice & Sentiment', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } })
    );

    posts.forEach((post, index) => {
      if (post.comments_summary) {
        docSections[0].children.push(
          new Paragraph({ text: `Audience Response - Post ${index + 1}`, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: 'Sentiment: ', bold: true }), new TextRun(post.comments_sentiment || 'N/A')] }),
          new Paragraph({ children: [new TextRun({ text: 'Summary: ', bold: true }), new TextRun(post.comments_summary || 'N/A')] }),
          new Paragraph({ children: [new TextRun({ text: 'Pain Points: ', bold: true }), new TextRun((post.comments_pain_points || []).join(', ') || 'N/A')] })
        );
      }
    });
  }

  // Creative Briefs
  if (sections.creativeBriefs) {
    docSections[0].children.push(
      new Paragraph({ text: 'Creative Evolution Briefs', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } })
    );

    posts.forEach((post, index) => {
      if (post.creative_evolution_brief) {
        docSections[0].children.push(
          new Paragraph({ text: `Brief ${index + 1} (Based on ${post.account_handle})`, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: 'Visual Theme: ', bold: true }), new TextRun(post.visual_theme || 'N/A')] }),
          new Paragraph({ children: [new TextRun({ text: 'Voiceover Theme: ', bold: true }), new TextRun(post.voiceover_theme || 'N/A')] }),
          new Paragraph({ text: post.creative_evolution_brief, spacing: { before: 100 } })
        );
      }
    });
  }

  const doc = new Document({
    sections: docSections,
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`);
}

export async function generatePdf(
  title: string,
  date: string,
  sections: Record<string, boolean>,
  posts: any[]
) {
  const doc = new jsPDF();
  let yPos = 20;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.width;
  const maxWidth = pageWidth - margin * 2;

  const addText = (text: string, fontSize: number, isBold: boolean = false, spacing: number = 10) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const lines = doc.splitTextToSize(text, maxWidth);
    
    // Check if we need a new page
    if (yPos + (lines.length * fontSize * 0.4) > doc.internal.pageSize.height - margin) {
      doc.addPage();
      yPos = margin;
    }
    
    doc.text(lines, margin, yPos);
    yPos += (lines.length * fontSize * 0.4) + spacing;
  };

  // Title
  addText(title, 24, true, 15);
  addText(`Generated on: ${date}`, 12, false, 20);

  // Executive Summary
  if (sections.executiveSummary) {
    addText('Executive Summary', 18, true, 10);
    addText(`This report analyzes ${posts.length} top-performing posts across various platforms. The insights gathered provide a comprehensive view of market trends, audience sentiment, and creative strategies.`, 12, false, 15);
  }

  // Post Analysis
  if (sections.postAnalysis) {
    addText('Post Analysis', 18, true, 10);
    posts.forEach((post, index) => {
      addText(`Post ${index + 1}: ${post.account_handle} (${post.platform})`, 14, true, 8);
      addText(`URL: ${post.post_url || 'N/A'}`, 10, false, 5);
      addText(`Virality Score: ${post.virality_score || 'N/A'}`, 10, false, 5);
      addText(`Key Insight: ${post.key_insight || 'N/A'}`, 10, false, 5);
      addText(`Hook Analysis: ${post.hook_analysis || 'N/A'}`, 10, false, 10);
    });
  }

  // Audience Voice
  if (sections.audienceVoice) {
    addText('Audience Voice & Sentiment', 18, true, 10);
    posts.forEach((post, index) => {
      if (post.comments_summary) {
        addText(`Audience Response - Post ${index + 1}`, 14, true, 8);
        addText(`Sentiment: ${post.comments_sentiment || 'N/A'}`, 10, false, 5);
        addText(`Summary: ${post.comments_summary || 'N/A'}`, 10, false, 5);
        addText(`Pain Points: ${(post.comments_pain_points || []).join(', ') || 'N/A'}`, 10, false, 10);
      }
    });
  }

  // Creative Briefs
  if (sections.creativeBriefs) {
    addText('Creative Evolution Briefs', 18, true, 10);
    posts.forEach((post, index) => {
      if (post.creative_evolution_brief) {
        addText(`Brief ${index + 1} (Based on ${post.account_handle})`, 14, true, 8);
        addText(`Visual Theme: ${post.visual_theme || 'N/A'}`, 10, false, 5);
        addText(`Voiceover Theme: ${post.voiceover_theme || 'N/A'}`, 10, false, 5);
        addText(`${post.creative_evolution_brief}`, 10, false, 10);
      }
    });
  }

  doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
}
