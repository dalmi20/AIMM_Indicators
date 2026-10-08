# Simulateur AIMM

Simulateur interactif du déclenchement des indicateurs AIMM (Alliance Interoperability Maturity Model).
On choisit un attribut, puis on règle les mesures de ses indicateurs : le diagramme de séquence montre
quels indicateurs se déclenchent et quel niveau de maturité (L1 à L5) est atteint.

Stack : React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # version de production dans dist/
```

## Structure

```
src/
  data/aimm.ts                 Données : indicateurs (IND), attributs (ATTRS), états (ETAT), niveaux (LV)
  lib/types.ts                 Types (Indicator, Attribute, Value…)
  lib/engine.ts                Logique : score, évaluation de l'attribut, indications, boutons − / +
  components/SequenceDiagram   Diagramme SVG (lignes de vie = indicateurs, bandes = niveaux)
  components/IndicatorCard     Carte d'un indicateur : saisie, indication, 5 états
  components/Legend            Lecture d'un nœud + code couleur
  components/AttributePicker   Choix de l'attribut
  components/ui/               Composants shadcn/ui (button, card, badge)
  index.css                    Thème (tokens shadcn + couleurs AIMM, clair / sombre)
```

## Règles de calcul

- Score : `S = 0,2 × k`, k étant le niveau observé (1 à 5). Pour un questionnaire, k est la moyenne des réponses.
- Un indicateur évalué dans la bande Ln passe si `S > 0,2 × n` (0,8 au maximum), et si ses dépendances sont remplies.
- Toutes les bandes d'indicateurs passées : niveau suivant. Les règles de fin `MIN(...)` sont dans `ATTRS[].post`.
- Pourcentages : k1 < 30 % · k2 30–50 % · k3 50–70 % · k4 70–85 % · k5 > 85 %.
- X1 est binaire (contrat existant ou non).

Pour modifier une borne, un seuil ou un état, il suffit d'éditer `src/data/aimm.ts`.

## Points à valider

- X9, X23, X27 : bornes à définir (saisie directe du niveau k).
- X46 : bornes inversées proposées (≤ 15 % d'erreurs pour passer).
- X4 : seuil < 3 incompréhensions / mois, autres bornes proposées.

## Ajouter d'autres composants shadcn

Les composants utilisés sont déjà inclus dans `src/components/ui`. Pour en ajouter :

```bash
npx shadcn@latest add dialog
```
