import { EditorialShell, SectionHeading } from "@/components/EditorialShell";

const panels = [
  {
    number: "I",
    title: "L’IA et l’infrastructure des données : bâtir une souveraineté numérique durable",
    date: "02 décembre 2026 · 14 h 00 — 15 h 30",
    question: "Comment le Maroc peut-il concilier puissance de calcul, hébergement local et modèles d’IA adaptés pour garantir sa souveraineté numérique ?",
    summary: "Développer une IA utile et maîtrisée suppose de construire des fondations solides : des données de qualité, des infrastructures fiables et une gouvernance de confiance. Ce panel explore les choix technologiques, industriels et humains qui permettraient au Maroc de renforcer son autonomie numérique tout en maîtrisant l’impact environnemental de ses infrastructures.",
    topics: ["Hébergement des données, cloud et accès à la puissance de calcul.", "Gouvernance, cybersécurité et protection des données sensibles.", "Modèles d’IA adaptés aux langues et aux besoins des acteurs marocains.", "Sobriété énergétique et résilience des infrastructures numériques."],
  },
  {
    number: "II",
    title: "Souveraineté énergétique et stress hydrique : entre défis des ressources et ambitions de développement, quelle vision pour le Maroc de demain ?",
    date: "02 décembre 2026 · 16 h 00 — 17 h 30",
    question: "Quels arbitrages entre eau, énergie et développement pour construire une trajectoire durable et résiliente au Maroc ?",
    summary: "Les ambitions industrielles, agricoles et territoriales du Maroc invitent à penser ensemble la sécurité énergétique et la disponibilité de l’eau. Ce panel met en discussion les solutions techniques et les choix de gouvernance pour répondre aux besoins de développement, préserver les ressources et renforcer la capacité d’adaptation des territoires.",
    topics: ["Énergies renouvelables, stockage et adaptation des réseaux électriques.", "Dessalement, réutilisation des eaux usées et maîtrise des besoins énergétiques.", "Efficacité hydrique et énergétique dans l’industrie et l’agriculture.", "Complémentarité des usages, investissements et résilience des territoires."],
  },
  {
    number: "III",
    title: "Le capital humain au cœur de la transformation : quelles compétences pour l’ingénieur marocain capable de transformer la vision en réalité ?",
    date: "03 décembre 2026 · 10 h 00 — 12 h 00",
    question: "Quelles compétences et quel leadership faut-il développer pour transformer les visions stratégiques nationales en réalités industrielles ?",
    summary: "La transformation se concrétise grâce à des ingénieurs capables de relier expertise technique, compréhension du terrain et responsabilité collective. Ce panel interroge l’évolution des formations et des parcours professionnels pour préparer des talents capables de concevoir des solutions, de mobiliser des équipes et de mener les projets jusqu’à leur mise en œuvre.",
    topics: ["Maîtrise des fondamentaux, culture des données et usage critique de l’IA.", "Gestion de projets, communication et coopération entre disciplines.", "Éthique, responsabilité environnementale et compréhension des enjeux industriels.", "Liens école-entreprise, apprentissage continu et valorisation des talents marocains."],
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
