
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto py-8 flex-grow">
        <h1 className="text-4xl font-bold text-center mb-8">Vilkår og Betingelser</h1>
        <div className="max-w-3xl mx-auto prose">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptér vilkår</h2>
            <p className="mb-4">
              Ved at bruge TjekDinKarakter.dk accepterer du disse vilkår og betingelser. 
              Hvis du ikke accepterer vilkårene, bør du ikke bruge tjenesten.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Tjenestebeskrivelse</h2>
            <p className="mb-4">
              TjekDinKarakter.dk er en AI-drevet karakterestimeringstjeneste, der giver 
              vejledende karakterestimater baseret på indsendte opgaver.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Brugeransvar</h2>
            <p className="mb-4">
              Som bruger er du ansvarlig for:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>At sikre, at du har rettighederne til det indhold, du indsender</li>
              <li>At holde dine loginoplysninger sikre</li>
              <li>At følge vores retningslinjer for brug</li>
              <li>At ikke misbruge eller overbelaste systemet</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Immaterielle rettigheder</h2>
            <p className="mb-4">
              Alt indhold og software på TjekDinKarakter.dk er beskyttet af ophavsret og 
              andre immaterielle rettigheder. Du må ikke kopiere, modificere eller distribuere 
              vores indhold uden tilladelse.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Ansvarsfraskrivelse</h2>
            <p className="mb-4">
              Karakterestimater er vejledende og gives uden garanti. Vi er ikke ansvarlige 
              for eventuelle forskelle mellem estimater og faktiske karakterer.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Ændringer af vilkår</h2>
            <p className="mb-4">
              Vi forbeholder os retten til at ændre disse vilkår når som helst. Fortsætter 
              du med at bruge tjenesten efter ændringer, accepterer du de nye vilkår.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Kontakt</h2>
            <p className="mb-4">
              Hvis du har spørgsmål til disse vilkår, kan du kontakte os på 
              terms@tjekdinkarakter.dk
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
