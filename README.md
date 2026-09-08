# Calculatrice iOS

Une calculatrice native iOS écrite en SwiftUI.

## Fonctionnalités

1. **Parenthèses** — le bouton `( )` insère intelligemment une parenthèse
   ouvrante ou fermante selon le contexte, et une parenthèse ouverte sans
   être refermée est complétée automatiquement lors du calcul (`(2+3` est
   évalué comme `(2+3)`). Le moteur de calcul (`CalculatorEngine.swift`)
   est un vrai parseur (nombres, `+ - × ÷ %`, parenthèses imbriquées) qui
   respecte les priorités d'opérateurs, pas une simple évaluation gauche
   à droite.
2. **Historique daté illimité** — chaque calcul est horodaté et sauvegardé
   sur disque (JSON dans le dossier Documents de l'app), sans aucune
   limite de nombre d'entrées. L'historique persiste entre les lancements
   de l'app, est regroupé par jour ("Aujourd'hui", "Hier", puis par date),
   et un calcul peut être retouché en le retapant.
3. **Interface fraîche et fluide** — palette adaptative clair/sombre,
   dégradé sur le bouton `=`, animations "spring" au toucher de chaque
   touche, retour haptique, prévisualisation du résultat en direct
   pendant la saisie, et un geste de glissement sur l'écran pour effacer
   le dernier caractère.
4. **Boutons lisibles et bien espacés** — grille 4 colonnes avec un
   espacement généreux (18pt) entre chaque touche, cibles tactiles
   carrées suffisamment grandes, icônes système (SF Symbols) nettes pour
   les actions non numériques, afin de limiter les erreurs de frappe.

## Structure du projet

```
Calculator/
  App/CalculatorApp.swift          Point d'entrée SwiftUI
  Models/CalculatorEngine.swift    Tokenizer + parseur (parenthèses, priorités)
  Models/HistoryEntry.swift        Modèle d'une entrée d'historique
  Models/HistoryStore.swift        Persistance JSON illimitée, regroupement par jour
  ViewModels/CalculatorViewModel.swift  Logique de saisie et de calcul
  Views/ContentView.swift          Écran principal (affichage + clavier)
  Views/HistoryView.swift          Écran d'historique
  Views/CalculatorButtonView.swift Composant bouton réutilisable
  Views/Theme.swift                Couleurs adaptatives + haptique
project.yml                        Définition du projet pour XcodeGen
```

## Ouvrir et lancer le projet dans Xcode

Ce dépôt ne contient pas de `.xcodeproj` binaire (pour rester propre en
diffs Git) : il est généré à partir de `project.yml` avec
[XcodeGen](https://github.com/yonaskolb/XcodeGen).

```bash
# 1. Installer XcodeGen (une seule fois)
brew install xcodegen

# 2. Depuis la racine du dépôt, générer le projet Xcode
xcodegen generate

# 3. Ouvrir le projet généré
open Calculator.xcodeproj
```

Dans Xcode : sélectionner le scheme **Calculator**, choisir un simulateur
iOS (iOS 16 ou plus récent) ou un appareil, puis lancer avec `Cmd+R`.

### Alternative sans XcodeGen

Si vous préférez ne pas installer XcodeGen, créez un nouveau projet
**App** dans Xcode (interface SwiftUI, langage Swift, cible iOS 16+),
puis glissez le dossier `Calculator/` (sans son sous-dossier `App` si
Xcode a déjà généré son propre fichier `App.swift` — supprimez alors ce
doublon) dans le projet en cochant "Copy items if needed".

## Notes de conception

- Le symbole `%` est un opérateur postfixé qui divise par 100 la valeur
  (ou le groupe entre parenthèses) qui le précède immédiatement — un
  comportement simple et prévisible qui se compose naturellement avec les
  parenthèses (`(20+5)%` → `0.25`), plutôt que le comportement contextuel
  de l'app Calculatrice d'Apple (qui n'a pas de parenthèses).
- L'historique est stocké en JSON plutôt qu'en base de données : simple,
  robuste, et largement suffisant pour un volume de calculs personnels.
