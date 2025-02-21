import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white/50 to-primary/10 relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(88,28,255,0.1),transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(123,97,255,0.1),transparent_50%)] pointer-events-none"></div>
      <div className="container mx-auto py-8 flex-grow relative">
        <h1 className="text-4xl font-bold text-center mb-8">Privatlivspolitik</h1>
        <div className="max-w-3xl mx-auto prose bg-white/80 backdrop-blur-sm rounded-lg p-8">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Dataansvarlig</h2>
            <p className="mb-4">
              TjekDinKarakter.dk er dataansvarlig for behandlingen af de personoplysninger, 
              som vi har modtaget om dig.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Indsamling af data</h2>
            <p className="mb-4">
              Vi indsamler følgende personoplysninger:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Navn og email ved oprettelse af konto</li>
              <li>Opgavetekster og beskrivelser du indsender</li>
              <li>Karakterhistorik og estimater</li>
              <li>Tekniske data om din brug af websitet</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Formål med databehandlingen</h2>
            <p className="mb-4">
              Vi behandler dine personoplysninger til følgende formål:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>At levere vores karakterestimerings-tjeneste</li>
              <li>At forbedre vores AI-model og tjenester</li>
              <li>At kommunikere med dig om din konto og vores tjenester</li>
              <li>At overholde lovkrav</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Dine rettigheder</h2>
            <p className="mb-4">
              Du har følgende rettigheder:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Ret til indsigt i dine personoplysninger</li>
              <li>Ret til berigtigelse af ukorrekte oplysninger</li>
              <li>Ret til sletning af dine oplysninger</li>
              <li>Ret til begrænsning af behandling</li>
              <li>Ret til dataportabilitet</li>
              <li>Ret til indsigelse mod behandling</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Kontakt</h2>
            <p className="mb-4">
              Hvis du har spørgsmål om vores behandling af dine personoplysninger, 
              er du velkommen til at kontakte os på privacy@tjekdinkarakter.dk
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;
