import pdfkit from 'pdfkit';
import MarkdownIt from 'markdown-it';

interface ChatMessage {
  role: string;
  content: string;
  timestamp?: Date;
  model?: string;
}

/**
 * Export conversation as plain text
 */
export function exportAsText(messages: ChatMessage[]): string {
  return messages
    .map(msg => {
      const timestamp = msg.timestamp 
        ? msg.timestamp.toLocaleString() 
        : new Date().toLocaleString();
      
      return `${msg.role.toUpperCase()} (${timestamp}):\n${msg.content}\n\n`;
    })
    .join('');
}

/**
 * Export conversation as markdown
 */
export function exportAsMarkdown(messages: ChatMessage[]): string {
  let markdown = `# Conversation Export - ${new Date().toLocaleDateString()}\n\n`;
  
  messages.forEach(msg => {
    const timestamp = msg.timestamp 
      ? msg.timestamp.toLocaleString() 
      : new Date().toLocaleString();
    
    const role = msg.role === 'user' ? 'You' : 'Assistant';
    markdown += `## ${role} - ${timestamp}\n\n${msg.content}\n\n`;
    
    if (msg.model) {
      markdown += `*Model: ${msg.model}*\n\n`;
    }
  });
  
  return markdown;
}

/**
 * Export conversation as JSON
 */
export function exportAsJson(messages: ChatMessage[]): string {
  return JSON.stringify(messages, null, 2);
}

/**
 * Export conversation as PDF
 */
export async function exportAsPdf(messages: ChatMessage[]): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new pdfkit({ margin: 50 });
      const chunks: Uint8Array[] = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBlob = new Blob(chunks, { type: 'application/pdf' });
        resolve(pdfBlob);
      });
      
      // Add title
      doc.fontSize(24).text('Conversation Export', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);
      
      // Add messages
      messages.forEach(msg => {
        const timestamp = msg.timestamp 
          ? msg.timestamp.toLocaleString() 
          : new Date().toLocaleString();
        
        const role = msg.role === 'user' ? 'You' : 'Assistant';
        
        doc.fontSize(14).fillColor('#333').text(`${role} - ${timestamp}`, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#000').text(msg.content);
        
        if (msg.model) {
          doc.moveDown(0.5);
          doc.fontSize(10).fillColor('#666').text(`Model: ${msg.model}`);
        }
        
        doc.moveDown(1.5);
      });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Convert markdown to HTML
 */
export function markdownToHtml(markdown: string): string {
  const md = new MarkdownIt();
  return md.render(markdown);
}

/**
 * Download file
 */
export function downloadFile(content: string | Blob, filename: string): void {
  const element = document.createElement('a');
  
  if (typeof content === 'string') {
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
  } else {
    element.href = URL.createObjectURL(content);
  }
  
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}