import { EditorialShell, SectionHeading } from "@/components/EditorialShell";

const days = [
  {
    date: "02 décembre 2026",
    items: [
      ["09 h – 10 h", "Accueil des invités."],
      ["10 h – 12 h", "Cérémonie d’ouverture", "moment presse – point presse dédié"],
      ["12 h 30 – 14 h", "Pause déjeuner."],
      ["14 h – 15 h 30", "PANEL 1", "L’usine cognitive et la résilience cyber-physique : pilier numérique de la souveraineté opérationnelle."],
      ["15 h 30 – 16 h", "Pause café & networking."],
      ["16 h – 17 h 30", "PANEL 2", "Souveraineté énergétique et stress hydrique : l’hydrogène vert au service du calcul souverain."],
      ["17 h 30 – 18 h 30", "Synthèse des panels."],
    ],
  },
  {
    date: "03 décembre 2026",
    items: [
      ["10 h – 12 h", "PANEL 3", "Métamorphose des compétences et agilité cognitive : structurer le capital humain de l’ingénierie de demain."],
      ["12 h – 14 h 30", "Pause déjeuner & visite des stands."],
      ["14 h 30 – 15 h", "Synthèse des panels."],
      ["15 h – 17 h", "Pause café & networking."],
    ],
  },
] as const;

export default function ProgrammePage() {
  return (
    <EditorialShell eyebrow="02—03 DÉCEMBRE 2026 / RABAT" title="Le programme." intro="Deux journées pour passer de la vision aux conversations qui la rendent possible." visual={<div className="programme-orbit"><span>02</span><span>03</span><i /></div>}>
      <SectionHeading index="01" title="Les temps forts" />
      <div className="programme-days">
        {days.map((day) => <article className="programme-day" key={day.date}>
          <h3>{day.date}</h3>
          <div className="programme-list">
            {day.items.map(([time, label, detail]) => <div className={`programme-row ${label.startsWith("PANEL") ?"is-panel" : ""}`} key={`${time}-${label}`}>
              <time>{time}</time><div><strong>{label}</strong>{detail ?<p>{detail}</p> : null}</div>
            </div>)}
          </div>
        </article>)}
      </div>
    </EditorialShell>
  );
}
