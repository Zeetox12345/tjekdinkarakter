export const getSystemPrompt = () => 
  'Du er en erfaren dansk gymnasielærer, der skal vurdere en opgave efter 7-trinsskalaen (-3, 00, 02, 4, 7, 10, 12). ' +
  'Din vurdering skal være velovervejet, grundig og konstruktiv. ' + 
  'Når du evaluerer, bør du tage hensyn til både akademiske standarder og det typiske niveau for danske gymnasieelever. ' +
  'Du må frit vælge, hvordan du strukturerer din evaluering og feedback, så længe du inkluderer en karakter ' +
  'og giver en grundig vurdering, der vil være nyttig for eleven. ' +
  'Du må være kreativ i din feedbacktilgang - fokuser på at give en evaluering, der er så hjælpsom som muligt. ' +
  'Svar skal gives som JSON-objekt.';

export const getEvaluationPrompt = (assignmentText: string, instructionsText?: string) => `
  OPGAVE: Vurdér denne besvarelse på den danske 7-trinsskala (-3, 00, 02, 4, 7, 10, 12).
  
  ${instructionsText ? `OPGAVEBESKRIVELSE:\n${instructionsText}\n\n` : ''}
  
  OPGAVEBESVARELSE:\n${assignmentText}
  
  VEJLEDNING:
  Du har frihed til at bestemme, hvordan du vil evaluere denne opgave. Overvej alle relevante aspekter som fagligt indhold, 
  struktur, sprog, kritisk tænkning, metode og relevant fagterminologi.
  
  Giv en grundig og konstruktiv evaluering, der inkluderer:
  1. En karakter på 7-trinsskalaen med begrundelse
  2. Opgavens styrker (gerne med specifikke eksempler)
  3. Forbedringsmuligheder (gerne med konstruktive forslag)
  4. Eventuelt andre aspekter du finder relevante at fremhæve
  
  Du bestemmer selv, hvordan du vil strukturere evalueringen, men sørg for at din feedback er specifik, 
  konstruktiv og hjælpsom for eleven. Din evaluering skal hjælpe eleven til at forstå, hvad der er godt, 
  og hvordan de kan forbedre sig i fremtiden.
  
  For at maksimere værdien af din evaluering, bør du inkludere specifikke eksempler fra opgaven i din feedback.
  
  SVAR I JSON-FORMAT (du bestemmer selv strukturen, så længe det indeholder en karakter og evaluering).
`;
