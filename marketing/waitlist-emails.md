# Waitlist emails (English + French)

Drafts only: nothing is sent. They are ready to load into the email service once email sending (SMTP or Resend) is set up.

**Placeholders**
- `{first_name}`: from the waitlist; fall back to "there" / « » if blank
- `{position}`: their place in line
- `{invite_link}`: their personal link (`https://genesisheritage.netlify.app/?ref={code}#waitlist`)
- `{invited}`: how many people have joined from their link
- `{sender_name}`: the founder's first name
- `{app_link}`: `https://genesisheritage.netlify.app`

**Rules**
- Plain text style with one button or link.
- Every email ends with an unsubscribe link. Canada's anti-spam law (CASL) requires one, plus a mailing address.
- No invented numbers.

---

## 1. Welcome (send right after sign-up)

**Subject:** You're on the list, {first_name}
**Preview:** Your family's story has a home soon.

Hi {first_name},

Thanks for joining the Genesis Heritage waitlist. You're number {position}.

Genesis is a private place for your family's history: your tree, old photos, the stories, and the voices of the people telling them. It's easy enough for anyone in the family to use, and your data is never sold.

While you wait, one small thing worth doing this week: ask an older relative one question and record the answer on your phone. "How did you meet?" is a good place to start.

Want your family to get in with you? Share your personal link:
{invite_link}

Talk soon,
{sender_name}
Genesis Heritage

### FR

**Objet :** Vous êtes sur la liste, {first_name}
**Aperçu :** L'histoire de votre famille aura bientôt sa place.

Bonjour {first_name},

Merci de vous être inscrit(e) à la liste d'attente de Genesis Heritage. Vous êtes au rang {position}.

Genesis, c'est un espace privé pour l'histoire de votre famille : votre arbre, les vieilles photos, les histoires et la voix de ceux qui les racontent. C'est assez simple pour que toute la famille l'utilise, et vos données ne sont jamais vendues.

En attendant, un petit geste à faire cette semaine : posez une question à un aîné de la famille et enregistrez sa réponse avec votre téléphone. « Comment vous êtes-vous rencontrés? » est un bon début.

Vous voulez que votre famille entre avec vous? Partagez votre lien personnel :
{invite_link}

À bientôt,
{sender_name}
Genesis Heritage

---

## 2. Invite nudge #1 (about 3 days after sign-up)

**Subject:** Who in your family knows all the stories?
**Preview:** Send them your link.

Hi {first_name},

Every family has one: the aunt with the shoebox of photos, the cousin who's already traced three generations, the grandparent who remembers everything.

Genesis works best when they're in it with you. Send them your link and they'll join the waitlist with you:
{invite_link}

A quick text is enough. Something like: "I'm putting our family history together. Want in?"

{sender_name}

### FR

**Objet :** Qui connaît toutes les histoires dans votre famille?
**Aperçu :** Envoyez-lui votre lien.

Bonjour {first_name},

Chaque famille a la sienne : la tante avec la boîte de photos, le cousin qui a déjà remonté trois générations, la grand-mère qui se souvient de tout.

Genesis est encore mieux quand ces personnes y sont avec vous. Envoyez-leur votre lien pour qu'elles s'inscrivent avec vous :
{invite_link}

Un simple texto suffit, par exemple : « Je rassemble l'histoire de notre famille. Ça te tente? »

{sender_name}

---

## 3. Invite nudge #2 (about 10 days after sign-up; skip if `{invited}` ≥ 3)

**Subject:** One question to send your grandparents
**Preview:** It takes them two minutes.

Hi {first_name},

When Genesis opens, you'll be able to send a relative a private link with a few questions. They answer one memory at a time, by typing or speaking. No account, no password. Their answers go straight into your family's story library.

Think now about who you'd send it to first, and invite them to the waitlist so they're ready:
{invite_link}

{invited_line}

{sender_name}

> **`{invited_line}`:**
> - When `{invited}` is 0, leave it out.
> - When it is 1: "1 person has already joined from your link. Thank you!"
> - When it is more than 1: "{invited} people have already joined from your link. Thank you!"

### FR

