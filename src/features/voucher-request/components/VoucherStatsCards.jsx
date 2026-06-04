import { Card } from "../../../components/Card";

const cardStyles = {
  all: "from-slate-50 to-slate-100 text-slate-900",
  available: "from-emerald-50 to-emerald-100 text-emerald-900",
  assigned: "from-blue-50 to-blue-100 text-blue-900",
  used: "from-amber-50 to-amber-100 text-amber-900",
  expired: "from-rose-50 to-rose-100 text-rose-900",
};

export const VoucherStatsCards = ({ summary }) => {
  const cards = [
    { id: "all", label: "Total", value: summary.all },
    { id: "available", label: "Available", value: summary.available },
    { id: "assigned", label: "Assigned", value: summary.assigned },
    { id: "used", label: "Used", value: summary.used },
    { id: "expired", label: "Expired", value: summary.expired },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.id} className={`p-4 bg-gradient-to-br ${cardStyles[card.id]}`}>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{card.label}</p>
          <p className="text-3xl font-black mt-2 tracking-tight">{card.value}</p>
        </Card>
      ))}
    </div>
  );
};
