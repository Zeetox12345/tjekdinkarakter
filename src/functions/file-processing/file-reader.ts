
import { convertPDFtoDOCX } from './pdf-converter';
import { readWordContent } from './word-processor';
import { readTextContent } from './text-processor';

export const readFileContent = async (file: File): Promise<string> => {
  try {
    console.log('Starting to read file:', file.name, file.type);
    
    if (file.type === 'application/pdf') {
      console.log('Converting PDF to DOCX...');
      const docxContent = await convertPDFtoDOCX(file);
      console.log('PDF converted to DOCX successfully');
      return docxContent;
    } else if (
      file.type === 'application/msword' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return await readWordContent(file);
    }
    
    return await readTextContent(file);
  } catch (error) {
    console.error('Error reading file:', file.name, error);
    throw new Error(`Unable to read file content: ${error.message}`);
  }
};
