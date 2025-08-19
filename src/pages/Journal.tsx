import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Journal = () => {
  const journalEntries = [
    {
      day: 1,
      date: "15 Mars 2024",
      title: "Arrivée à Amman",
      location: "Amman",
      activities: [
        "Atterrissage à l'aéroport Queen Alia",
        "Installation à l'hôtel dans le centre-ville",
        "Première promenade dans Downtown Amman",
        "Découverte du souk traditionnel"
      ],
      highlights: "Premier contact avec l'hospitalité jordanienne",
      mood: "Excité"
    },
    {
      day: 2,
      date: "16 Mars 2024", 
      title: "Jerash la magnifique",
      location: "Jerash",
      activities: [
        "Départ matinal vers Jerash",
        "Visite guidée des ruines romaines",
        "Théâtre sud et ses acoustiques incroyables",
        "Déjeuner dans un restaurant local"
      ],
      highlights: "L'arc d'Hadrien et les colonnes de l'Oval Plaza",
      mood: "Émerveillé"
    },
    {
      day: 3,
      date: "17 Mars 2024",
      title: "Château d'Ajloun et nature",
      location: "Ajloun",
      activities: [
        "Randonnée vers le château d'Ajloun",
        "Exploration de la forteresse médiévale",
        "Pause dans la réserve naturelle",
        "Observation de la faune locale"
      ],
      highlights: "Vue panoramique depuis les remparts",
      mood: "Aventurier"
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