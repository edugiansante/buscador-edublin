import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Search, MapPin, Plane, GraduationCap, Calendar } from "lucide-react";

interface SearchFormProps {
  onSearch: (searchData: SearchData) => void;
}

export interface SearchData {
  cidadeOrigem: string;
  paisDestino: string;
  cidadeDestino: string;
  ciaAerea: string;
  escola: string;
  mesAno: string;
}

const airlines = [
  "TAM", "GOL", "Azul", "LATAM", "American Airlines", "Delta", "United", 
  "Air France", "Lufthansa", "KLM", "British Airways", "Iberia"
];

const cities = [
  "São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte",
  "Manaus", "Curitiba", "Recife", "Goiânia", "Belém", "Porto Alegre"
];

const countries = [
  "Estados Unidos", "Canadá", "Reino Unido", "Irlanda", "Austrália", 
  "Nova Zelândia", "Malta", "França", "Alemanha", "Espanha", "Portugal"
];

const destinationCities = {
  "Estados Unidos": ["Nova York", "Los Angeles", "Miami", "San Francisco", "Boston", "Chicago"],
  "Canadá": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
  "Reino Unido": ["Londres", "Manchester", "Edinburgh", "Birmingham", "Brighton"],
  "Irlanda": ["Dublin", "Cork", "Galway", "Limerick"],
  "Austrália": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  "Nova Zelândia": ["Auckland", "Wellington", "Christchurch"],
  "Malta": ["Valletta", "Sliema", "St. Julian's"],
  "França": ["Paris", "Lyon", "Nice", "Toulouse"],
  "Alemanha": ["Berlim", "München", "Hamburg", "Köln"],
  "Espanha": ["Madrid", "Barcelona", "Valencia", "Sevilla"],
  "Portugal": ["Lisboa", "Porto", "Coimbra", "Braga"]
};

export function SearchForm({ onSearch }: SearchFormProps) {
  const [formData, setFormData] = useState<SearchData>({
    cidadeOrigem: "",
    paisDestino: "",
    cidadeDestino: "",
    ciaAerea: "",
    escola: "",
    mesAno: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(formData);
  };

  const updateFormData = (field: keyof SearchData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === "paisDestino" && { cidadeDestino: "" }) // Reset cidade when country changes
    }));
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl text-gray-900 mb-2">
              Encontre seu Companheiro de Viagem
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Preencha os dados abaixo para encontrar intercambistas com perfil similar
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cidade de Origem */}
                <div className="space-y-2">
                  <Label htmlFor="cidadeOrigem" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    Cidade de Origem
                  </Label>
                  <Select onValueChange={(value) => updateFormData("cidadeOrigem", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sua cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* País de Destino */}
                <div className="space-y-2">
                  <Label htmlFor="paisDestino" className="flex items-center gap-2">
                    <Plane className="h-4 w-4 text-blue-600" />
                    País de Destino
                  </Label>
                  <Select onValueChange={(value) => updateFormData("paisDestino", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o país" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cidade de Destino */}
                <div className="space-y-2">
                  <Label htmlFor="cidadeDestino" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    Cidade de Destino
                  </Label>
                  <Select 
                    onValueChange={(value) => updateFormData("cidadeDestino", value)}
                    disabled={!formData.paisDestino}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.paisDestino ? "Selecione a cidade" : "Selecione o país primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.paisDestino && destinationCities[formData.paisDestino as keyof typeof destinationCities]?.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Companhia Aérea */}
                <div className="space-y-2">
                  <Label htmlFor="ciaAerea" className="flex items-center gap-2">
                    <Plane className="h-4 w-4 text-blue-600" />
                    Companhia Aérea
                  </Label>
                  <Select onValueChange={(value) => updateFormData("ciaAerea", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a companhia" />
                    </SelectTrigger>
                    <SelectContent>
                      {airlines.map(airline => (
                        <SelectItem key={airline} value={airline}>{airline}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Escola */}
                <div className="space-y-2">
                  <Label htmlFor="escola" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                    Escola
                  </Label>
                  <Input
                    id="escola"
                    placeholder="Digite o nome da escola"
                    value={formData.escola}
                    onChange={(e) => updateFormData("escola", e.target.value)}
                  />
                </div>

                {/* Data de Chegada */}
                <div className="space-y-2">
                  <Label htmlFor="mesAno" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Data de Chegada (Mês/Ano)
                  </Label>
                  <Input
                    id="mesAno"
                    type="month"
                    value={formData.mesAno}
                    onChange={(e) => updateFormData("mesAno", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 w-full md:w-auto"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Buscar Companheiros
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}