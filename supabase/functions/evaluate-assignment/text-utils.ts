
export const sanitizeText = (text: string): string => {
  return text
    .replace(/\0/g, '')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    .normalize();
}

export const cleanJsonContent = (content: string): string => {
  if (content.startsWith('```json')) {
    return content.replace(/```json\n/, '').replace(/\n```$/, '');
  } 
  if (content.startsWith('```')) {
    return content.replace(/```\n/, '').replace(/\n```$/, '');
  }
  return content.trim();
}