**Objet :** Une question à envoyer à vos grands-parents
**Aperçu :** Deux minutes de leur temps.

Bonjour {first_name},

Dès l'ouverture de Genesis, vous pourrez envoyer à un proche un lien privé avec quelques questions. Il ou elle répond un souvenir à la fois, en écrivant ou en parlant. Pas de compte, pas de mot de passe. Les réponses arrivent directement dans la bibliothèque d'histoires de votre famille.

Pensez dès maintenant à qui vous l'enverrez en premier, et invitez cette personne sur la liste d'attente :
{invite_link}

{invited_line}

{sender_name}

> **`{invited_line}`:**
> - When `{invited}` is 1: « 1 personne s'est déjà inscrite grâce à votre lien. Merci! »
> - When it is more than 1: « {invited} personnes se sont déjà inscrites grâce à votre lien. Merci! »

---

## 4. Launch day

**Subject:** Genesis Heritage is open. You're in.
**Preview:** Start your family's story today, free.

Hi {first_name},

The day's here: Genesis Heritage is open, and you're one of the first in.

Start here: {app_link}

A good first ten minutes:
1. Add yourself, your parents and your grandparents. Names and rough years are enough.
2. Add one old photo and say who's in it.
3. Send one relative a question with **Ask a relative**.

It's free to start, and if you ever stop paying for Pro, everything you've added stays yours.

If anything is confusing, just reply to this email. A real person reads every reply.

Thank you for waiting with us,
{sender_name}

### FR

**Objet :** Genesis Heritage est ouvert. C'est votre tour.
**Aperçu :** Commencez l'histoire de votre famille aujourd'hui, gratuitement.

Bonjour {first_name},

C'est le grand jour : Genesis Heritage est ouvert, et vous êtes parmi les premiers.

Commencez ici : {app_link}

Dix bonnes premières minutes :
1. Ajoutez-vous, puis vos parents et vos grands-parents. Les noms et les années approximatives suffisent.
2. Ajoutez une vieille photo et indiquez qui y figure.
3. Envoyez une question à un proche avec **Demander à un proche**.

C'est gratuit pour commencer, et si vous cessez un jour de payer Pro, tout ce que vous avez ajouté reste à vous.

Si quelque chose n'est pas clair, répondez simplement à ce courriel. Une vraie personne lit chaque réponse.

Merci de votre patience,
{sender_name}

> **Before sending:** check that the button names match the app ("Ask a relative" / « Demander à un proche »).

---

## 5. Seven days after launch

**Subject:** How's your family tree coming along?
**Preview:** Two small ideas for this week.

Hi {first_name},

It's been a week since Genesis opened. Two ideas if you have a few minutes:

- **Run Tree Checkup.** It spots dates that don't add up and people listed twice, so your tree stays right.
- **Look at your Record Hints.** Genesis searches free records for the people in your tree and shows you why each one might be a match. You decide what to keep.

And one question for you: what's the one thing that would make Genesis more useful for your family? Just reply. I read every answer.

{sender_name}

### FR

**Objet :** Comment avance votre arbre?
**Aperçu :** Deux petites idées pour cette semaine.

Bonjour {first_name},

Ça fait une semaine que Genesis est ouvert. Deux idées si vous avez quelques minutes :

- **Lancez la vérification de l'arbre.** Elle repère les dates qui ne concordent pas et les personnes inscrites en double.
- **Regardez vos pistes d'archives.** Genesis cherche dans les archives gratuites pour les personnes de votre arbre et vous explique pourquoi chaque acte pourrait correspondre. C'est vous qui décidez quoi garder.

Et une question pour vous : qu'est-ce qui rendrait Genesis plus utile pour votre famille? Répondez simplement. Je lis toutes les réponses.

{sender_name}

> **Before sending:** match the feature names to the French menu labels in the app.

---

## Footer (all emails)

**EN:**
> You're receiving this because you joined the Genesis Heritage waitlist. [Unsubscribe] · [mailing address]

**FR:**
> Vous recevez ce courriel parce que vous vous êtes inscrit(e) à la liste d'attente de Genesis Heritage. [Se désabonner] · [adresse postale]
