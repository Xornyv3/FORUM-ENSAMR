import { EditorialShell, SectionHeading } from "@/components/EditorialShell";

const filieres = ["Génie mécanique", "Génie électrique et industries numériques", "Génie biomédical", "Ingénierie automobile et aéronautique", "Ingénierie des matériaux et qualité", "Ingénierie numérique en Data Science, Intelligence Artificielle et Santé Digitale", "Ingénierie des systèmes énergétiques et environnement"];

export default function EnsamRabatPage() {
  return (
    <EditorialShell eyebrow="ENSAM-R / UNIVERSITÉ MOHAMMED V DE RABAT" title="L’école qui fabrique demain." intro="Une institution de référence pour une ingénierie marocaine pluridisciplinaire, ouverte sur le monde et ancrée dans les transformations de son époque." visual={<div className="ensam-hero-image"><img src="/assets/ensam/campus.jpg" alt="Bâtiment de l’ENSAM Rabat" /></div>}>
      <div className="ensam-presentation-heading">
        <div className="ensam-presentation-title">
          <img src="/assets/ensam/logo.png" alt="Logo ENSAM Rabat" />
          <div>
            <span>École Nationale Supérieure</span>
            <h2>Présentation de l’école</h2>
          </div>
        </div>
        <a href="/assets/ensam/presentation-ensam-rabat.pdf" target="_blank" rel="noreferrer">Lire la présentation PDF <span aria-hidden="true">↗</span></a>
      </div>
      <div className="ensam-intro"><h2>Une institution de référence pour l’ingénierie de demain</h2><p>Composante de l’Université Mohammed V de Rabat, l’École Nationale Supérieure d’Arts et Métiers de Rabat forme des ingénieurs d’État pluridisciplinaires. La formation s’articule autour d’un cycle préparatoire intégré de deux ans, suivi d’un cycle ingénieur de trois ans.</p></div>
      <div className="ensam-columns"><div><SectionHeading index="07" title="Filières d’ingénierie" /><ol className="filieres">{filieres.map((filiere) => <li key={filiere}>{filiere}</li>)}</ol></div><div className="ensam-side-copy"><h2>Ouverture internationale</h2><p>L’ENSAM Rabat développe une politique de mobilité, de stages à l’étranger et de double diplomation en Europe et en Amérique du Nord.</p><h2>Vie étudiante</h2><p>Les clubs techniques et culturels permettent aux futurs ingénieurs de développer un leadership affirmé.</p><h2>Autres formations</h2><ul><li>Cycle Doctorat</li><li>Master en management de l’innovation et de la technologie</li><li>Master en Mécanique avancée</li></ul></div></div>
    </EditorialShell>
  );
}
