import { EditorialShell, SectionHeading } from "@/components/EditorialShell";

const panels = [
  {
    number: "I",
    title: "L’IA et l’infrastructure des données",
    date: "02 décembre 2026 · 14 h 00 — 15 h 30",
    question: "Comment le Maroc peut-il concilier puissance de calcul, hébergement local et modèles d’IA adaptés pour garantir sa souveraineté numérique ?",
    summary: "À l’ère de l’intelligence artificielle, la donnée est devenue un levier stratégique majeur. Ce panel examine comment la puissance de calcul, l’hébergement local des données et le développement d’IA adaptées aux réalités linguistiques et culturelles nationales se renforcent mutuellement.",
    topics: ["Hébergement local et puissance de calcul souveraine.", "Adaptabilité des modèles d’IA aux réalités locales.", "Maintenance prédictive et résilience des infrastructures critiques."],
  },
  {
    number: "II",
    title: "Souveraineté énergétique et stress hydrique",
    date: "02 décembre 2026 · 16 h 00 — 17 h 30",
    question: "Comment concilier le développement d’infrastructures énergétiques et numériques à haute intensité avec la préservation des ressources en eau ?",
    summary: "Face aux défis climatiques et à la gestion des ressources, ce panel explore les moyens d’harmoniser ambitions de développement et durabilité : énergie propre, centres de données et agriculture connectée.",
    topics: ["Énergies renouvelables et infrastructures numériques.", "Agriculture connectée et optimisation de l’eau.", "Adoption des technologies par le secteur agricole."],
  },
  {
    number: "III",
    title: "Le capital humain au cÅ“ur de la transformation",
    date: "03 décembre 2026 · 10 h 00 — 12 h 00",
    question: "Quelles compétences et quel leadership faut-il développer pour transformer les visions stratégiques nationales en réalités industrielles ?",
    summary: "Ce panel dessine le profil de l’ingénieur de demain : un leader agile capable de piloter des projets complexes et de décider dans l’incertitude.",
    topics: ["Agilité, leadership et projets complexes.", "Cursus et partenariats académiques-industriels.", "Talents locaux et diaspora marocaine."],
  },
];

export default function PanelsPage() {
  return (
    <EditorialShell eyebrow="TROIS CONVERSATIONS / UNE MŠME TRAJECTOIRE" title="Les panels." intro="Des questions concrètes pour comprendre les infrastructures, les ressources et les compétences qui dessineront le Maroc de demain." visual={<div className="panel-index-art"><span>I</span><span>II</span><span>III</span></div>}>
      <SectionHeading index="02" title="Les conversations" />
      <div className="panel-grid">
        {panels.map((panel) => <article className="panel-card" key={panel.number}>
          <div className="panel-card-top"><span>Panel {panel.number}</span><time>{panel.date}</time></div>
          <h2>{panel.title}</h2>
          <blockquote>{panel.question}</blockquote>
          <p>{panel.summary}</p>
          <h3>Sujets abordés</h3>
          <ul>{panel.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
          <footer>Intervenants <strong>À annoncer prochainement.</strong></footer>
        </article>)}
      </div>
    </EditorialShell>
  );
}
