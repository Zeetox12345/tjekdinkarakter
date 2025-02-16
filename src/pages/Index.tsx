
import { Upload, AlertCircle, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="w-full py-6 px-4 sm:px-6 lg:px-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            TjekDinKarakter.dk
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Få en hurtig, AI-drevet vurdering af din opgave
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4">
              Upload din opgave og få øjeblikkelig feedback
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Vi bruger avanceret AI-teknologi til at give dig en hurtig karaktervurdering,
              så du kan forbedre din opgave før endelig aflevering.
            </p>
          </motion.div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Upload className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nem upload</h3>
            <p className="text-gray-600">
              Upload din opgave i DOC, DOCX eller PDF format med få klik
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Star className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Hurtig vurdering</h3>
            <p className="text-gray-600">
              Få en cirka-karakter og konstruktiv feedback på få sekunder
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <AlertCircle className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Vejledende feedback</h3>
            <p className="text-gray-600">
              Få indsigt i styrker og forbedringsmuligheder i din opgave
            </p>
          </Card>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            <Upload className="mr-2 h-5 w-5" /> Upload din opgave nu
          </Button>
          <p className="mt-4 text-sm text-gray-500">
            * Login påkrævet for at se din karaktervurdering
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold mb-4">Om os</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    Kontakt
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Juridisk</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    Privatlivspolitik
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    Vilkår & betingelser
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-gray-500">
              © {new Date().getFullYear()} TjekDinKarakter.dk. Alle rettigheder forbeholdes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
