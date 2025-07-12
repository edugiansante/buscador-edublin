import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { ArrowLeft, ArrowRight, MapPin, Plane, GraduationCap, Calendar, CheckCircle, Globe } from "lucide-react";

export interface OnboardingData {
  cidadeOrigem: string;
  paisDestino: string;
  cidadeDestino: string;
  ciaAerea: string;
  escola: string;
  mesAno: string;
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
  onBack: () => void;
}

const steps = [
  { id: 1, title: "Origem", description: "De onde você vai partir?" },
  { id: 2, title: "Destino", description: "Para onde você está indo?" },
  { id: 3, title: "Viagem", description: "Detalhes da sua viagem" },
  { id: 4, title: "Estudos", description: "Onde você vai estudar?" },
  { id: 5, title: "Data", description: "Quando você chega?" }
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

const airlines = [
  "TAM", "GOL", "Azul", "LATAM", "American Airlines", "Delta", "United", 
  "Air France", "Lufthansa", "KLM", "British Airways", "Iberia"
];

const months = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" }
];

// Generate years from 2026 onwards
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const startYear = Math.max(currentYear, 2026); // Ensure we start from at least 2026
  const years = [];
  for (let year = startYear; year <= startYear + 10; year++) {
    years.push(year.toString());
  }
  return years;
};

export function OnboardingFlow({ onComplete, onBack }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    cidadeOrigem: "",
    paisDestino: "",
    cidadeDestino: "",
    ciaAerea: "",
    escola: "",
    mesAno: ""
  });
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const progress = (currentStep / steps.length) * 100;
  const currentStepData = steps[currentStep - 1];

  const updateFormData = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === "paisDestino" && { cidadeDestino: "" })
    }));
  };

  const updateDateSelection = (month: string, year: string) => {
    if (month && year) {
      const mesAno = `${year}-${month}`;
      setFormData(prev => ({ ...prev, mesAno }));
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    updateDateSelection(month, selectedYear);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    updateDateSelection(selectedMonth, year);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.cidadeOrigem;
      case 2: return formData.paisDestino && formData.cidadeDestino;
      case 3: return formData.ciaAerea;
      case 4: return formData.escola;
      case 5: return selectedMonth && selectedYear;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(formData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const formatDisplayDate = () => {
    if (selectedMonth && selectedYear) {
      const monthName = months.find(m => m.value === selectedMonth)?.label;
      return `${monthName} de ${selectedYear}`;
    }
    return "";
  };

  return (
    <section className="py-16 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Progress header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={handlePrevious} className="text-gray-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Passo {currentStep} de {steps.length}
            </Badge>
          </div>
          
          <Progress value={progress} className="h-2 bg-gray-200">
            <div className="h-full bg-green-700 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </Progress>
          
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {steps.map((step, index) => (
              <span key={step.id} className={index + 1 <= currentStep ? "text-green-800" : ""}>
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Step content */}
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {currentStep === 1 && <MapPin className="h-8 w-8 text-green-800" />}
              {currentStep === 2 && <Globe className="h-8 w-8 text-green-800" />}
              {currentStep === 3 && <Plane className="h-8 w-8 text-green-800" />}
              {currentStep === 4 && <GraduationCap className="h-8 w-8 text-green-800" />}
              {currentStep === 5 && <Calendar className="h-8 w-8 text-green-800" />}
            </div>
            <CardTitle className="text-2xl text-gray-900">
              {currentStepData.title}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              {currentStepData.description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Step 1: Origem */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <Label htmlFor="cidade-origem" className="text-base">
                  Cidade de origem
                </Label>
                <Select onValueChange={(value) => updateFormData("cidadeOrigem", value)} value={formData.cidadeOrigem}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Selecione sua cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Step 2: Destino */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label htmlFor="pais-destino" className="text-base">
                    País de destino
                  </Label>
                  <Select onValueChange={(value) => updateFormData("paisDestino", value)} value={formData.paisDestino}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Selecione o país" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.paisDestino && (
                  <div className="space-y-4">
                    <Label htmlFor="cidade-destino" className="text-base">
                      Cidade de destino
                    </Label>
                    <Select onValueChange={(value) => updateFormData("cidadeDestino", value)} value={formData.cidadeDestino}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Selecione a cidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {destinationCities[formData.paisDestino as keyof typeof destinationCities]?.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Viagem */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <Label htmlFor="cia-aerea" className="text-base">
                  Companhia aérea (opcional)
                </Label>
                <Select onValueChange={(value) => updateFormData("ciaAerea", value)} value={formData.ciaAerea}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Selecione a companhia aérea" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao-sei">Ainda não sei</SelectItem>
                    {airlines.map(airline => (
                      <SelectItem key={airline} value={airline}>{airline}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Isso nos ajuda a encontrar pessoas no mesmo voo que você!
                </p>
              </div>
            )}

            {/* Step 4: Escola */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <Label htmlFor="escola" className="text-base">
                  Nome da escola ou instituição
                </Label>
                <Input
                  id="escola"
                  placeholder="Ex: EC Dublin, Kaplan International..."
                  className="h-12 text-base"
                  value={formData.escola}
                  onChange={(e) => updateFormData("escola", e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  Encontre colegas de classe antes mesmo de chegar!
                </p>
              </div>
            )}

            {/* Step 5: Data - New intuitive selector */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <Label className="text-base">
                  Quando você chega?
                </Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mes" className="text-sm text-gray-600">
                      Mês
                    </Label>
                    <Select onValueChange={handleMonthChange} value={selectedMonth}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Selecione o mês" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(month => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ano" className="text-sm text-gray-600">
                      Ano
                    </Label>
                    <Select onValueChange={handleYearChange} value={selectedYear}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Selecione o ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateYears().map(year => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {selectedMonth && selectedYear && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                    <p className="text-sm text-green-800">
                      <strong>Data selecionada:</strong> {formatDisplayDate()}
                    </p>
                  </div>
                )}
                
                <p className="text-sm text-gray-500">
                  Vamos encontrar pessoas chegando em datas próximas à sua.
                </p>
              </div>
            )}

            {/* Summary */}
            {formData.cidadeOrigem && formData.cidadeDestino && currentStep > 2 && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-800" />
                  <span className="text-sm font-medium text-green-900">Sua viagem</span>
                </div>
                <p className="text-sm text-green-800">
                  {formData.cidadeOrigem} → {formData.cidadeDestino}
                  {selectedMonth && selectedYear && (
                    <span> em {formatDisplayDate()}</span>
                  )}
                </p>
              </div>
            )}
          </CardContent>

          {/* Navigation */}
          <div className="px-6 pb-6">
            <Button 
              onClick={handleNext}
              disabled={!canProceed()}
              className="w-full h-12 bg-green-800 hover:bg-green-900 text-white"
              size="lg"
            >
              {currentStep === steps.length ? "Ver Resultados" : "Continuar"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}