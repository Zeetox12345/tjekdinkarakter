
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const Contact = () => {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Beskeden er sendt",
      description: "Vi vender tilbage til dig hurtigst muligt.",
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Kontakt Os</h1>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Send os en besked</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Navn
                </label>
                <Input id="name" placeholder="Dit navn" required />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <Input id="email" type="email" placeholder="din@email.dk" required />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1">
                  Besked
                </label>
                <Textarea
                  id="message"
                  placeholder="Skriv din besked her..."
                  className="min-h-[150px]"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Send Besked
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-6 text-center">
          <div>
            <h2 className="text-xl font-semibold mb-2">Email</h2>
            <p>kontakt@tjekdinkarakter.dk</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Adresse</h2>
            <p>Studiestræde 1</p>
            <p>1455 København K</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
