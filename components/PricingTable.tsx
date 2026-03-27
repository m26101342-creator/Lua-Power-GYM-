import React from 'react';
import { Clock, Phone, Info, Swords, Dumbbell } from 'lucide-react';

export const PricingTable: React.FC = () => {
  const sections = [
    {
      title: "Ginásio Sem o personal Trainer",
      items: [
        { label: "Inscrição", price: "5.000,00 Kzs" },
        { label: "Mensalidade", price: "15.000,00 Kzs" },
      ]
    },
    {
      title: "Treino Funcional",
      items: [
        { label: "Inscrição", price: "5.000,00 Kzs" },
        { label: "Mensalidade", price: "10.000,00 Kzs" },
        { label: "Frequência", price: "2 vezes na semana" },
      ]
    },
    {
      title: "Musculação / Personal Trainer",
      items: [
        { label: "Inscrição", price: "5.000,00 Kz" },
        { label: "Mensalidade", price: "35.000,00 Kzs" },
      ]
    },
    {
      title: "DIÁRIA",
      items: [
        { label: "Diária", price: "2.000,00 Kz" },
        { label: "Diária / Personal Trainer", price: "3.000,00 Kzs" },
      ]
    },
    {
      title: "Musculação / Artes Marciais",
      note: "Sem o Personal Trainer para a Musculação",
      items: [
        { label: "Musculação + Kickboxing", price: "32.000,00 Kzs" },
        { label: "Musculação + Boxe", price: "32.000,00 Kzs" },
        { label: "Musculação + Judo", price: "26.000,00 Kzs" },
        { label: "Musculação + T. Funcional", price: "22.000,00 Kzs" },
        { label: "Geral", price: "45.000,00 Kzs" },
      ]
    },
    {
      title: "Artes Marciais",
      items: [
        { label: "Inscrição", price: "5.000,00 kzs" },
        { label: "Judo (3X semana)", price: "13.900,00 Kzs" },
        { label: "Judo (2X semana)", price: "11.000,00 Kzs" },
        { label: "Boxe (3X semana)", price: "20.000,00 Kzs" },
        { label: "Kickboxing / adultos (3X semana)", price: "20.000,00 Kzs" },
        { label: "Jiu-jitsu / adultos (3X semana)", price: "20.000,00 Kzs" },
        { label: "Jiu-jitsu / crianças (3X semana)", price: "12.000,00 Kzs" },
        { label: "Kickboxing / crianças (3X semana)", price: "12.000,00 Kzs" },
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-32">
      <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500 rounded-full blur-3xl translate-x-10 -translate-y-10 opacity-50"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Tabela de Preços</h2>
          <p className="text-emerald-100 text-sm opacity-80">Escolha o plano ideal para o seu objetivo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              {section.title.includes('Artes') || section.title.includes('Kickboxing') || section.title.includes('Judo') || section.title.includes('Boxe') ? <Swords className="w-5 h-5 text-emerald-500" /> : <Dumbbell className="w-5 h-5 text-emerald-500" />}
              {section.title}
            </h3>
            <div className="space-y-3">
              {section.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700 last:border-0">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{item.price}</span>
                </div>
              ))}
            </div>
            {section.note && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">{section.note}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-slate-900 dark:bg-black rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-900/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              Horário de Funcionamento
            </h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li className="flex justify-between"><span>Segunda a Sexta-feira:</span> <span className="text-white font-bold">05:30 às 21:00</span></li>
              <li className="flex justify-between"><span>Sábados e Feriados:</span> <span className="text-white font-bold">05:30 às 12:00</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-400" />
              Contacto
            </h3>
            <div className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Telefone / WhatsApp</p>
                <p className="text-lg font-bold text-white">921156899</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
