import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Journal = () => {
  const journalEntries = [
    {
      day: 1,
      date: "30 Juillet 2024",
      title: "Départ et arrivée à Amman",
      location: "Lyon → Paris CDG → Amman",
      activities: [
        "Départ de Lyon en train Ouigo (trajet décevant, inconfort)",
        "Vol Royal Jordanian depuis Paris CDG, embarquement porte C85",
        "Places rang 11 avec bon confort pour les jambes",
        "Atterrissage à l'aéroport Queen Alia d'Amman",
        "Prise en charge par contact de l'agence, formalités rapides",
        "Achat de carte SIM",
        "Trajet de 45 minutes jusqu'à l'hôtel avec chauffeur bavard parlant français",
        "Installation à l'hôtel et repos"
      ],
      highlights: "Premier contact avec la chaleur jordanienne et l'accueil chaleureux",
      mood: "Soulagé d'être arrivé",
      photos: [
        "📸 Embarquement pour Amman – Porte C85, Royal Jordanian"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950 dark:via-orange-950 dark:to-red-950">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-foreground">
            Journal de voyage
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Découvrez jour après jour mes aventures à travers la Jordanie, 
            terre d'histoire et de merveilles naturelles
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {journalEntries.map((entry) => (
            <Card key={entry.day} className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl mb-2">
                      Jour {entry.day} - {entry.title}
                    </CardTitle>
                    <CardDescription className="text-lg">
                      {entry.date} • {entry.location}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="ml-4">
                    {entry.mood}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <h4 className="font-semibold mb-3 text-lg">Activités du jour</h4>
                    <ul className="space-y-2">
                      {entry.activities.map((activity, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-muted-foreground">{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-lg">Moment fort</h4>
                    <p className="text-muted-foreground italic">
                      "{entry.highlights}"
                    </p>
                  </div>
                </div>
                
                {/* Photo du jour 1 - Embarquement */}
                {entry.day === 1 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3 text-lg">📸 Photo du jour</h4>
                    <div className="rounded-lg overflow-hidden shadow-md">
                      <div className="h-80 overflow-hidden">
                        <img 
                          src="/lovable-uploads/0b1d45f0-c3dd-413d-89aa-6d7a070b4f6d.png" 
                          alt="Salle d'embarquement Paris CDG - Porte C85, Royal Jordanian vers Amman"
                          className="w-full h-auto transform translate-y-[80px]"
                        />
                      </div>
                      <div className="p-3 bg-muted/50">
                        <p className="text-sm text-muted-foreground text-center">
                          Embarquement pour Amman – Porte C85, Royal Jordanian
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Cultural Note for Jerash */}
                {entry.day === 2 && (
                  <div className="mt-6 p-4 bg-primary/5 rounded-lg border-l-4 border-l-primary">
                    <h5 className="font-semibold mb-2 text-primary">💡 Note culturelle : Jerash</h5>
                    <p className="text-sm text-muted-foreground">
                      Jerash, anciennement appelée Gérasa, est l'une des villes de la Décapole les mieux préservées au monde. 
                      Fondée par Alexandre le Grand au 4ème siècle av. J.-C., elle a connu son apogée sous l'Empire romain. 
                      Le site abrite des monuments remarquables comme l'Arc d'Hadrien (129 ap. J.-C.) et l'Oval Plaza, 
                      une place ovale unique bordée de 56 colonnes ioniques.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Plus d'entrées bientôt... Le voyage continue !
          </p>
        </div>
      </div>
    </div>
  );
};

export default Journal;