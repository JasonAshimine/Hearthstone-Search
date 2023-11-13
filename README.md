# Hearthstone-Search
Hearthstone search parser in the style of Scryfall syntax

Created simple webpage to query Hearthstone cards with advanced queries. 
Parser is configurable with alternate keyword (text or t) and compound keywords  (is: search type, race, and spell school).
Syntax based on Scryfall using keyword:query format (text:draw) https://scryfall.com/docs/syntax.
Hearthstone data from https://hearthstonejson.com/

### Card Search

Card search is case-insensitive and search will satisfy all parameters.


#### Card Name / Text / Type / Hero / Rarity
Name is search by default. Many common terms has shortcuts.

    ogre t:"wrong enemy" is:minion class:neutral r:common
    Neutral Common Minion where name includes ogre and text includes "wrong enemy"

#### Cost / Attack / Health
Can search with numeric operators (<, >, <=, >=)

    c<=4 atk>2 hp<3
    Cards with cost 4 or more, attack more than 4 and hp less than 4

#### Shortcut 
Syntax includes shortcuts for common terms 

    is: type or race or spell school or rarity
    tag: mechanics or referenced tags

#### Negative Condition 
All keywords can be negated by prefixing them with hyphen **-**. This inverts the search to reject cards that matched search

    -t:draw is:minion
    Minions without draw in text

#### Regular Expression
Supports regular expression in search parameter

    t:/draw \d/
    Cards Text includes Draw # 

#### Exact Names
If you prefix search parameter with **!** you will find cards with exact name only (This is still case-insensitive).

    !Octosari
    the Card Octosari

    !"Boulderfist Ogre"
    the Card Boulderfist Ogre

#### OR condition
By default every search term is combined. All must match to find card.
If you want to search over a set of options, you can use special keyword **or/OR** or comma **,** between terms.

    t:draw or t:discover 
    t:draw, discover
    Both will get cards with text including draw or discover

#### Nesting 
Can nest condition inside parentheses **( )** to group together. 
This is most useful when combined the **OR** keyword

    r:legendary (is:undead or is:murloc)
    Legendary undead or murloc

## Keywords

 - **name:** Default search 
 - **text, t:** Card Text 
 - **class, classes, hero, h:** Card Class

 - **flavor:** Card Flavor
 - **cost, c, mv, m:** Card Cost
 - **attack, atk:** Card Attack
 - **Health, hp:** Card Health
 
 - **is:** type, races, spellSchool, rarity 
    - **type:** SPELL, MINION, WEAPON, HERO, LOCATION
    - **rarirty, r:** COMMON, RARE, EPIC, LEGENDARY, FREE
    - **races, race:** minion race i.e. Undead, Murloc, Beast, etc.
    - **spellSchool, school, spell:** FIRE, ARCANE, HOLY, SHADOW, FEL, NATURE, FROST
 - **set:** card set *Uses internal card set naming*
 - **id:** Internal ID 

 - **tag:** "mechanics", "referencedTags"
     - **mechanics, mechanic:** Card has mechanic
     - **referencedTags, reference, ref:** References mechanic
