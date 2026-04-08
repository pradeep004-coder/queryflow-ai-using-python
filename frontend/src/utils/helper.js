export const trimObjectValues = (obj) => {
  const trimmedObj = {};

  Object.keys(obj).forEach(key => {
    const value = obj[key];
    trimmedObj[key] = typeof value === "string" ? value.trim() : value;
  });

  return trimmedObj;
}

export const parseAnswer = (str) => {
  const lines = str.split('\n');
  const result = [];
  let codeBuffer = [];
  let inCodeBlock = false;
  let currentLang = 'plain';

  lines.forEach(line => {
    const trimmed = line.trim();

    if(trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (inCodeBlock) {
        currentLang = trimmed.replace('```', '').trim() || currentLang;
        codeBuffer = [];
      }
      else if (codeBuffer.length > 0) {
        result.push({ 
          type: 'code', 
          content: codeBuffer.join('\n'), 
          language : currentLang.charAt(0).toUpperCase() + currentLang.slice(1)
        });
        codeBuffer = [];
      }
      return;
    }

    if(inCodeBlock) { // Push code
      if (trimmed.includes('```')) {
        return;
      } 
       codeBuffer.push(line);
    }

    else if (trimmed.endsWith('```')) {
      return;
    }

     else if (trimmed.startsWith("##")) {
      result.push({ type: 't', content: line});
    }

    else if (/^\*\*(.+?)\*\*$/.test(trimmed) || /^\*\s+\*\*(.+?):\*\*$/.test(trimmed)) { // strict match '**content:**', '*   **`#include <stdio.h>`:**'
      result.push({ type: 'h1', content: line});
    }

    else if (/^\d+\.\s+\*\*(.+?)\*\*/.test(trimmed) || /^\d+\.\s+\*\*(.+?)\*\*/.test(trimmed)) { // strict match '1.  **content:**', '1.  **`#include <stdio.h>`**:'
      result.push({ type: 'h2', content: line});
    }

    else if (/^\s+\*\*(.+?):\*$/.test(trimmed)) { // strict match '  **content:*'
      result.push({ type: 'h3', content: line});
    }

    else if (trimmed != '```') {
       result.push({ type: 'para', content: line});
    }
  });

  return result;
};
