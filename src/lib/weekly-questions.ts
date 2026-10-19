// A year of weekly story questions, gentle at first and deeper later, in English and Canadian French.
// The sender can remove, reorder or add their own before sending.

export interface WeeklyQuestion { en: string; fr: string }

export const WEEKLY_QUESTIONS: WeeklyQuestion[] = [
  { en: 'Where were you born, and what was the house you grew up in like?', fr: 'Où êtes-vous né et à quoi ressemblait la maison de votre enfance ?' },
  { en: 'What are your earliest memories?', fr: 'Quels sont vos tout premiers souvenirs ?' },
  { en: 'What were your parents like when you were small?', fr: 'Comment étaient vos parents quand vous étiez petit ?' },
  { en: 'What do you remember about your grandparents?', fr: 'Quels souvenirs gardez-vous de vos grands-parents ?' },
  { en: 'Did you have brothers and sisters? What were they like growing up?', fr: 'Aviez-vous des frères et sœurs ? Comment étaient-ils en grandissant ?' },
  { en: 'What games did you play as a child, and who did you play with?', fr: 'À quels jeux jouiez-vous enfant, et avec qui ?' },
  { en: 'What was a typical Sunday like in your family?', fr: 'À quoi ressemblait un dimanche typique dans votre famille ?' },
  { en: 'What meals do you remember from your childhood? Who cooked them?', fr: 'Quels repas de votre enfance vous reviennent ? Qui les cuisinait ?' },
  { en: 'How did your family celebrate Christmas or other holidays?', fr: 'Comment votre famille célébrait-elle Noël ou les autres fêtes ?' },
  { en: 'What was your school like? Do you remember a favourite teacher?', fr: 'Comment était votre école ? Vous souvenez-vous d’un professeur préféré ?' },
  { en: 'Who was your best friend growing up, and what did you get up to?', fr: 'Qui était votre meilleur ami en grandissant, et que faisiez-vous ensemble ?' },
  { en: 'What chores did you have to do at home?', fr: 'Quelles tâches deviez-vous faire à la maison ?' },
  { en: 'What did you want to be when you grew up?', fr: 'Que vouliez-vous faire quand vous seriez grand ?' },
  { en: 'What music, radio shows or films did you love as a teenager?', fr: 'Quelles musiques, émissions de radio ou films adoriez-vous à l’adolescence ?' },
  { en: 'What was your first job, and how much were you paid?', fr: 'Quel a été votre premier emploi, et combien étiez-vous payé ?' },
  { en: 'What was the town or neighbourhood like where you lived as a young adult?', fr: 'Comment était la ville ou le quartier où vous viviez jeune adulte ?' },
  { en: 'How did you meet your husband, wife or partner?', fr: 'Comment avez-vous rencontré votre mari, votre femme ou votre conjoint ?' },
  { en: 'What do you remember about your wedding day?', fr: 'Quels souvenirs gardez-vous du jour de votre mariage ?' },
  { en: 'What was your first home together like?', fr: 'Comment était votre premier chez-vous ensemble ?' },
  { en: 'What do you remember about the day your first child was born?', fr: 'Quels souvenirs gardez-vous de la naissance de votre premier enfant ?' },
  { en: 'What was the hardest part of raising a family, and the best part?', fr: 'Quelle a été la partie la plus difficile d’élever une famille, et la plus belle ?' },
  { en: 'What work did you do for most of your life? What did you like about it?', fr: 'Quel travail avez-vous fait pendant la plus grande partie de votre vie ? Qu’aimiez-vous de ce travail ?' },
  { en: 'Who taught you the most important things you know?', fr: 'Qui vous a appris les choses les plus importantes que vous savez ?' },
  { en: 'Did your family ever move? Why, and what was it like?', fr: 'Votre famille a-t-elle déménagé ? Pourquoi, et comment cela s’est-il passé ?' },
  { en: 'Where did our family come from before that? What stories were passed down?', fr: 'D’où venait notre famille avant cela ? Quelles histoires se sont transmises ?' },
  { en: 'What family traditions do you hope we keep?', fr: 'Quelles traditions familiales souhaitez-vous que nous gardions ?' },
  { en: 'What is a recipe you would like the family to remember? How is it made?', fr: 'Quelle recette aimeriez-vous que la famille garde en mémoire ? Comment la prépare-t-on ?' },
  { en: 'What big world events do you remember living through? How did they touch your life?', fr: 'De quels grands événements du monde vous souvenez-vous ? Comment ont-ils touché votre vie ?' },
  { en: 'What was the best trip or holiday you ever took?', fr: 'Quel a été votre plus beau voyage ou vos plus belles vacances ?' },
  { en: 'What did you do for fun on weekends when you were raising your family?', fr: 'Que faisiez-vous pour vous amuser les fins de semaine quand vous éleviez votre famille ?' },
  { en: 'Tell a funny story that the family still laughs about.', fr: 'Racontez une histoire drôle dont la famille rit encore.' },
  { en: 'What is something you were proud of that few people know about?', fr: 'De quoi êtes-vous fier que peu de gens connaissent ?' },
  { en: 'What was a hard time in your life, and what helped you through it?', fr: 'Quel a été un moment difficile de votre vie, et qu’est-ce qui vous a aidé à le traverser ?' },
  { en: 'What did your faith, community or church mean to you?', fr: 'Que représentaient pour vous votre foi, votre communauté ou votre paroisse ?' },
  { en: 'What has changed most in the world since you were young?', fr: 'Qu’est-ce qui a le plus changé dans le monde depuis votre jeunesse ?' },
  { en: 'What things cost when you were young, like bread, a movie or a car?', fr: 'Combien coûtaient les choses dans votre jeunesse, comme le pain, le cinéma ou une voiture ?' },
  { en: 'Did you have pets? Tell us about a favourite.', fr: 'Avez-vous eu des animaux ? Parlez-nous de votre préféré.' },
  { en: 'What hobbies or skills have you loved over the years?', fr: 'Quels passe-temps ou talents avez-vous aimés au fil des ans ?' },
  { en: 'Who in the family were you closest to, and why?', fr: 'De qui étiez-vous le plus proche dans la famille, et pourquoi ?' },
  { en: 'What do you remember about your own parents’ later years?', fr: 'Quels souvenirs gardez-vous des dernières années de vos parents ?' },
  { en: 'What is the best advice you were ever given?', fr: 'Quel est le meilleur conseil qu’on vous ait donné ?' },
  { en: 'What would you tell your 20-year-old self?', fr: 'Que diriez-vous à la personne que vous étiez à 20 ans ?' },
  { en: 'What are you most grateful for?', fr: 'Pour quoi êtes-vous le plus reconnaissant ?' },
  { en: 'Is there a photo you treasure? Tell the story behind it.', fr: 'Y a-t-il une photo qui vous est chère ? Racontez son histoire.' },
  { en: 'What object in your home means the most to you, and why?', fr: 'Quel objet de votre maison compte le plus pour vous, et pourquoi ?' },
  { en: 'What does family mean to you?', fr: 'Que signifie la famille pour vous ?' },
  { en: 'What do you hope your grandchildren will remember about you?', fr: 'Qu’espérez-vous que vos petits-enfants retiennent de vous ?' },
  { en: 'What do you wish you had asked your own grandparents?', fr: 'Qu’auriez-vous aimé demander à vos propres grands-parents ?' },
  { en: 'What makes a good life, in your eyes?', fr: 'Qu’est-ce qu’une belle vie, selon vous ?' },
  { en: 'Is there anything you have always wanted to tell the family?', fr: 'Y a-t-il quelque chose que vous avez toujours voulu dire à la famille ?' },
  { en: 'Which of your stories should never be forgotten?', fr: 'Laquelle de vos histoires ne devrait jamais être oubliée ?' },
  { en: 'Looking back on this year of stories, what would you add?', fr: 'En repensant à cette année d’histoires, qu’aimeriez-vous ajouter ?' },
];

// Mirrors public._series_released: the first question opens on the start day, then one every 7 days.
export function questionsOpen(startOn: string, total: number, today = new Date()): number {
  const start = Date.UTC(+startOn.slice(0, 4), +startOn.slice(5, 7) - 1, +startOn.slice(8, 10));
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.floor((now - start) / 86_400_000);
  return Math.min(total, Math.max(0, 1 + Math.floor(days / 7)));
}

// The date (YYYY-MM-DD) question number `n` (1-based) opens.
export function opensOn(startOn: string, n: number): string {
  const d = new Date(`${startOn}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + (n - 1) * 7);
  return d.toISOString().slice(0, 10);
}

export const seriesLink = (token: string) => `${window.location.origin}/weekly/${token}`;
