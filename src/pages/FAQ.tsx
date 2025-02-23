import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Footer from "@/components/Footer";

const FAQ = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white/50 to-primary/10 relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(88,28,255,0.1),transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(123,97,255,0.1),transparent_50%)] pointer-events-none"></div>
      <div className="container mx-auto py-8 flex-grow relative">
        <h1 className="text-4xl font-bold text-center mb-8">Ofte Stillede Spørgsmål</h1>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-4">
            <AccordionItem value="item-1">
              <AccordionTrigger>Hvordan virker karakterestimatoren?</AccordionTrigger>
              <AccordionContent>
                Vores AI-drevne karakterestimator analyserer din opgave baseret på flere parametre, 
                herunder struktur, indhold, sprog og faglig dybde. Den sammenligner med tusindvis af 
                tidligere bedømte opgaver for at give et præcist estimat.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>Hvor præcis er estimatet?</AccordionTrigger>
              <AccordionContent>
                Vores system har en præcision på omkring 98% baseret på sammenligning med faktiske 
                karakterer. Dog er det vigtigt at huske, at det endelige resultat altid afhænger 
                af den individuelle bedømmers vurdering.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Hvad koster det at bruge tjenesten?</AccordionTrigger>
              <AccordionContent>
                Du kan få én gratis vurdering ved at oprette en konto. Derefter tilbyder vi 
                forskellige abonnementsmodeller, der passer til dine behov.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Hvordan beskytter I mine data?</AccordionTrigger>
              <AccordionContent>
                Vi tager databeskyttelse meget seriøst. Alle opgaver krypteres og gemmes sikkert, 
                og vi deler aldrig dine personlige oplysninger med tredjeparter. Se vores 
                privatlivspolitik for flere detaljer.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>Hvor lang tid tager en vurdering?</AccordionTrigger>
              <AccordionContent>
                En typisk vurdering tager kun få sekunder. I særligt travle perioder kan der 
                dog være en kort ventetid.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQ;
