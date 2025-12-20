export class ReportGenerator {
  generateMarkdown(outputs: any[]): string {
    let markdown = '# Research Report\n\n';
    const citations: string[] = [];

    for (const output of outputs) {
      if (output.type === 'text') {
        markdown += output.text + '\n\n';
        if (output.annotations) {
          for (const annotation of output.annotations) {
            if (annotation.source && !citations.includes(annotation.source)) {
              citations.push(annotation.source);
            }
          }
        }
      }
    }

    if (citations.length > 0) {
      markdown += '### Citations\n';
      for (const source of citations) {
        markdown += `- ${source}\n`;
      }
    }

    return markdown.trim() + '\n';
  }
}
